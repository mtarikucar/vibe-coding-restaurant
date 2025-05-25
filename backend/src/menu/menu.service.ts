import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Category } from "./entities/category.entity";
import { MenuItem } from "./entities/menu-item.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";
import { CategoryDto } from "./dto/batch-categories.dto";

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>
  ) {}

  // Category methods
  async createCategory(
    createCategoryDto: CreateCategoryDto
  ): Promise<Category> {
    // Check if category with the same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException("Category with this name already exists");
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAllCategories(tenantId?: string): Promise<Category[]> {
    // Create a properly typed where clause
    const whereClause: Record<string, any> = {};
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    return this.categoryRepository.find({
      where: whereClause,
      order: { displayOrder: "ASC", name: "ASC" },
    });
  }

  async findOneCategory(id: string, tenantId?: string): Promise<Category> {
    // Create a properly typed where clause
    const whereClause: Record<string, any> = { id };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const category = await this.categoryRepository.findOne({
      where: whereClause,
      relations: ["menuItems"],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto
  ): Promise<Category> {
    const category = await this.findOneCategory(id);

    // Check if trying to update name and if the new name already exists
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException("Category with this name already exists");
      }
    }

    // Update the category
    this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findOneCategory(id);

    // Check if category has menu items
    if (category.menuItems && category.menuItems.length > 0) {
      throw new ConflictException("Cannot delete category with menu items");
    }

    await this.categoryRepository.remove(category);
  }

  async batchUpdateCategories(categories: CategoryDto[]): Promise<Category[]> {
    if (!categories || !Array.isArray(categories)) {
      throw new BadRequestException("Invalid categories data");
    }

    // Separate categories into new ones (no ID or temp ID) and existing ones
    const newCategories = categories.filter(
      (cat) => !cat.id || cat.id.startsWith("temp-")
    );
    const existingCategoryIds = categories
      .filter((cat) => cat.id && !cat.id.startsWith("temp-"))
      .map((cat) => cat.id);

    // Get all existing categories from the database
    const existingCategories = await this.categoryRepository.find({
      where: { id: In(existingCategoryIds) },
      relations: ["menuItems"],
    });

    // Get all categories from the database to check for duplicates
    const allCategories = await this.categoryRepository.find();
    const allCategoryNames = allCategories.map((cat) => cat.name.toLowerCase());

    // Process new categories
    const createdCategories: Category[] = [];
    for (const newCat of newCategories) {
      // Check for duplicate names
      if (allCategoryNames.includes(newCat.name.toLowerCase())) {
        throw new ConflictException(
          `Category with name "${newCat.name}" already exists`
        );
      }

      // Create new category
      const category = this.categoryRepository.create({
        name: newCat.name,
        description: newCat.description,
        displayOrder: newCat.displayOrder || 0,
        isActive: newCat.isActive !== undefined ? newCat.isActive : true,
      });

      const savedCategory = await this.categoryRepository.save(category);
      createdCategories.push(savedCategory);

      // Add to the list of existing names to prevent duplicates in the same batch
      allCategoryNames.push(newCat.name.toLowerCase());
    }

    // Process existing categories
    const updatedCategories: Category[] = [];
    for (const existingCat of categories.filter(
      (cat) => cat.id && !cat.id.startsWith("temp-")
    )) {
      const category = existingCategories.find(
        (cat) => cat.id === existingCat.id
      );

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${existingCat.id} not found`
        );
      }

      // Check for duplicate names (excluding the current category)
      if (
        existingCat.name &&
        existingCat.name.toLowerCase() !== category.name.toLowerCase() &&
        allCategoryNames
          .filter((name) => name !== category.name.toLowerCase())
          .includes(existingCat.name.toLowerCase())
      ) {
        throw new ConflictException(
          `Category with name "${existingCat.name}" already exists`
        );
      }

      // Update category
      this.categoryRepository.merge(category, {
        name: existingCat.name,
        description: existingCat.description,
        displayOrder: existingCat.displayOrder,
        isActive: existingCat.isActive,
      });

      const updatedCategory = await this.categoryRepository.save(category);
      updatedCategories.push(updatedCategory);
    }

    // Return all categories
    return [...createdCategories, ...updatedCategories];
  }

  // Menu item methods
  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto
  ): Promise<MenuItem> {
    // Check if category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createMenuItemDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createMenuItemDto.categoryId} not found`
      );
    }

    const menuItem = this.menuItemRepository.create(createMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async findAllMenuItems(tenantId?: string): Promise<MenuItem[]> {
    if (tenantId) {
      // For public access with tenant ID, we need to join with categories to filter by tenant
      return this.menuItemRepository
        .createQueryBuilder("menuItem")
        .leftJoinAndSelect("menuItem.category", "category")
        .where("category.tenantId = :tenantId", { tenantId })
        .orderBy("menuItem.name", "ASC")
        .getMany();
    } else {
      // For authenticated access, return all items
      return this.menuItemRepository.find({
        relations: ["category"],
        order: { name: "ASC" },
      });
    }
  }

  async findOneMenuItem(id: string, tenantId?: string): Promise<MenuItem> {
    let menuItem: MenuItem;

    if (tenantId) {
      // For public access with tenant ID
      menuItem = await this.menuItemRepository
        .createQueryBuilder("menuItem")
        .leftJoinAndSelect("menuItem.category", "category")
        .where("menuItem.id = :id", { id })
        .andWhere("category.tenantId = :tenantId", { tenantId })
        .getOne();
    } else {
      // For authenticated access
      menuItem = await this.menuItemRepository.findOne({
        where: { id },
        relations: ["category"],
      });
    }

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return menuItem;
  }

  async updateMenuItem(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto
  ): Promise<MenuItem> {
    const menuItem = await this.findOneMenuItem(id);

    // If categoryId is being updated, check if the new category exists
    if (
      updateMenuItemDto.categoryId &&
      updateMenuItemDto.categoryId !== menuItem.categoryId
    ) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateMenuItemDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateMenuItemDto.categoryId} not found`
        );
      }
    }

    // Update the menu item
    this.menuItemRepository.merge(menuItem, updateMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async removeMenuItem(id: string): Promise<void> {
    const menuItem = await this.findOneMenuItem(id);
    await this.menuItemRepository.remove(menuItem);
  }

  async findMenuItemsByCategory(
    categoryId: string,
    tenantId?: string
  ): Promise<MenuItem[]> {
    // Check if category exists with optional tenant filter
    const whereClause: Record<string, any> = { id: categoryId };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const category = await this.categoryRepository.findOne({
      where: whereClause,
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Return menu items for this category
    return this.menuItemRepository.find({
      where: { categoryId },
      order: { name: "ASC" },
    });
  }

  async createInitialMenuItems() {
    // Check if any categories exist
    const categoriesCount = await this.categoryRepository.count();

    if (categoriesCount === 0) {
      // Create categories
      const appetizersCategory = await this.createCategory({
        name: "Appetizers",
        description: "Starters and small plates",
        displayOrder: 1,
      });

      const mainCoursesCategory = await this.createCategory({
        name: "Main Courses",
        description: "Main dishes",
        displayOrder: 2,
      });

      const dessertsCategory = await this.createCategory({
        name: "Desserts",
        description: "Sweet treats",
        displayOrder: 3,
      });

      const beveragesCategory = await this.createCategory({
        name: "Beverages",
        description: "Drinks and refreshments",
        displayOrder: 4,
      });

      // Create menu items
      await this.createMenuItem({
        name: "Caesar Salad",
        description:
          "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese",
        price: 8.99,
        isAvailable: true,
        categoryId: appetizersCategory.id,
      });

      await this.createMenuItem({
        name: "Chicken Wings",
        description: "Crispy chicken wings with your choice of sauce",
        price: 10.99,
        isAvailable: true,
        categoryId: appetizersCategory.id,
      });

      await this.createMenuItem({
        name: "Chicken Burger",
        description:
          "Grilled chicken breast with lettuce, tomato, and special sauce",
        price: 12.99,
        isAvailable: true,
        categoryId: mainCoursesCategory.id,
      });

      await this.createMenuItem({
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and basil",
        price: 14.99,
        isAvailable: true,
        categoryId: mainCoursesCategory.id,
      });

      await this.createMenuItem({
        name: "Chocolate Cake",
        description: "Rich chocolate cake with a layer of chocolate ganache",
        price: 6.99,
        isAvailable: true,
        categoryId: dessertsCategory.id,
      });

      await this.createMenuItem({
        name: "Cheesecake",
        description: "Creamy cheesecake with a graham cracker crust",
        price: 7.99,
        isAvailable: true,
        categoryId: dessertsCategory.id,
      });

      await this.createMenuItem({
        name: "Iced Tea",
        description: "Refreshing iced tea with lemon",
        price: 2.99,
        isAvailable: true,
        categoryId: beveragesCategory.id,
      });

      await this.createMenuItem({
        name: "Coffee",
        description: "Freshly brewed coffee",
        price: 3.49,
        isAvailable: true,
        categoryId: beveragesCategory.id,
      });
    }
  }
}
