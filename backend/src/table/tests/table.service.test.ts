import { Test, TestingModule } from '@nestjs/testing';
import { TableService } from '../table.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Table, TableStatus } from '../entities/table.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

// Mock implementations
const mockTableRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

describe('TableService', () => {
  let service: TableService;
  let tableRepository: jest.Mocked<Repository<Table>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableService,
        { provide: getRepositoryToken(Table), useFactory: mockTableRepository },
      ],
    }).compile();

    service = module.get<TableService>(TableService);
    tableRepository = module.get(getRepositoryToken(Table)) as jest.Mocked<Repository<Table>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new table', async () => {
      const createTableDto = {
        number: 1,
        capacity: 4,
        status: TableStatus.AVAILABLE,
      };

      const table = {
        id: 'table-id',
        ...createTableDto,
      };

      tableRepository.findOne.mockResolvedValue(null);
      tableRepository.create.mockReturnValue(table as Table);
      tableRepository.save.mockResolvedValue(table as Table);

      const result = await service.create(createTableDto);

      expect(tableRepository.findOne).toHaveBeenCalled();
      expect(tableRepository.create).toHaveBeenCalledWith(createTableDto);
      expect(tableRepository.save).toHaveBeenCalled();
      expect(result).toEqual(table);
    });

    it('should throw ConflictException if table with same number exists', async () => {
      const createTableDto = {
        number: 1,
        capacity: 4,
        status: TableStatus.AVAILABLE,
      };

      tableRepository.findOne.mockResolvedValue({ id: 'existing-id' } as Table);

      await expect(service.create(createTableDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of tables', async () => {
      const tables = [
        { id: 'table-1', number: 1, status: TableStatus.AVAILABLE },
        { id: 'table-2', number: 2, status: TableStatus.OCCUPIED },
      ];

      tableRepository.find.mockResolvedValue(tables as Table[]);

      const result = await service.findAll();

      expect(tableRepository.find).toHaveBeenCalled();
      expect(result).toEqual(tables);
    });
  });

  describe('findOne', () => {
    it('should return a table by id', async () => {
      const table = {
        id: 'table-id',
        number: 1,
        status: TableStatus.AVAILABLE,
      };

      tableRepository.findOne.mockResolvedValue(table as Table);

      const result = await service.findOne('table-id');

      expect(tableRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'table-id' },
      });
      expect(result).toEqual(table);
    });

    it('should throw NotFoundException if table not found', async () => {
      tableRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update table status', async () => {
      const table = {
        id: 'table-id',
        number: 1,
        status: TableStatus.AVAILABLE,
      };

      const updatedTable = {
        ...table,
        status: TableStatus.OCCUPIED,
      };

      tableRepository.findOne.mockResolvedValue(table as Table);
      tableRepository.save.mockResolvedValue(updatedTable as Table);

      const result = await service.updateStatus('table-id', TableStatus.OCCUPIED);

      expect(tableRepository.findOne).toHaveBeenCalled();
      expect(tableRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'table-id',
        status: TableStatus.OCCUPIED,
      }));
      expect(result).toEqual(updatedTable);
    });

    it('should throw NotFoundException if table not found', async () => {
      tableRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent-id', TableStatus.OCCUPIED)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createInitialTables', () => {
    it('should create initial tables if none exist', async () => {
      tableRepository.count.mockResolvedValue(0);
      tableRepository.create.mockImplementation((dto) => dto as Table);
      tableRepository.save.mockImplementation((table) => Promise.resolve({
        id: `table-${Math.random()}`,
        ...table,
      } as Table));

      await service.createInitialTables();

      expect(tableRepository.count).toHaveBeenCalled();
      expect(tableRepository.create).toHaveBeenCalled();
      expect(tableRepository.save).toHaveBeenCalled();
    });

    it('should not create tables if some already exist', async () => {
      tableRepository.count.mockResolvedValue(5);

      await service.createInitialTables();

      expect(tableRepository.count).toHaveBeenCalled();
      expect(tableRepository.create).not.toHaveBeenCalled();
      expect(tableRepository.save).not.toHaveBeenCalled();
    });
  });
});
