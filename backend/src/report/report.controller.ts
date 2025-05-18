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
  Query,
  Res,
  Header,
  BadRequestException,
} from "@nestjs/common";
import { ReportService } from "./report.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { CreateReportTemplateDto } from "./dto/create-report-template.dto";
import { CreateReportScheduleDto } from "./dto/create-report-schedule.dto";
import { GenerateReportDto } from "./dto/generate-report.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Report CRUD endpoints
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  createReport(@Body() createReportDto: CreateReportDto, @Req() req) {
    return this.reportService.createReport(
      createReportDto,
      req.user.id,
      req.user.tenantId
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  findAllReports(@Req() req) {
    return this.reportService.findAllReports(req.user.id, req.user.tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  findReportById(@Param("id") id: string, @Req() req) {
    return this.reportService.findReportById(id, req.user.tenantId);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  updateReport(
    @Param("id") id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Req() req
  ) {
    return this.reportService.updateReport(
      id,
      updateReportDto,
      req.user.tenantId
    );
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  removeReport(@Param("id") id: string, @Req() req) {
    return this.reportService.removeReport(id, req.user.tenantId);
  }

  // Report Template endpoints
  @Post("templates")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  createReportTemplate(
    @Body() createReportTemplateDto: CreateReportTemplateDto,
    @Req() req
  ) {
    return this.reportService.createReportTemplate(
      createReportTemplateDto,
      req.user.id,
      req.user.tenantId
    );
  }

  @Get("templates")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  findAllReportTemplates(@Req() req) {
    return this.reportService.findAllReportTemplates(req.user.tenantId);
  }

  // Report Schedule endpoints
  @Post("schedules")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  createReportSchedule(
    @Body() createReportScheduleDto: CreateReportScheduleDto,
    @Req() req
  ) {
    return this.reportService.createReportSchedule(
      createReportScheduleDto,
      req.user.id,
      req.user.tenantId
    );
  }

  @Get("schedules")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  findAllReportSchedules(@Req() req) {
    return this.reportService.findAllReportSchedules(req.user.tenantId);
  }

  // Report Generation endpoints
  @Post("generate")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  generateReport(@Body() generateReportDto: GenerateReportDto, @Req() req) {
    return this.reportService.generateReport(
      generateReportDto,
      req.user.id,
      req.user.tenantId
    );
  }

  // Download report file
  @Get("download/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  async downloadReport(@Param("id") id: string, @Req() req, @Res() res: Response) {
    const report = await this.reportService.findReportById(id, req.user.tenantId);
    
    if (!report.fileUrl) {
      throw new BadRequestException("Report file not found");
    }
    
    const filePath = path.join(process.cwd(), report.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException("Report file not found");
    }
    
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    
    let contentType = "application/octet-stream";
    if (fileExtension === ".pdf") {
      contentType = "application/pdf";
    } else if (fileExtension === ".xlsx") {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (fileExtension === ".csv") {
      contentType = "text/csv";
    }
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
