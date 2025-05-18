import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, Equal } from "typeorm";
import { Supplier } from "./entities/supplier.entity";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>
  ) {}

  async create(
    createSupplierDto: CreateSupplierDto & { tenantId?: string }
  ): Promise<Supplier> {
    // Check if supplier with the same name already exists for this tenant
    const existingSupplier = await this.supplierRepository.findOne({
      where: {
        name: createSupplierDto.name,
        tenantId: createSupplierDto.tenantId,
        isDeleted: false,
      },
    });

    if (existingSupplier) {
      throw new ConflictException(
        `Supplier with name ${createSupplierDto.name} already exists`
      );
    }

    // Create supplier
    const supplier = this.supplierRepository.create(createSupplierDto);

    // Save supplier
    return this.supplierRepository.save(supplier);
  }

  async findAll(tenantId: string, isActive?: boolean): Promise<Supplier[]> {
    const query: any = {
      tenantId,
      isDeleted: false,
    };

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    return this.supplierRepository.find({
      where: query,
      order: { name: "ASC" },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, tenantId, isDeleted: false },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    tenantId: string
  ): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);

    // Check if trying to update name and if the new name already exists
    if (updateSupplierDto.name && updateSupplierDto.name !== supplier.name) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: {
          name: updateSupplierDto.name,
          tenantId,
          isDeleted: false,
          id: Not(Equal(id)), // Not the current supplier
        },
      });

      if (existingSupplier) {
        throw new ConflictException(
          `Supplier with name ${updateSupplierDto.name} already exists`
        );
      }
    }

    // Update supplier
    Object.assign(supplier, updateSupplierDto);

    // Save supplier
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const supplier = await this.findOne(id, tenantId);

    // Soft delete
    supplier.isDeleted = true;
    await this.supplierRepository.save(supplier);
  }
}
