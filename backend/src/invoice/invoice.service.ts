import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { OrderService } from '../order/order.service';
import { PaymentService } from '../payment/payment.service';
import { OrderStatus } from '../order/entities/order.entity';
import { PaymentStatus } from '../payment/entities/payment.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: string, tenantId: string): Promise<Invoice> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if order exists
      const order = await this.orderService.findOne(createInvoiceDto.orderId);

      // Check if order is in a valid state for invoicing
      if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.SERVED) {
        throw new BadRequestException(
          `Order ${order.orderNumber} is not ready for invoicing. Status: ${order.status}`,
        );
      }

      // Check if invoice already exists for this order
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { orderId: order.id },
      });

      if (existingInvoice) {
        throw new ConflictException(
          `Invoice for order ${order.orderNumber} already exists`,
        );
      }

      // Get payment if available
      let payment = null;
      if (createInvoiceDto.paymentId) {
        payment = await this.paymentService.findOne(createInvoiceDto.paymentId);
      } else {
        // Try to find payment by order
        try {
          payment = await this.paymentService.findByOrder(order.id);
        } catch (error) {
          // No payment exists yet, which is fine for draft invoices
        }
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      // Set invoice status based on payment status
      let invoiceStatus = createInvoiceDto.status || InvoiceStatus.DRAFT;
      if (payment && payment.status === PaymentStatus.COMPLETED) {
        invoiceStatus = InvoiceStatus.PAID;
      }

      // Create invoice
      const invoice = this.invoiceRepository.create({
        ...createInvoiceDto,
        invoiceNumber,
        status: invoiceStatus,
        type: createInvoiceDto.type || InvoiceType.STANDARD,
        issueDate: createInvoiceDto.issueDate || new Date(),
        subtotal: order.totalAmount,
        totalAmount: order.totalAmount,
        paymentId: payment?.id,
        createdById: userId,
        tenantId,
      });

      // Save invoice
      const savedInvoice = await this.invoiceRepository.save(invoice);

      // Generate PDF if invoice is issued or paid
      if (
        savedInvoice.status === InvoiceStatus.ISSUED ||
        savedInvoice.status === InvoiceStatus.PAID
      ) {
        const fileUrl = await this.generateInvoicePdf(savedInvoice.id);
        savedInvoice.fileUrl = fileUrl;
        await this.invoiceRepository.save(savedInvoice);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return invoice with relations
      return this.findOne(savedInvoice.id);
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findAll(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId },
      relations: ['order', 'payment', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: [
        'order',
        'order.items',
        'order.items.menuItem',
        'order.table',
        'order.waiter',
        'payment',
        'createdBy',
      ],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByOrder(orderId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { orderId },
      relations: [
        'order',
        'order.items',
        'order.items.menuItem',
        'order.table',
        'order.waiter',
        'payment',
        'createdBy',
      ],
    });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice for order with ID ${orderId} not found`,
      );
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Don't allow updating if invoice is already issued or paid
    if (
      invoice.status === InvoiceStatus.ISSUED ||
      invoice.status === InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        `Cannot update invoice ${invoice.invoiceNumber} because it is already ${invoice.status}`,
      );
    }

    // Update invoice
    Object.assign(invoice, updateInvoiceDto);

    // Save invoice
    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Generate PDF if invoice is now issued or paid
    if (
      updatedInvoice.status === InvoiceStatus.ISSUED ||
      updatedInvoice.status === InvoiceStatus.PAID
    ) {
      const fileUrl = await this.generateInvoicePdf(updatedInvoice.id);
      updatedInvoice.fileUrl = fileUrl;
      await this.invoiceRepository.save(updatedInvoice);
    }

    return this.findOne(updatedInvoice.id);
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = status;

    // Generate PDF if invoice is now issued or paid
    if (
      status === InvoiceStatus.ISSUED ||
      status === InvoiceStatus.PAID
    ) {
      const fileUrl = await this.generateInvoicePdf(invoice.id);
      invoice.fileUrl = fileUrl;
    }

    return this.invoiceRepository.save(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);

    // Don't allow deleting if invoice is already issued or paid
    if (
      invoice.status === InvoiceStatus.ISSUED ||
      invoice.status === InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        `Cannot delete invoice ${invoice.invoiceNumber} because it is already ${invoice.status}`,
      );
    }

    // Delete invoice file if exists
    if (invoice.fileUrl) {
      const filePath = path.join(process.cwd(), invoice.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.invoiceRepository.remove(invoice);
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get count of invoices for this tenant in the current year/month
    const count = await this.invoiceRepository.count({
      where: {
        tenantId,
        createdAt: new Date(`${year}-${month}-01`),
      },
    });
    
    // Generate invoice number in format: INV-YYYYMM-XXXX
    const sequenceNumber = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequenceNumber}`;
  }

  async generateInvoicePdf(invoiceId: string): Promise<string> {
    const invoice = await this.findOne(invoiceId);
    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: 'Restaurant Management System',
            Subject: 'Invoice',
            Keywords: 'invoice, restaurant, billing',
          }
        });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header section
        this.addInvoiceHeader(doc, invoice);

        // Company and customer info
        this.addCompanyAndCustomerInfo(doc, invoice);

        // Invoice details
        this.addInvoiceDetails(doc, invoice);

        // Items table
        this.addItemsTable(doc, invoice);

        // Totals section
        this.addTotalsSection(doc, invoice);

        // Footer
        this.addInvoiceFooter(doc, invoice);



        doc.end();

        stream.on('finish', () => {
          resolve(`uploads/invoices/${fileName}`);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private addInvoiceHeader(doc: any, invoice: any): void {
    // Company logo placeholder
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('RESTAURANT', 50, 50)
       .fontSize(12)
       .fillColor('#6b7280')
       .text('Management System', 50, 80);

    // Invoice title and number
    doc.fontSize(28)
       .fillColor('#1f2937')
       .text('INVOICE', 400, 50, { align: 'right' })
       .fontSize(14)
       .fillColor('#6b7280')
       .text(`#${invoice.invoiceNumber}`, 400, 85, { align: 'right' });

    // Add a line separator
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .strokeColor('#e5e7eb')
       .stroke();
  }

  private addCompanyAndCustomerInfo(doc: any, invoice: any): void {
    const startY = 140;

    // Company information (left side)
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('From:', 50, startY)
       .fontSize(11)
       .fillColor('#374151')
       .text('Restaurant Name', 50, startY + 20)
       .text('123 Restaurant Street', 50, startY + 35)
       .text('City, State 12345', 50, startY + 50)
       .text('Phone: (555) 123-4567', 50, startY + 65)
       .text('Email: info@restaurant.com', 50, startY + 80);

    // Customer information (right side)
    if (invoice.customerName || invoice.customerEmail) {
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Bill To:', 350, startY)
         .fontSize(11)
         .fillColor('#374151');

      let customerY = startY + 20;
      if (invoice.customerName) {
        doc.text(invoice.customerName, 350, customerY);
        customerY += 15;
      }
      if (invoice.customerAddress) {
        doc.text(invoice.customerAddress, 350, customerY);
        customerY += 15;
      }
      if (invoice.customerEmail) {
        doc.text(invoice.customerEmail, 350, customerY);
        customerY += 15;
      }
      if (invoice.customerPhone) {
        doc.text(invoice.customerPhone, 350, customerY);
      }
    }
  }

  private addInvoiceDetails(doc: any, invoice: any): void {
    const startY = 280;

    // Invoice details
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('Invoice Details:', 50, startY)
       .fontSize(11)
       .fillColor('#374151')
       .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, startY + 20)
       .text(`Order Number: ${invoice.order.orderNumber}`, 50, startY + 35)
       .text(`Table: ${invoice.order.table?.number || 'N/A'}`, 50, startY + 50)
       .text(`Waiter: ${invoice.order.waiter?.fullName || 'N/A'}`, 50, startY + 65);

    if (invoice.dueDate) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, startY + 20);
    }

    doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, startY + 35);
  }

  private addItemsTable(doc: any, invoice: any): void {
    const startY = 380;
    const tableTop = startY;
    const itemCodeX = 50;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 400;
    const amountX = 480;

    // Table header
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('Item', itemCodeX, tableTop)
       .text('Description', descriptionX, tableTop)
       .text('Qty', quantityX, tableTop)
       .text('Price', priceX, tableTop)
       .text('Amount', amountX, tableTop);

    // Header line
    doc.moveTo(itemCodeX, tableTop + 20)
       .lineTo(amountX + 70, tableTop + 20)
       .strokeColor('#e5e7eb')
       .stroke();

    // Table rows
    let currentY = tableTop + 35;
    doc.fontSize(10).fillColor('#374151');

    invoice.order.items.forEach((item: any, index: number) => {
      const itemTotal = item.quantity * item.price;

      doc.text(item.menuItem.name, itemCodeX, currentY)
         .text(item.menuItem.description || '', descriptionX, currentY, { width: 180 })
         .text(item.quantity.toString(), quantityX, currentY)
         .text(`$${item.price.toFixed(2)}`, priceX, currentY)
         .text(`$${itemTotal.toFixed(2)}`, amountX, currentY);

      if (item.notes) {
        currentY += 15;
        doc.fontSize(9)
           .fillColor('#6b7280')
           .text(`Note: ${item.notes}`, descriptionX, currentY, { width: 180 })
           .fontSize(10)
           .fillColor('#374151');
      }

      currentY += 25;

      // Add page break if needed
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Bottom line
    doc.moveTo(itemCodeX, currentY)
       .lineTo(amountX + 70, currentY)
       .strokeColor('#e5e7eb')
       .stroke();
  }

  private addTotalsSection(doc: any, invoice: any): void {
    const startY = doc.y + 20;
    const labelX = 400;
    const amountX = 480;

    doc.fontSize(11).fillColor('#374151');

    // Subtotal
    doc.text('Subtotal:', labelX, startY)
       .text(`$${invoice.subtotal.toFixed(2)}`, amountX, startY);

    // Tax
    if (invoice.taxAmount > 0) {
      doc.text('Tax:', labelX, startY + 20)
         .text(`$${invoice.taxAmount.toFixed(2)}`, amountX, startY + 20);
    }

    // Discount
    if (invoice.discountAmount > 0) {
      doc.text('Discount:', labelX, startY + 40)
         .text(`-$${invoice.discountAmount.toFixed(2)}`, amountX, startY + 40);
    }

    // Total line
    const totalY = startY + (invoice.taxAmount > 0 ? 60 : 40) + (invoice.discountAmount > 0 ? 20 : 0);
    doc.moveTo(labelX, totalY)
       .lineTo(amountX + 70, totalY)
       .strokeColor('#e5e7eb')
       .stroke();

    // Total amount
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Total:', labelX, totalY + 10)
       .text(`$${invoice.totalAmount.toFixed(2)}`, amountX, totalY + 10);
  }

  private addInvoiceFooter(doc: any, invoice: any): void {
    const footerY = 750;

    // Notes
    if (invoice.notes) {
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Notes:', 50, footerY)
         .text(invoice.notes, 50, footerY + 15, { width: 500 });
    }

    // Footer text
    doc.fontSize(9)
       .fillColor('#9ca3af')
       .text('Thank you for your business!', 50, footerY + 50)
       .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, footerY + 65);
  }
}
