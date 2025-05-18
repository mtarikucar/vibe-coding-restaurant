import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Report, ReportStatus, ReportType } from "./entities/report.entity";
import { ReportTemplate } from "./entities/report-template.entity";
import { ReportSchedule } from "./entities/report-schedule.entity";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { CreateReportTemplateDto } from "./dto/create-report-template.dto";
import { CreateReportScheduleDto } from "./dto/create-report-schedule.dto";
import { GenerateReportDto } from "./dto/generate-report.dto";
import { Order } from "../order/entities/order.entity";
import { OrderItem } from "../order/entities/order-item.entity";
import { Payment } from "../payment/entities/payment.entity";
import { MenuItem } from "../menu/entities/menu-item.entity";
import { Stock } from "../stock/entities/stock.entity";
import { User } from "../auth/entities/user.entity";
import * as fs from "fs";
import * as path from "path";
import * as PDFDocument from "pdfkit";
import * as ExcelJS from "exceljs";

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(ReportTemplate)
    private reportTemplateRepository: Repository<ReportTemplate>,
    @InjectRepository(ReportSchedule)
    private reportScheduleRepository: Repository<ReportSchedule>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // Report CRUD operations
  async createReport(createReportDto: CreateReportDto, userId: string, tenantId: string): Promise<Report> {
    const report = this.reportRepository.create({
      ...createReportDto,
      createdById: userId,
      tenantId,
      status: ReportStatus.DRAFT,
    });

    if (createReportDto.templateId) {
      const template = await this.reportTemplateRepository.findOne({
        where: { id: createReportDto.templateId },
      });
      if (!template) {
        throw new NotFoundException(`Template with ID ${createReportDto.templateId} not found`);
      }
      report.template = template;
    }

    if (createReportDto.scheduleId) {
      const schedule = await this.reportScheduleRepository.findOne({
        where: { id: createReportDto.scheduleId },
      });
      if (!schedule) {
        throw new NotFoundException(`Schedule with ID ${createReportDto.scheduleId} not found`);
      }
      report.schedule = schedule;
    }

    return this.reportRepository.save(report);
  }

  async findAllReports(userId: string, tenantId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: [
        { createdById: userId, tenantId },
        { isPublic: true, tenantId },
      ],
      relations: ["template", "schedule", "createdBy"],
      order: { createdAt: "DESC" },
    });
  }

  async findReportById(id: string, tenantId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId },
      relations: ["template", "schedule", "createdBy", "sharedWith"],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async updateReport(id: string, updateReportDto: UpdateReportDto, tenantId: string): Promise<Report> {
    const report = await this.findReportById(id, tenantId);
    
    Object.assign(report, updateReportDto);
    
    return this.reportRepository.save(report);
  }

  async removeReport(id: string, tenantId: string): Promise<void> {
    const report = await this.findReportById(id, tenantId);
    await this.reportRepository.remove(report);
  }

  // Report Template operations
  async createReportTemplate(
    createReportTemplateDto: CreateReportTemplateDto,
    userId: string,
    tenantId: string
  ): Promise<ReportTemplate> {
    const template = this.reportTemplateRepository.create({
      ...createReportTemplateDto,
      createdById: userId,
      tenantId,
    });

    return this.reportTemplateRepository.save(template);
  }

  async findAllReportTemplates(tenantId: string): Promise<ReportTemplate[]> {
    return this.reportTemplateRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  // Report Schedule operations
  async createReportSchedule(
    createReportScheduleDto: CreateReportScheduleDto,
    userId: string,
    tenantId: string
  ): Promise<ReportSchedule> {
    const schedule = this.reportScheduleRepository.create({
      ...createReportScheduleDto,
      createdById: userId,
      tenantId,
    });

    return this.reportScheduleRepository.save(schedule);
  }

  async findAllReportSchedules(tenantId: string): Promise<ReportSchedule[]> {
    return this.reportScheduleRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  // Report generation
  async generateReport(generateReportDto: GenerateReportDto, userId: string, tenantId: string): Promise<Report> {
    let report: Report;

    if (generateReportDto.reportId) {
      report = await this.findReportById(generateReportDto.reportId, tenantId);
    } else {
      // Create a new report
      report = this.reportRepository.create({
        name: `${generateReportDto.type} Report - ${new Date().toLocaleDateString()}`,
        type: generateReportDto.type,
        format: generateReportDto.format,
        filters: generateReportDto.filters,
        parameters: generateReportDto.parameters,
        startDate: generateReportDto.startDate ? new Date(generateReportDto.startDate) : undefined,
        endDate: generateReportDto.endDate ? new Date(generateReportDto.endDate) : undefined,
        createdById: userId,
        tenantId,
        status: ReportStatus.DRAFT,
      });

      if (generateReportDto.templateId) {
        const template = await this.reportTemplateRepository.findOne({
          where: { id: generateReportDto.templateId },
        });
        if (template) {
          report.template = template;
          report.templateId = template.id;
        }
      }

      report = await this.reportRepository.save(report);
    }

    // Generate report data based on type
    try {
      let reportData: any;
      switch (generateReportDto.type) {
        case ReportType.SALES:
          reportData = await this.generateSalesReport(report);
          break;
        case ReportType.INVENTORY:
          reportData = await this.generateInventoryReport(report);
          break;
        case ReportType.USERS:
          reportData = await this.generateUserReport(report);
          break;
        case ReportType.ORDERS:
          reportData = await this.generateOrderReport(report);
          break;
        case ReportType.PAYMENTS:
          reportData = await this.generatePaymentReport(report);
          break;
        case ReportType.CUSTOM:
          reportData = await this.generateCustomReport(report);
          break;
        default:
          throw new BadRequestException(`Unsupported report type: ${generateReportDto.type}`);
      }

      // Update report with generated data
      report.data = reportData;
      report.status = ReportStatus.GENERATED;
      report.generatedAt = new Date();

      // Generate file if needed
      if (generateReportDto.format) {
        const fileUrl = await this.exportReport(report, generateReportDto.format);
        report.fileUrl = fileUrl;
      }

      return this.reportRepository.save(report);
    } catch (error) {
      report.status = ReportStatus.FAILED;
      await this.reportRepository.save(report);
      throw error;
    }
  }

  // Helper methods for report generation
  private async generateSalesReport(report: Report): Promise<any> {
    const { startDate, endDate } = this.getDateRange(report);

    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ["order", "order.items", "order.items.menuItem", "order.waiter"],
    });

    // Calculate total sales
    const totalSales = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Group sales by date
    const salesByDate = {};
    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += Number(payment.amount);
    });

    // Group sales by payment method
    const salesByMethod = {};
    payments.forEach((payment) => {
      if (!salesByMethod[payment.method]) {
        salesByMethod[payment.method] = 0;
      }
      salesByMethod[payment.method] += Number(payment.amount);
    });

    // Get top selling items
    const itemSales = {};
    payments.forEach((payment) => {
      payment.order?.items?.forEach((item) => {
        const itemId = item.menuItem.id;
        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            id: itemId,
            name: item.menuItem.name,
            count: 0,
            total: 0,
          };
        }
        itemSales[itemId].count += item.quantity;
        itemSales[itemId].total += Number(item.price) * item.quantity;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10);

    return {
      totalSales,
      orderCount: payments.length,
      salesByDate: Object.entries(salesByDate).map(([date, amount]) => ({ date, amount })),
      salesByMethod: Object.entries(salesByMethod).map(([method, amount]) => ({ method, amount })),
      topItems,
      startDate,
      endDate,
      generatedAt: new Date(),
    };
  }

  private async generateInventoryReport(report: Report): Promise<any> {
    // Get all stock items
    const stockItems = await this.stockRepository.find({
      relations: ["menuItem", "menuItem.category"],
    });

    // Calculate inventory value
    const totalValue = stockItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.costPerUnit),
      0
    );

    // Group by category
    const stockByCategory = {};
    stockItems.forEach((item) => {
      const category = item.menuItem?.category?.name || "Uncategorized";
      if (!stockByCategory[category]) {
        stockByCategory[category] = {
          category,
          count: 0,
          value: 0,
          items: [],
        };
      }
      stockByCategory[category].count += 1;
      stockByCategory[category].value += Number(item.quantity) * Number(item.costPerUnit);
      stockByCategory[category].items.push({
        id: item.id,
        name: item.menuItem?.name,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        isLowStock: item.isLowStock,
        value: Number(item.quantity) * Number(item.costPerUnit),
      });
    });

    // Get low stock items
    const lowStockItems = stockItems
      .filter((item) => item.isLowStock)
      .map((item) => ({
        id: item.id,
        name: item.menuItem?.name,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        category: item.menuItem?.category?.name,
      }));

    return {
      totalItems: stockItems.length,
      totalValue,
      stockByCategory: Object.values(stockByCategory),
      lowStockItems,
      generatedAt: new Date(),
    };
  }

  private async generateUserReport(report: Report): Promise<any> {
    const { startDate, endDate } = this.getDateRange(report);

    // Get all users
    const users = await this.userRepository.find();

    // Get orders for the period
    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ["waiter", "items", "payment"],
    });

    // Calculate user activity
    const userActivity = {};
    users.forEach((user) => {
      userActivity[user.id] = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        orderCount: 0,
        totalSales: 0,
      };
    });

    orders.forEach((order) => {
      if (order.waiterId && userActivity[order.waiterId]) {
        userActivity[order.waiterId].orderCount += 1;
        if (order.payment) {
          userActivity[order.waiterId].totalSales += Number(order.payment.amount);
        }
      }
    });

    return {
      userCount: users.length,
      userActivity: Object.values(userActivity),
      startDate,
      endDate,
      generatedAt: new Date(),
    };
  }

  private async generateOrderReport(report: Report): Promise<any> {
    const { startDate, endDate } = this.getDateRange(report);

    // Get orders for the period
    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ["waiter", "table", "items", "items.menuItem", "payment"],
      order: { createdAt: "DESC" },
    });

    // Calculate order statistics
    const ordersByStatus = {};
    const ordersByDay = {};
    const ordersByHour = {};

    orders.forEach((order) => {
      // Group by status
      if (!ordersByStatus[order.status]) {
        ordersByStatus[order.status] = 0;
      }
      ordersByStatus[order.status] += 1;

      // Group by day
      const day = order.createdAt.toISOString().split("T")[0];
      if (!ordersByDay[day]) {
        ordersByDay[day] = 0;
      }
      ordersByDay[day] += 1;

      // Group by hour
      const hour = order.createdAt.getHours();
      if (!ordersByHour[hour]) {
        ordersByHour[hour] = 0;
      }
      ordersByHour[hour] += 1;
    });

    return {
      totalOrders: orders.length,
      ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({ status, count })),
      ordersByDay: Object.entries(ordersByDay).map(([day, count]) => ({ day, count })),
      ordersByHour: Object.entries(ordersByHour).map(([hour, count]) => ({ hour: Number(hour), count })),
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        waiter: order.waiter?.fullName,
        table: order.table?.number,
        createdAt: order.createdAt,
      })),
      startDate,
      endDate,
      generatedAt: new Date(),
    };
  }

  private async generatePaymentReport(report: Report): Promise<any> {
    const { startDate, endDate } = this.getDateRange(report);

    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ["order"],
      order: { createdAt: "DESC" },
    });

    // Calculate payment statistics
    const paymentsByMethod = {};
    const paymentsByStatus = {};
    const paymentsByDay = {};

    payments.forEach((payment) => {
      // Group by method
      if (!paymentsByMethod[payment.method]) {
        paymentsByMethod[payment.method] = {
          count: 0,
          amount: 0,
        };
      }
      paymentsByMethod[payment.method].count += 1;
      paymentsByMethod[payment.method].amount += Number(payment.amount);

      // Group by status
      if (!paymentsByStatus[payment.status]) {
        paymentsByStatus[payment.status] = {
          count: 0,
          amount: 0,
        };
      }
      paymentsByStatus[payment.status].count += 1;
      paymentsByStatus[payment.status].amount += Number(payment.amount);

      // Group by day
      const day = payment.createdAt.toISOString().split("T")[0];
      if (!paymentsByDay[day]) {
        paymentsByDay[day] = {
          count: 0,
          amount: 0,
        };
      }
      paymentsByDay[day].count += 1;
      paymentsByDay[day].amount += Number(payment.amount);
    });

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      paymentsByMethod: Object.entries(paymentsByMethod).map(([method, data]) => ({
        method,
        ...data,
      })),
      paymentsByStatus: Object.entries(paymentsByStatus).map(([status, data]) => ({
        status,
        ...data,
      })),
      paymentsByDay: Object.entries(paymentsByDay).map(([day, data]) => ({
        day,
        ...data,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
      startDate,
      endDate,
      generatedAt: new Date(),
    };
  }

  private async generateCustomReport(report: Report): Promise<any> {
    // Custom reports are based on the template structure
    if (!report.templateId) {
      throw new BadRequestException("Custom reports require a template");
    }

    const template = await this.reportTemplateRepository.findOne({
      where: { id: report.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${report.templateId} not found`);
    }

    // Execute queries based on template structure
    const reportData = {
      generatedAt: new Date(),
      sections: [],
    };

    // This is a simplified implementation
    // In a real application, you would dynamically execute queries based on the template structure
    if (template.structure.sections) {
      for (const section of template.structure.sections) {
        let sectionData;
        switch (section.dataSource) {
          case "sales":
            sectionData = await this.generateSalesReport(report);
            break;
          case "inventory":
            sectionData = await this.generateInventoryReport(report);
            break;
          case "users":
            sectionData = await this.generateUserReport(report);
            break;
          case "orders":
            sectionData = await this.generateOrderReport(report);
            break;
          case "payments":
            sectionData = await this.generatePaymentReport(report);
            break;
          default:
            sectionData = { message: "Unknown data source" };
        }

        reportData.sections.push({
          title: section.title,
          type: section.type,
          data: sectionData,
        });
      }
    }

    return reportData;
  }

  // Export report to different formats
  private async exportReport(report: Report, format: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads", "reports");
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `report_${report.id}_${Date.now()}`;
    let filePath;

    switch (format) {
      case "pdf":
        filePath = path.join(uploadsDir, `${fileName}.pdf`);
        await this.exportToPdf(report, filePath);
        break;
      case "excel":
        filePath = path.join(uploadsDir, `${fileName}.xlsx`);
        await this.exportToExcel(report, filePath);
        break;
      case "csv":
        filePath = path.join(uploadsDir, `${fileName}.csv`);
        await this.exportToCsv(report, filePath);
        break;
      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }

    // Return relative path
    return filePath.replace(process.cwd(), "");
  }

  private async exportToPdf(report: Report, filePath: string): Promise<void> {
    // This is a simplified implementation
    // In a real application, you would use a more sophisticated PDF generation library
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);
        
        // Add report header
        doc.fontSize(20).text(`${report.name}`, { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown();
        
        // Add report data based on type
        doc.fontSize(16).text("Report Data", { underline: true });
        doc.moveDown();
        
        // This is a very simplified example
        // In a real application, you would format the data properly
        doc.fontSize(12).text(JSON.stringify(report.data, null, 2));
        
        doc.end();
        
        stream.on("finish", () => {
          resolve();
        });
        
        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async exportToExcel(report: Report, filePath: string): Promise<void> {
    // This is a simplified implementation
    // In a real application, you would format the Excel file properly
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");
    
    // Add report header
    worksheet.addRow([report.name]);
    worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);
    
    // Add report data based on type
    // This is a very simplified example
    // In a real application, you would format the data properly
    if (report.data) {
      switch (report.type) {
        case ReportType.SALES:
          worksheet.addRow(["Sales Report"]);
          worksheet.addRow(["Total Sales", report.data.totalSales]);
          worksheet.addRow(["Order Count", report.data.orderCount]);
          worksheet.addRow([]);
          
          worksheet.addRow(["Date", "Amount"]);
          if (report.data.salesByDate) {
            report.data.salesByDate.forEach((item) => {
              worksheet.addRow([item.date, item.amount]);
            });
          }
          break;
          
        case ReportType.INVENTORY:
          worksheet.addRow(["Inventory Report"]);
          worksheet.addRow(["Total Items", report.data.totalItems]);
          worksheet.addRow(["Total Value", report.data.totalValue]);
          worksheet.addRow([]);
          
          worksheet.addRow(["Category", "Count", "Value"]);
          if (report.data.stockByCategory) {
            report.data.stockByCategory.forEach((item) => {
              worksheet.addRow([item.category, item.count, item.value]);
            });
          }
          break;
          
        default:
          worksheet.addRow(["Report Data"]);
          worksheet.addRow([JSON.stringify(report.data)]);
      }
    }
    
    await workbook.xlsx.writeFile(filePath);
  }

  private async exportToCsv(report: Report, filePath: string): Promise<void> {
    // This is a simplified implementation
    // In a real application, you would use a CSV generation library
    let csvContent = `"${report.name}"\n`;
    csvContent += `"Generated","${new Date().toLocaleString()}"\n\n`;
    
    // Add report data based on type
    // This is a very simplified example
    if (report.data) {
      switch (report.type) {
        case ReportType.SALES:
          csvContent += `"Sales Report"\n`;
          csvContent += `"Total Sales","${report.data.totalSales}"\n`;
          csvContent += `"Order Count","${report.data.orderCount}"\n\n`;
          
          csvContent += `"Date","Amount"\n`;
          if (report.data.salesByDate) {
            report.data.salesByDate.forEach((item) => {
              csvContent += `"${item.date}","${item.amount}"\n`;
            });
          }
          break;
          
        case ReportType.INVENTORY:
          csvContent += `"Inventory Report"\n`;
          csvContent += `"Total Items","${report.data.totalItems}"\n`;
          csvContent += `"Total Value","${report.data.totalValue}"\n\n`;
          
          csvContent += `"Category","Count","Value"\n`;
          if (report.data.stockByCategory) {
            report.data.stockByCategory.forEach((item) => {
              csvContent += `"${item.category}","${item.count}","${item.value}"\n`;
            });
          }
          break;
          
        default:
          csvContent += `"Report Data"\n`;
          csvContent += `"${JSON.stringify(report.data)}"\n`;
      }
    }
    
    fs.writeFileSync(filePath, csvContent);
  }

  // Helper method to get date range from report
  private getDateRange(report: Report): { startDate: Date; endDate: Date } {
    let startDate = report.startDate;
    let endDate = report.endDate;

    if (!startDate) {
      // Default to 30 days ago
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    if (!endDate) {
      // Default to today
      endDate = new Date();
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
}
