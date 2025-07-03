import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Order, OrderStatus } from "../order/entities/order.entity";
import { OrderItem } from "../order/entities/order-item.entity";
import { Payment, PaymentStatus } from "../payment/entities/payment.entity";
import { Table, TableStatus } from "../table/entities/table.entity";
import { Stock } from "../stock/entities/stock.entity";
import { User } from "../auth/entities/user.entity";
import { MenuItem } from "../menu/entities/menu-item.entity";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>
  ) {}

  // Helper method to calculate trend percentage
  private calculateTrend(
    currentValue: number,
    previousValue: number
  ): { trend: "up" | "down" | "neutral"; percentage: number } {
    if (previousValue === 0) {
      return { trend: currentValue > 0 ? "up" : "neutral", percentage: 100 };
    }

    const difference = currentValue - previousValue;
    const percentage = Math.abs(Math.round((difference / previousValue) * 100));

    if (difference > 0) {
      return { trend: "up", percentage };
    } else if (difference < 0) {
      return { trend: "down", percentage };
    } else {
      return { trend: "neutral", percentage: 0 };
    }
  }

  // Helper method to get previous period date range
  private getPreviousPeriodRange(period: string): {
    startDate: Date;
    endDate: Date;
  } {
    const { startDate: currentStartDate, endDate: currentEndDate } =
      this.getDateRange(period);
    const duration = currentEndDate.getTime() - currentStartDate.getTime();

    const endDate = new Date(currentStartDate.getTime() - 1); // 1ms before current period
    const startDate = new Date(endDate.getTime() - duration);

    return { startDate, endDate };
  }

  async getStats(period: string): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period);
    const { startDate: prevStartDate, endDate: prevEndDate } =
      this.getPreviousPeriodRange(period);

    // Get total sales for current period
    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalSales = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Get total sales for previous period
    const prevPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(prevStartDate, prevEndDate),
      },
    });

    const prevTotalSales = prevPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Calculate sales trend
    const salesTrend = this.calculateTrend(totalSales, prevTotalSales);

    // Get order count for current period
    const orderCount = await this.orderRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    // Get order count for previous period
    const prevOrderCount = await this.orderRepository.count({
      where: {
        createdAt: Between(prevStartDate, prevEndDate),
      },
    });

    // Calculate order count trend
    const orderCountTrend = this.calculateTrend(orderCount, prevOrderCount);

    // Get active orders
    const activeOrdersCount = await this.orderRepository.count({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.PREPARING },
        { status: OrderStatus.READY },
      ],
    });

    // Calculate average preparation time for completed orders
    const completedOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
    });

    let totalPrepTime = 0;
    let orderWithPrepTimeCount = 0;

    completedOrders.forEach((order) => {
      if (order.completedAt && order.createdAt) {
        const prepTime =
          (order.completedAt.getTime() - order.createdAt.getTime()) /
          (1000 * 60); // in minutes
        totalPrepTime += prepTime;
        orderWithPrepTimeCount++;
      }
    });

    const avgPrepTime =
      orderWithPrepTimeCount > 0
        ? Math.round(totalPrepTime / orderWithPrepTimeCount)
        : 0;

    // Calculate previous period average preparation time
    const prevCompletedOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: Between(prevStartDate, prevEndDate),
      },
    });

    let prevTotalPrepTime = 0;
    let prevOrderWithPrepTimeCount = 0;

    prevCompletedOrders.forEach((order) => {
      if (order.completedAt && order.createdAt) {
        const prepTime =
          (order.completedAt.getTime() - order.createdAt.getTime()) /
          (1000 * 60); // in minutes
        prevTotalPrepTime += prepTime;
        prevOrderWithPrepTimeCount++;
      }
    });

    const prevAvgPrepTime =
      prevOrderWithPrepTimeCount > 0
        ? Math.round(prevTotalPrepTime / prevOrderWithPrepTimeCount)
        : 0;

    // Calculate prep time trend (for prep time, lower is better so we invert the trend)
    const prepTimeTrend = this.calculateTrend(avgPrepTime, prevAvgPrepTime);
    prepTimeTrend.trend =
      prepTimeTrend.trend === "up"
        ? "down"
        : prepTimeTrend.trend === "down"
          ? "up"
          : "neutral";

    // Get active tables
    const activeTablesCount = await this.tableRepository.count({
      where: {
        status: TableStatus.OCCUPIED,
      },
    });

    // Get low stock items
    const lowStockCount = await this.stockRepository.count({
      where: {
        isLowStock: true,
      },
    });

    // Get user count
    const userCount = await this.userRepository.count();

    return {
      totalSales,
      salesTrend,
      orderCount,
      orderCountTrend,
      activeOrdersCount,
      avgPrepTime,
      prepTimeTrend,
      activeTablesCount,
      lowStockCount,
      userCount,
      period,
    };
  }

  async getSales(period: string): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period);

    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      relations: ["order"],
      order: { createdAt: "ASC" },
    });

    // Group by date
    const salesByDate = {};

    payments.forEach((payment) => {
      const date = this.formatDate(payment.createdAt, period);
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += Number(payment.amount);
    });

    // Convert to array
    const salesData = Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount,
    }));

    return {
      salesData,
      period,
    };
  }

  async getPopularItems(limit: number): Promise<any> {
    // Get completed orders
    const completedOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.COMPLETED,
      },
      relations: ["items", "items.menuItem"],
    });

    // Count items
    const itemCounts = {};
    let totalItems = 0;

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const itemId = item.menuItem.id;
        const itemName = item.menuItem.name;

        if (!itemCounts[itemId]) {
          itemCounts[itemId] = {
            id: itemId,
            name: itemName,
            count: 0,
          };
        }

        itemCounts[itemId].count += item.quantity;
        totalItems += item.quantity;
      });
    });

    // Convert to array and sort
    const popularItems = Object.values(itemCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit)
      .map((item: any) => ({
        ...item,
        percentage: Math.round((item.count / totalItems) * 100),
      }));

    return popularItems;
  }

  async getActiveOrders(): Promise<any> {
    return this.orderRepository.find({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.PREPARING },
        { status: OrderStatus.READY },
      ],
      relations: ["items", "items.menuItem", "table", "waiter"],
      order: { createdAt: "ASC" },
    });
  }

  async getActiveTables(): Promise<any> {
    return this.tableRepository.find({
      where: {
        status: TableStatus.OCCUPIED,
      },
      relations: ["orders", "orders.items"],
      order: { number: "ASC" },
    });
  }

  async getLowStock(): Promise<any> {
    return this.stockRepository.find({
      where: {
        isLowStock: true,
      },
      relations: ["menuItem", "menuItem.category"],
      order: { menuItem: { name: "ASC" } },
    });
  }

  async getCategorySales(period: string): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period);

    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      relations: [
        "order",
        "order.items",
        "order.items.menuItem",
        "order.items.menuItem.category",
      ],
      order: { createdAt: "ASC" },
    });

    // Group by category
    const salesByCategory = {};

    payments.forEach((payment) => {
      if (payment.order && payment.order.items) {
        payment.order.items.forEach((item) => {
          if (item.menuItem && item.menuItem.category) {
            const category = item.menuItem.category.name;
            if (!salesByCategory[category]) {
              salesByCategory[category] = 0;
            }
            salesByCategory[category] += Number(item.price) * item.quantity;
          }
        });
      }
    });

    // Convert to array and sort by amount
    const categorySalesArray = Object.entries(salesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a: any, b: any) => b.amount - a.amount);

    return {
      categorySales: categorySalesArray,
      period,
      startDate,
      endDate,
    };
  }

  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
    }

    return { startDate, endDate };
  }

  private formatDate(date: Date, period: string): string {
    const d = new Date(date);

    switch (period) {
      case "day":
        return `${d.getHours()}:00`;
      case "week":
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      case "month":
        return `${d.getDate()}`;
      case "year":
        return [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][d.getMonth()];
      default:
        return `${d.getHours()}:00`;
    }
  }

  async getCustomReport(
    startDateStr: string,
    endDateStr: string,
    type: string
  ): Promise<any> {
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException("Start date and end date are required");
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid date format");
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    switch (type) {
      case "sales":
        return this.getCustomSalesReport(startDate, endDate);
      case "inventory":
        return this.getCustomInventoryReport(startDate, endDate);
      case "users":
        return this.getCustomUserReport(startDate, endDate);
      default:
        throw new BadRequestException("Invalid report type");
    }
  }

  private async getCustomSalesReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      relations: [
        "order",
        "order.items",
        "order.items.menuItem",
        "order.items.menuItem.category",
        "order.waiter",
      ],
      order: { createdAt: "ASC" },
    });

    // Calculate total sales
    const totalSales = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Group by date
    const salesByDate = {};
    const salesByCategory = {};
    const salesByWaiter = {};

    payments.forEach((payment) => {
      // Group by date
      const dateStr = payment.createdAt.toISOString().split("T")[0];
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = 0;
      }
      salesByDate[dateStr] += Number(payment.amount);

      // Group by category
      if (payment.order && payment.order.items) {
        payment.order.items.forEach((item) => {
          if (item.menuItem && item.menuItem.category) {
            const category = item.menuItem.category.name;
            if (!salesByCategory[category]) {
              salesByCategory[category] = 0;
            }
            salesByCategory[category] += Number(item.price) * item.quantity;
          }
        });
      }

      // Group by waiter
      if (payment.order && payment.order.waiter) {
        const waiterName = payment.order.waiter.fullName;
        if (!salesByWaiter[waiterName]) {
          salesByWaiter[waiterName] = 0;
        }
        salesByWaiter[waiterName] += Number(payment.amount);
      }
    });

    // Convert to arrays
    const salesByDateArray = Object.entries(salesByDate).map(
      ([date, amount]) => ({
        date,
        amount,
      })
    );

    const salesByCategoryArray = Object.entries(salesByCategory).map(
      ([category, amount]) => ({
        category,
        amount,
      })
    );

    const salesByWaiterArray = Object.entries(salesByWaiter).map(
      ([waiter, amount]) => ({
        waiter,
        amount,
      })
    );

    return {
      totalSales,
      salesByDate: salesByDateArray,
      salesByCategory: salesByCategoryArray,
      salesByWaiter: salesByWaiterArray,
      startDate,
      endDate,
    };
  }

  private async getCustomInventoryReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Get stock items
    const stockItems = await this.stockRepository.find({
      relations: ["menuItem", "menuItem.category"],
    });

    // Get order items for the period to calculate usage
    const orders = await this.orderRepository.find({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      relations: ["items", "items.menuItem"],
    });

    // Calculate usage
    const itemUsage = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemId = item.menuItem.id;
        if (!itemUsage[itemId]) {
          itemUsage[itemId] = 0;
        }
        itemUsage[itemId] += item.quantity;
      });
    });

    // Prepare report data
    const inventoryData = stockItems.map((stock) => {
      const itemId = stock.menuItem.id;
      const usage = itemUsage[itemId] || 0;

      return {
        id: itemId,
        name: stock.menuItem.name,
        category: stock.menuItem.category.name,
        currentStock: stock.quantity,
        minStock: stock.minQuantity,
        usage,
        isLowStock: stock.isLowStock,
      };
    });

    return {
      inventoryData,
      startDate,
      endDate,
    };
  }

  private async getCustomUserReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Get users
    const users = await this.userRepository.find();

    // Get orders for the period
    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ["waiter", "items"],
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
      if (order.waiter) {
        const userId = order.waiter.id;
        if (userActivity[userId]) {
          userActivity[userId].orderCount += 1;

          // Calculate total for this order
          const orderTotal = order.items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0
          );

          userActivity[userId].totalSales += orderTotal;
        }
      }
    });

    // Convert to array
    const userActivityArray = Object.values(userActivity);

    return {
      userActivity: userActivityArray,
      startDate,
      endDate,
    };
  }

  async exportSalesReport(
    startDateStr: string,
    endDateStr: string
  ): Promise<string> {
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException("Start date and end date are required");
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid date format");
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      relations: [
        "order",
        "order.items",
        "order.items.menuItem",
        "order.waiter",
        "order.table",
      ],
      order: { createdAt: "ASC" },
    });

    // Prepare CSV data
    let csvData = "Date,Order ID,Table,Waiter,Items,Total\n";

    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split("T")[0];
      const orderId = payment.order ? payment.order.id : "N/A";
      const table =
        payment.order && payment.order.table
          ? payment.order.table.number
          : "N/A";
      const waiter =
        payment.order && payment.order.waiter
          ? payment.order.waiter.fullName
          : "N/A";

      let items = "";
      if (payment.order && payment.order.items) {
        items = payment.order.items
          .map((item) => `${item.menuItem.name} (${item.quantity})`)
          .join(", ");
      }

      const total = payment.amount;

      csvData += `${date},${orderId},${table},${waiter},"${items}",${total}\n`;
    });

    return csvData;
  }

  async exportInventoryReport(): Promise<string> {
    // Get stock items
    const stockItems = await this.stockRepository.find({
      relations: ["menuItem", "menuItem.category"],
    });

    // Prepare CSV data
    let csvData =
      "Item ID,Name,Category,Current Stock,Minimum Stock,Low Stock\n";

    stockItems.forEach((stock) => {
      const itemId = stock.menuItem.id;
      const name = stock.menuItem.name;
      const category = stock.menuItem.category.name;
      const currentStock = stock.quantity;
      const minStock = stock.minQuantity;
      const isLowStock = stock.isLowStock ? "Yes" : "No";

      csvData += `${itemId},${name},${category},${currentStock},${minStock},${isLowStock}\n`;
    });

    return csvData;
  }
}
