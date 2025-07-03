import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Headers,
  Request,
} from "@nestjs/common";
import { MenuService } from "./menu.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";
import { BatchCategoriesDto } from "./dto/batch-categories.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";

@Controller("menu")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Category endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("categories")
  createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    const tenantId = req.tenantId;
    return this.menuService.createCategory(createCategoryDto, tenantId);
  }

  @Get("categories")
  findAllCategories(@Headers("x-tenant-id") tenantId: string, @Request() req) {
    // Use tenant ID from headers for public access, or from request for authenticated access
    const effectiveTenantId = tenantId || (req.user && req.user.tenantId);
    return this.menuService.findAllCategories(effectiveTenantId);
  }

  @Get("categories/:id")
  findOneCategory(
    @Param("id") id: string,
    @Headers("x-tenant-id") tenantId: string,
    @Request() req
  ) {
    // Use tenant ID from headers for public access, or from request for authenticated access
    const effectiveTenantId = tenantId || (req.user && req.user.tenantId);
    return this.menuService.findOneCategory(id, effectiveTenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("categories/:id")
  updateCategory(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.menuService.updateCategory(id, updateCategoryDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("categories/:id")
  removeCategory(@Param("id") id: string) {
    return this.menuService.removeCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("categories/batch")
  batchUpdateCategories(@Body() batchCategoriesDto: BatchCategoriesDto) {
    return this.menuService.batchUpdateCategories(
      batchCategoriesDto.categories
    );
  }

  // Menu item endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("items")
  createMenuItem(@Body() createMenuItemDto: CreateMenuItemDto, @Request() req) {
    const tenantId = req.tenantId;
    return this.menuService.createMenuItem(createMenuItemDto, tenantId);
  }

  @Get("items")
  findAllMenuItems(@Headers("x-tenant-id") tenantId: string, @Request() req) {
    // Use tenant ID from headers for public access, or from request for authenticated access
    const effectiveTenantId = tenantId || (req.user && req.user.tenantId);
    return this.menuService.findAllMenuItems(effectiveTenantId);
  }

  @Get("items/:id")
  findOneMenuItem(
    @Param("id") id: string,
    @Headers("x-tenant-id") tenantId: string,
    @Request() req
  ) {
    // Use tenant ID from headers for public access, or from request for authenticated access
    const effectiveTenantId = tenantId || (req.user && req.user.tenantId);
    return this.menuService.findOneMenuItem(id, effectiveTenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("items/:id")
  updateMenuItem(
    @Param("id") id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto
  ) {
    return this.menuService.updateMenuItem(id, updateMenuItemDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("items/:id")
  removeMenuItem(@Param("id") id: string) {
    return this.menuService.removeMenuItem(id);
  }

  // Get menu items by category
  @Get("categories/:id/items")
  findMenuItemsByCategory(
    @Param("id") categoryId: string,
    @Headers("x-tenant-id") tenantId: string,
    @Request() req
  ) {
    // Use tenant ID from headers for public access, or from request for authenticated access
    const effectiveTenantId = tenantId || (req.user && req.user.tenantId);
    return this.menuService.findMenuItemsByCategory(
      categoryId,
      effectiveTenantId
    );
  }
}
