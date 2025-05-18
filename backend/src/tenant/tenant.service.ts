import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if tenant with same name or schema already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: [
        { name: createTenantDto.name },
        { schema: createTenantDto.schema },
        { subdomain: createTenantDto.subdomain },
      ],
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name, schema, or subdomain already exists');
    }

    // Create new tenant
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      status: TenantStatus.TRIAL,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days trial
    });

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Save tenant
      const savedTenant = await queryRunner.manager.save(tenant);

      // Create schema for tenant
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schema}"`);

      // Commit transaction
      await queryRunner.commitTransaction();

      return savedTenant;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create tenant: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create tenant');
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain, isDeleted: false },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain ${subdomain} not found`);
    }

    return tenant;
  }

  async findBySchema(schema: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { schema, isDeleted: false },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with schema ${schema} not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Check if trying to update unique fields
    if (updateTenantDto.name || updateTenantDto.schema || updateTenantDto.subdomain) {
      const existingTenant = await this.tenantRepository.findOne({
        where: [
          { name: updateTenantDto.name },
          { schema: updateTenantDto.schema },
          { subdomain: updateTenantDto.subdomain },
        ],
      });

      if (existingTenant && existingTenant.id !== id) {
        throw new ConflictException('Tenant with this name, schema, or subdomain already exists');
      }
    }

    // Update tenant
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);

    // Soft delete
    tenant.isDeleted = true;
    await this.tenantRepository.save(tenant);
  }

  async createInitialTenant(): Promise<void> {
    const existingTenants = await this.tenantRepository.find();

    if (existingTenants.length === 0) {
      // Create default tenant
      await this.create({
        name: 'default',
        schema: 'public',
        subdomain: 'app',
        displayName: 'Default Restaurant',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
      });
    }
  }
}
