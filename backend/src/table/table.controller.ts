import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TableService } from "./table.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";
import { UpdateTableStatusDto } from "./dto/update-table-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { Request } from "express";

@Controller("tables")
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createTableDto: CreateTableDto) {
    return this.tableService.create(createTableDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.tableService.findAll(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.tableService.findOne(id, tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tableService.update(id, updateTableDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tableService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() updateTableStatusDto: UpdateTableStatusDto
  ) {
    return this.tableService.updateStatus(id, updateTableStatusDto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get("status/:status")
  findByStatus(@Param("status") status: string) {
    return this.tableService.findByStatus(status);
  }
}
