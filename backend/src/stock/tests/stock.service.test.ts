import { Test, TestingModule } from "@nestjs/testing";
import { StockService } from "../stock.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Stock } from "../entities/stock.entity";
import {
  StockHistory,
  StockActionType,
} from "../entities/stock-history.entity";
import { Repository, DataSource } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";

// Mock implementations
const mockStockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

const mockStockHistoryRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
  },
};

const mockDataSource = () => ({
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
});

describe("StockService", () => {
  let service: StockService;
  let stockRepository: jest.Mocked<Repository<Stock>>;
  let stockHistoryRepository: jest.Mocked<Repository<StockHistory>>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: getRepositoryToken(Stock), useFactory: mockStockRepository },
        {
          provide: getRepositoryToken(StockHistory),
          useFactory: mockStockHistoryRepository,
        },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    stockRepository = module.get(getRepositoryToken(Stock)) as jest.Mocked<
      Repository<Stock>
    >;
    stockHistoryRepository = module.get(
      getRepositoryToken(StockHistory)
    ) as jest.Mocked<Repository<StockHistory>>;
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of stock items", async () => {
      const stocks = [
        { id: "stock-1", name: "Stock 1", quantity: 10 },
        { id: "stock-2", name: "Stock 2", quantity: 20 },
      ];

      stockRepository.find.mockResolvedValue(stocks as unknown as Stock[]);

      const result = await service.findAll();

      expect(stockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(stocks);
    });
  });

  describe("findOne", () => {
    it("should return a stock item by id", async () => {
      const stock = {
        id: "stock-id",
        name: "Test Stock",
        quantity: 15,
      };

      stockRepository.findOne.mockResolvedValue(stock as unknown as Stock);

      const result = await service.findOne("stock-id");

      expect(stockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "stock-id" },
        relations: ["menuItem"],
      });
      expect(result).toEqual(stock);
    });

    it("should throw NotFoundException if stock not found", async () => {
      stockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("create", () => {
    it("should create a new stock item", async () => {
      const createStockDto = {
        name: "New Stock",
        description: "Test Description",
        quantity: 25,
        unit: "kg",
        reorderLevel: 5,
        menuItemId: "menu-item-id",
      };

      const stock = {
        id: "stock-id",
        ...createStockDto,
      };

      stockRepository.create.mockReturnValue(stock as unknown as Stock);
      stockRepository.save.mockResolvedValue(stock as unknown as Stock);

      const result = await service.create(createStockDto);

      expect(stockRepository.create).toHaveBeenCalledWith(createStockDto);
      expect(stockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(stock);
    });
  });

  describe("decreaseStock", () => {
    it("should decrease stock quantity and create history record", async () => {
      const stock = {
        id: "stock-id",
        name: "Test Stock",
        quantity: 20,
        menuItemId: "menu-item-id",
      };

      const updatedStock = {
        ...stock,
        quantity: 18, // Decreased by 2
      };

      const stockHistory = {
        id: "history-id",
        stockId: "stock-id",
        quantity: 2,
        actionType: StockActionType.DECREASE,
        orderId: "order-id",
        userId: "user-id",
      };

      stockRepository.findOne.mockResolvedValue(stock as unknown as Stock);
      stockRepository.save.mockResolvedValue(updatedStock as unknown as Stock);
      stockHistoryRepository.create.mockReturnValue(
        stockHistory as unknown as StockHistory
      );
      stockHistoryRepository.save.mockResolvedValue(
        stockHistory as unknown as StockHistory
      );

      await service.decreaseStock(
        "menu-item-id",
        2,
        "order-id",
        "user-id",
        StockActionType.DECREASE
      );

      expect(stockRepository.findOne).toHaveBeenCalled();
      expect(stockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "stock-id",
          quantity: 18,
        })
      );
      expect(stockHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockId: "stock-id",
          quantity: 2,
          actionType: StockActionType.DECREASE,
          orderId: "order-id",
          userId: "user-id",
        })
      );
      expect(stockHistoryRepository.save).toHaveBeenCalled();
    });

    it("should throw BadRequestException if not enough stock", async () => {
      const stock = {
        id: "stock-id",
        name: "Test Stock",
        quantity: 1,
        menuItemId: "menu-item-id",
      };

      stockRepository.findOne.mockResolvedValue(stock as unknown as Stock);

      await expect(
        service.decreaseStock(
          "menu-item-id",
          2,
          "order-id",
          "user-id",
          StockActionType.DECREASE
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if stock not found", async () => {
      stockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.decreaseStock(
          "nonexistent-id",
          2,
          "order-id",
          "user-id",
          StockActionType.DECREASE
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("increaseStock", () => {
    it("should increase stock quantity and create history record", async () => {
      const stock = {
        id: "stock-id",
        name: "Test Stock",
        quantity: 20,
      };

      const updatedStock = {
        ...stock,
        quantity: 25, // Increased by 5
      };

      const stockHistory = {
        id: "history-id",
        stockId: "stock-id",
        quantity: 5,
        actionType: StockActionType.INCREASE,
        purchaseOrderId: "po-id",
        userId: "user-id",
      };

      stockRepository.findOne.mockResolvedValue(stock as unknown as Stock);
      stockRepository.save.mockResolvedValue(updatedStock as unknown as Stock);
      stockHistoryRepository.create.mockReturnValue(
        stockHistory as unknown as StockHistory
      );
      stockHistoryRepository.save.mockResolvedValue(
        stockHistory as unknown as StockHistory
      );

      await service.increaseStock(
        "stock-id",
        5,
        "po-id",
        "user-id",
        StockActionType.INCREASE
      );

      expect(stockRepository.findOne).toHaveBeenCalled();
      expect(stockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "stock-id",
          quantity: 25,
        })
      );
      expect(stockHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockId: "stock-id",
          quantity: 5,
          actionType: StockActionType.INCREASE,
          purchaseOrderId: "po-id",
          userId: "user-id",
        })
      );
      expect(stockHistoryRepository.save).toHaveBeenCalled();
    });
  });
});
