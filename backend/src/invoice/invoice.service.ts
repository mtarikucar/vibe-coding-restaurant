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
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Add company logo
        // doc.image('path/to/logo.png', 50, 45, { width: 50 });

        // Add invoice header
        doc.fontSize(20).text('INVOICE', { align: 'right' });
        doc.fontSize(10).text(invoice.invoiceNumber, { align: 'right' });
        doc.moveDown();

        // Add company info
        doc.fontSize(10).text('Restaurant Management System', { align: 'left' });
        doc.fontSize(10).text('123 Main Street', { align: 'left' });
        doc.fontSize(10).text('City, State ZIP', { align: 'left' });
        doc.fontSize(10).text('Phone: (123) 456-7890', { align: 'left' });
        doc.fontSize(10).text('Email: info@restaurant.com', { align: 'left' });
        doc.moveDown();

        // Add customer info if available
        if (invoice.customerName) {
          doc.fontSize(10).text('Bill To:', { align: 'left' });
          doc.fontSize(10).text(invoice.customerName, { align: 'left' });
          if (invoice.customerAddress) {
            doc.fontSize(10).text(invoice.customerAddress, { align: 'left' });
          }
          if (invoice.customerEmail) {
            doc.fontSize(10).text(`Email: ${invoice.customerEmail}`, { align: 'left' });
          }
          if (invoice.customerPhone) {
            doc.fontSize(10).text(`Phone: ${invoice.customerPhone}`, { align: 'left' });
          }
          doc.moveDown();
        }

        // Add invoice details
        doc.fontSize(10).text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, { align: 'right' });
        if (invoice.dueDate) {
          doc.fontSize(10).text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, { align: 'right' });
        }
        doc.fontSize(10).text(`Order Number: ${invoice.order.orderNumber}`, { align: 'right' });
        doc.fontSize(10).text(`Table: ${invoice.order.table.number}`, { align: 'right' });
        doc.moveDown();

        // Add order items
        doc.fontSize(12).text('Order Items', { underline: true });
        doc.moveDown();

        // Create table header
        const tableTop = doc.y;
        doc.fontSize(10)
          .text('Item', 50, tableTop)
          .text('Quantity', 250, tableTop)
          .text('Price', 350, tableTop)
          .text('Total', 450, tableTop);

        // Draw line
        doc.moveTo(50, doc.y + 5)
          .lineTo(550, doc.y + 5)
          .stroke();
        doc.moveDown();

        // Add items
        let tableY = doc.y;
        invoice.order.items.forEach((item) => {
          doc.fontSize(10)
            .text(item.menuItem.name, 50, tableY)
            .text(item.quantity.toString(), 250, tableY)
            .text(`$${item.price.toFixed(2)}`, 350, tableY)
            .text(`$${(item.price * item.quantity).toFixed(2)}`, 450, tableY);
          tableY = doc.y + 15;
          doc.moveDown();
        });

        // Draw line
        doc.moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
        doc.moveDown();

        // Add totals
        doc.fontSize(10)
          .text('Subtotal:', 350, doc.y)
          .text(`$${invoice.subtotal.toFixed(2)}`, 450, doc.y);
        doc.moveDown();

        if (invoice.taxAmount > 0) {
          doc.fontSize(10)
            .text('Tax:', 350, doc.y)
            .text(`$${invoice.taxAmount.toFixed(2)}`, 450, doc.y);
          doc.moveDown();
        }

        if (invoice.discountAmount > 0) {
          doc.fontSize(10)
            .text('Discount:', 350, doc.y)
            .text(`$${invoice.discountAmount.toFixed(2)}`, 450, doc.y);
          doc.moveDown();
        }

        doc.fontSize(12)
          .text('Total:', 350, doc.y)
          .text(`$${invoice.totalAmount.toFixed(2)}`, 450, doc.y);
        doc.moveDown();

        // Add payment info if available
        if (invoice.payment) {
          doc.moveDown();
          doc.fontSize(12).text('Payment Information', { underline: true });
          doc.moveDown();
          doc.fontSize(10)
            .text(`Payment Method: ${invoice.payment.method}`, 50, doc.y);
          doc.fontSize(10)
            .text(`Payment Status: ${invoice.payment.status}`, 50, doc.y + 15);
          if (invoice.payment.transactionId) {
            doc.fontSize(10)
              .text(`Transaction ID: ${invoice.payment.transactionId}`, 50, doc.y + 30);
          }
          doc.moveDown();
        }

        // Add notes if available
        if (invoice.notes) {
          doc.moveDown();
          doc.fontSize(12).text('Notes', { underline: true });
          doc.moveDown();
          doc.fontSize(10).text(invoice.notes);
          doc.moveDown();
        }

        // Add footer
        doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          const relativePath = filePath.replace(process.cwd(), '');
          resolve(relativePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
