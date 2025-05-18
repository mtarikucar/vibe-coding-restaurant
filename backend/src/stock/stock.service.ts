import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockHistory, StockActionType } from './entities/stock-history.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { MenuService } from '../menu/menu.service';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockHistory)
    private readonly stockHistoryRepository: Repository<StockHistory>,
    private readonly menuService: MenuService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createStockDto: CreateStockDto): Promise<Stock> {
    // Check if menu item exists
    await this.menuService.findOneMenuItem(createStockDto.menuItemId);

    // Check if stock for this menu item already exists
    const existingStock = await this.stockRepository.findOne({
      where: { menuItemId: createStockDto.menuItemId },
    });

    if (existingStock) {
      throw new ConflictException(`Stock for menu item with ID ${createStockDto.menuItemId} already exists`);
    }

    // Create stock
    const stock = this.stockRepository.create({
      ...createStockDto,
      minQuantity: createStockDto.minQuantity || 0,
      isLowStock: createStockDto.quantity <= (createStockDto.minQuantity || 0),
    });

    // Save stock
    const savedStock = await this.stockRepository.save(stock);

    // Create stock history
    await this.createStockHistory(
      savedStock.id,
      StockActionType.INCREASE,
      createStockDto.quantity,
      0,
      createStockDto.quantity,
      null,
      null,
      'Initial stock',
    );

    return this.findOne(savedStock.id);
  }

  async findAll(): Promise<Stock[]> {
    return this.stockRepository.find({
      relations: ['menuItem', 'menuItem.category'],
      order: { menuItem: { name: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { id },
      relations: ['menuItem', 'menuItem.category'],
    });

    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    return stock;
  }

  async update(id: string, updateStockDto: UpdateStockDto): Promise<Stock> {
    const stock = await this.findOne(id);

    // Update stock
    if (updateStockDto.quantity !== undefined) {
      stock.quantity = updateStockDto.quantity;
    }

    if (updateStockDto.minQuantity !== undefined) {
      stock.minQuantity = updateStockDto.minQuantity;
    }

    // Update low stock flag
    stock.isLowStock = stock.quantity <= stock.minQuantity;

    return this.stockRepository.save(stock);
  }

  async remove(id: string): Promise<void> {
    const stock = await this.findOne(id);
    await this.stockRepository.remove(stock);
  }

  async adjustStock(id: string, adjustStockDto: AdjustStockDto): Promise<Stock> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stock = await this.findOne(id);
      const previousQuantity = stock.quantity;
      let newQuantity = previousQuantity;

      // Adjust quantity based on action type
      if (adjustStockDto.actionType === StockActionType.INCREASE) {
        newQuantity += adjustStockDto.quantity;
      } else if (adjustStockDto.actionType === StockActionType.DECREASE) {
        if (previousQuantity < adjustStockDto.quantity) {
          throw new ConflictException(`Not enough stock. Current: ${previousQuantity}, Requested: ${adjustStockDto.quantity}`);
        }
        newQuantity -= adjustStockDto.quantity;
      } else if (adjustStockDto.actionType === StockActionType.ADJUSTMENT) {
        newQuantity = adjustStockDto.quantity;
      }

      // Update stock
      stock.quantity = newQuantity;
      stock.isLowStock = newQuantity <= stock.minQuantity;
      await this.stockRepository.save(stock);

      // Create stock history
      await this.createStockHistory(
        stock.id,
        adjustStockDto.actionType,
        adjustStockDto.quantity,
        previousQuantity,
        newQuantity,
        adjustStockDto.userId,
        adjustStockDto.orderId,
        adjustStockDto.notes,
      );

      // Commit transaction
      await queryRunner.commitTransaction();

      return this.findOne(stock.id);
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findByMenuItem(menuItemId: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { menuItemId },
      relations: ['menuItem', 'menuItem.category'],
    });

    if (!stock) {
      throw new NotFoundException(`Stock for menu item with ID ${menuItemId} not found`);
    }

    return stock;
  }

  async findLowStock(): Promise<Stock[]> {
    return this.stockRepository.find({
      where: { isLowStock: true },
      relations: ['menuItem', 'menuItem.category'],
      order: { menuItem: { name: 'ASC' } },
    });
  }

  async getStockHistory(id: string): Promise<StockHistory[]> {
    const stock = await this.findOne(id);

    return this.stockHistoryRepository.find({
      where: { stockId: stock.id },
      relations: ['user', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async decreaseStock(
    menuItemId: string,
    quantity: number,
    orderId: string,
    userId: string,
    actionType: StockActionType,
  ): Promise<void> {
    try {
      // Find stock for menu item
      const stock = await this.stockRepository.findOne({
        where: { menuItemId },
      });

      // If stock exists, decrease it
      if (stock) {
        await this.adjustStock(stock.id, {
          quantity,
          actionType,
          userId,
          orderId,
          notes: `Order ${orderId}`,
        });
      }
    } catch (error) {
      // Log error but don't throw
      console.error(`Error decreasing stock for menu item ${menuItemId}:`, error);
    }
  }

  private async createStockHistory(
    stockId: string,
    actionType: StockActionType,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    userId: string | null,
    orderId: string | null,
    notes: string | null,
  ): Promise<StockHistory> {
    const stockHistory = this.stockHistoryRepository.create({
      stockId,
      actionType,
      quantity,
      previousQuantity,
      newQuantity,
      userId,
      orderId,
      notes,
    });

    return this.stockHistoryRepository.save(stockHistory);
  }

  async createInitialStocks() {
    // Check if any stocks exist
    const stocksCount = await this.stockRepository.count();
    
    if (stocksCount === 0) {
      // Get all menu items
      const menuItems = await this.menuService.findAllMenuItems();
      
      // Create stock for each menu item
      for (const menuItem of menuItems) {
        await this.create({
          menuItemId: menuItem.id,
          quantity: 100,
          minQuantity: 10,
        });
      }
    }
  }
}
