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
  Res,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import {
  UpdateInvoiceDto,
  UpdateInvoiceStatusDto,
} from "./dto/update-invoice.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);
  
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req) {
    try {
      this.logger.log(`Creating invoice for order ${createInvoiceDto.orderId} by user ${req.user.id}`);
      const result = await this.invoiceService.create(
        createInvoiceDto,
        req.user.id,
        req.user.tenantId
      );
      this.logger.log(`Invoice created successfully: ${result.invoiceNumber}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create invoice: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create invoice: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  findAll(@Req() req) {
    return this.invoiceService.findAll(req.user.tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.CASHIER, UserRole.WAITER)
  @UseGuards(RolesGuard)
  findOne(@Param("id") id: string, @Req() req) {
    return this.invoiceService.findOne(id, req.user.tenantId);
  }

  @Get("order/:orderId")
  @Roles(UserRole.ADMIN, UserRole.CASHIER, UserRole.WAITER)
  @UseGuards(RolesGuard)
  findByOrder(@Param("orderId") orderId: string) {
    return this.invoiceService.findByOrder(orderId);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  update(@Param("id") id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  updateStatus(
    @Param("id") id: string,
    @Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto
  ) {
    return this.invoiceService.updateStatus(id, updateInvoiceStatusDto.status);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.invoiceService.remove(id);
  }

  @Get(":id/download")
  @Roles(UserRole.ADMIN, UserRole.CASHIER, UserRole.WAITER)
  @UseGuards(RolesGuard)
  async downloadInvoice(@Param("id") id: string, @Res() res: Response, @Req() req) {
    try {
      this.logger.log(`Downloading invoice ${id} by user ${req.user.id}`);
      const invoice = await this.invoiceService.findOne(id, req.user.tenantId);

      if (!invoice.fileUrl) {
        // Generate PDF if not already generated
        this.logger.debug(`Generating PDF for invoice ${id}`);
        invoice.fileUrl = await this.invoiceService.generateInvoicePdf(id);
        await this.invoiceService.updateStatus(id, invoice.status);
      }

      const filePath = path.join(process.cwd(), invoice.fileUrl);
      this.logger.debug(`Invoice file path: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        this.logger.error(`Invoice file not found: ${filePath}`);
        return res.status(404).json({ 
          message: "Invoice file not found",
          error: "File does not exist on server"
        });
      }

      const fileName = path.basename(filePath);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      this.logger.log(`Invoice ${id} downloaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to download invoice ${id}: ${error.message}`, error.stack);
      if (!res.headersSent) {
        return res.status(500).json({
          message: "Failed to download invoice",
          error: error.message
        });
      }
    }
  }

  @Post(":id/regenerate")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  async regenerateInvoice(@Param("id") id: string, @Req() req) {
    try {
      this.logger.log(`Regenerating invoice ${id} by user ${req.user.id}`);
      const invoice = await this.invoiceService.findOne(id, req.user.tenantId);
      const fileUrl = await this.invoiceService.generateInvoicePdf(id);

      // Update the invoice with the new file URL
      // Create a proper UpdateInvoiceDto object
      const updateDto = new UpdateInvoiceDto();
      updateDto.fileUrl = fileUrl;
      await this.invoiceService.update(id, updateDto);

      this.logger.log(`Invoice ${id} regenerated successfully: ${fileUrl}`);
      return { success: true, fileUrl };
    } catch (error) {
      this.logger.error(`Failed to regenerate invoice ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to regenerate invoice: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
