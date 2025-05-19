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
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req) {
    return this.invoiceService.create(
      createInvoiceDto,
      req.user.id,
      req.user.tenantId
    );
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
  findOne(@Param("id") id: string) {
    return this.invoiceService.findOne(id);
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
  async downloadInvoice(@Param("id") id: string, @Res() res: Response) {
    const invoice = await this.invoiceService.findOne(id);

    if (!invoice.fileUrl) {
      // Generate PDF if not already generated
      invoice.fileUrl = await this.invoiceService.generateInvoicePdf(id);
      await this.invoiceService.updateStatus(id, invoice.status);
    }

    const filePath = path.join(process.cwd(), invoice.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Invoice file not found");
    }

    const fileName = path.basename(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Post(":id/regenerate")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  async regenerateInvoice(@Param("id") id: string) {
    const invoice = await this.invoiceService.findOne(id);
    const fileUrl = await this.invoiceService.generateInvoicePdf(id);

    // Update the invoice with the new file URL
    // Create a proper UpdateInvoiceDto object
    const updateDto = new UpdateInvoiceDto();
    updateDto.fileUrl = fileUrl;
    await this.invoiceService.update(id, updateDto);

    return { success: true, fileUrl };
  }
}
