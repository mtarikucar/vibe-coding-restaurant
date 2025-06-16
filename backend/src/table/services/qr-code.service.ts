import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TableQR } from '../entities/table-qr.entity';
import { Table } from '../entities/table.entity';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QRCodeService {
  private readonly logger = new Logger(QRCodeService.name);

  constructor(
    @InjectRepository(TableQR)
    private readonly tableQRRepository: Repository<TableQR>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly configService: ConfigService,
  ) {}

  async generateQRCodeForTable(tableId: string, tenantId: string): Promise<TableQR> {
    try {
      // Check if table exists
      const table = await this.tableRepository.findOne({
        where: { id: tableId, tenantId },
      });

      if (!table) {
        throw new Error(`Table with ID ${tableId} not found`);
      }

      // Check if QR code already exists for this table
      let tableQR = await this.tableQRRepository.findOne({
        where: { tableId },
      });

      // Generate unique QR code identifier
      const qrCode = `table_${table.number}_${tenantId}_${Date.now()}`;
      
      // Create menu URL that the QR code will point to
      const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
      const menuUrl = `${baseUrl}/public/menu/${tenantId}?table=${table.id}&qr=${qrCode}`;

      // Generate QR code image
      const qrImagePath = await this.generateQRCodeImage(qrCode, menuUrl, table.number);

      if (tableQR) {
        // Update existing QR code
        tableQR.qrCode = qrCode;
        tableQR.menuUrl = menuUrl;
        tableQR.qrImageUrl = qrImagePath;
        tableQR.isActive = true;
      } else {
        // Create new QR code
        tableQR = this.tableQRRepository.create({
          tableId,
          qrCode,
          menuUrl,
          qrImageUrl: qrImagePath,
          isActive: true,
        });
      }

      return await this.tableQRRepository.save(tableQR);
    } catch (error) {
      this.logger.error(`Failed to generate QR code for table ${tableId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateQRCodeImage(qrCode: string, url: string, tableNumber: number): Promise<string> {
    try {
      // Ensure QR codes directory exists
      const qrDir = path.join(process.cwd(), 'uploads', 'qr-codes');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }

      const fileName = `table_${tableNumber}_${qrCode}.png`;
      const filePath = path.join(qrDir, fileName);

      // Generate QR code with custom options
      await QRCode.toFile(filePath, url, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 300,
      });

      // Return relative path for storage
      return `/uploads/qr-codes/${fileName}`;
    } catch (error) {
      this.logger.error(`Failed to generate QR code image: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getQRCodeForTable(tableId: string): Promise<TableQR | null> {
    return await this.tableQRRepository.findOne({
      where: { tableId, isActive: true },
      relations: ['table'],
    });
  }

  async getAllQRCodes(tenantId: string): Promise<TableQR[]> {
    return await this.tableQRRepository.find({
      where: { isActive: true },
      relations: ['table'],
      order: { table: { number: 'ASC' } },
    });
  }

  async deactivateQRCode(tableId: string): Promise<void> {
    await this.tableQRRepository.update(
      { tableId },
      { isActive: false }
    );
  }

  async regenerateAllQRCodes(tenantId: string): Promise<TableQR[]> {
    try {
      // Get all tables for the tenant
      const tables = await this.tableRepository.find({
        where: { tenantId, isActive: true },
        order: { number: 'ASC' },
      });

      const qrCodes: TableQR[] = [];

      for (const table of tables) {
        try {
          const qrCode = await this.generateQRCodeForTable(table.id, tenantId);
          qrCodes.push(qrCode);
        } catch (error) {
          this.logger.error(`Failed to generate QR code for table ${table.number}: ${error.message}`);
        }
      }

      return qrCodes;
    } catch (error) {
      this.logger.error(`Failed to regenerate QR codes for tenant ${tenantId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateQRCode(qrCode: string, tableId: string): Promise<boolean> {
    const tableQR = await this.tableQRRepository.findOne({
      where: { qrCode, tableId, isActive: true },
    });

    if (!tableQR) {
      return false;
    }

    // Check if QR code has expired (if expiration is set)
    if (tableQR.expiresAt && new Date() > tableQR.expiresAt) {
      return false;
    }

    return true;
  }

  async customizeQRCode(
    tableId: string,
    customization: {
      color?: string;
      backgroundColor?: string;
      logo?: string;
      size?: number;
    }
  ): Promise<TableQR> {
    const tableQR = await this.getQRCodeForTable(tableId);
    
    if (!tableQR) {
      throw new Error(`QR code not found for table ${tableId}`);
    }

    // Update customization
    tableQR.customization = {
      ...tableQR.customization,
      ...customization,
    };

    // Regenerate QR code with new customization
    if (tableQR.menuUrl) {
      const table = await this.tableRepository.findOne({ where: { id: tableId } });
      if (table) {
        tableQR.qrImageUrl = await this.generateCustomQRCodeImage(
          tableQR.qrCode,
          tableQR.menuUrl,
          table.number,
          customization
        );
      }
    }

    return await this.tableQRRepository.save(tableQR);
  }

  private async generateCustomQRCodeImage(
    qrCode: string,
    url: string,
    tableNumber: number,
    customization: any
  ): Promise<string> {
    try {
      const qrDir = path.join(process.cwd(), 'uploads', 'qr-codes');
      const fileName = `table_${tableNumber}_${qrCode}_custom.png`;
      const filePath = path.join(qrDir, fileName);

      const options: any = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        width: customization.size || 300,
        color: {
          dark: customization.color || '#000000',
          light: customization.backgroundColor || '#FFFFFF',
        },
      };

      await QRCode.toFile(filePath, url, options);

      return `/uploads/qr-codes/${fileName}`;
    } catch (error) {
      this.logger.error(`Failed to generate custom QR code image: ${error.message}`, error.stack);
      throw error;
    }
  }
}
