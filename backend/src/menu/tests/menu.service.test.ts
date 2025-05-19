import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from '../menu.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

// Mock implementations
const mockCategoryRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

const mockMenuItemRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

describe('MenuService', () => {
  let service: MenuService;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let menuItemRepository: jest.Mocked<Repository<MenuItem>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepository },
        { provide: getRepositoryToken(MenuItem), useFactory: mockMenuItemRepository },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    categoryRepository = module.get(getRepositoryToken(Category)) as jest.Mocked<Repository<Category>>;
    menuItemRepository = module.get(getRepositoryToken(MenuItem)) as jest.Mocked<Repository<MenuItem>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const createCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
        displayOrder: 1,
      };

      const category = {
        id: 'category-id',
        ...createCategoryDto,
      };

      categoryRepository.findOne.mockResolvedValue(null);
      categoryRepository.create.mockReturnValue(category as Category);
      categoryRepository.save.mockResolvedValue(category as Category);

      const result = await service.createCategory(createCategoryDto);

      expect(categoryRepository.findOne).toHaveBeenCalled();
      expect(categoryRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(categoryRepository.save).toHaveBeenCalled();
      expect(result).toEqual(category);
    });

    it('should throw ConflictException if category with same name exists', async () => {
      const createCategoryDto = {
        name: 'Existing Category',
        description: 'Test Description',
        displayOrder: 1,
      };

      categoryRepository.findOne.mockResolvedValue({ id: 'existing-id' } as Category);

      await expect(service.createCategory(createCategoryDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllCategories', () => {
    it('should return an array of categories', async () => {
      const categories = [
        { id: 'category-1', name: 'Category 1' },
        { id: 'category-2', name: 'Category 2' },
      ];

      categoryRepository.find.mockResolvedValue(categories as Category[]);

      const result = await service.findAllCategories();

      expect(categoryRepository.find).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('findOneCategory', () => {
    it('should return a category by id', async () => {
      const category = {
        id: 'category-id',
        name: 'Test Category',
        menuItems: [],
      };

      categoryRepository.findOne.mockResolvedValue(category as Category);

      const result = await service.findOneCategory('category-id');

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-id' },
        relations: ['menuItems'],
      });
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneCategory('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMenuItem', () => {
    it('should create a new menu item', async () => {
      const createMenuItemDto = {
        name: 'Test Item',
        description: 'Test Description',
        price: 9.99,
        categoryId: 'category-id',
      };

      const menuItem = {
        id: 'item-id',
        ...createMenuItemDto,
      };

      categoryRepository.findOne.mockResolvedValue({ id: 'category-id' } as Category);
      menuItemRepository.create.mockReturnValue(menuItem as MenuItem);
      menuItemRepository.save.mockResolvedValue(menuItem as MenuItem);

      const result = await service.createMenuItem(createMenuItemDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-id' },
      });
      expect(menuItemRepository.create).toHaveBeenCalledWith(createMenuItemDto);
      expect(menuItemRepository.save).toHaveBeenCalled();
      expect(result).toEqual(menuItem);
    });

    it('should throw NotFoundException if category not found', async () => {
      const createMenuItemDto = {
        name: 'Test Item',
        description: 'Test Description',
        price: 9.99,
        categoryId: 'nonexistent-id',
      };

      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.createMenuItem(createMenuItemDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMenuItemsByCategory', () => {
    it('should return menu items for a specific category', async () => {
      const categoryId = 'category-id';
      const menuItems = [
        { id: 'item-1', name: 'Item 1', categoryId },
        { id: 'item-2', name: 'Item 2', categoryId },
      ];

      categoryRepository.findOne.mockResolvedValue({ id: categoryId } as Category);
      menuItemRepository.find.mockResolvedValue(menuItems as MenuItem[]);

      const result = await service.findMenuItemsByCategory(categoryId);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(menuItemRepository.find).toHaveBeenCalledWith({
        where: { categoryId },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(menuItems);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findMenuItemsByCategory('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
