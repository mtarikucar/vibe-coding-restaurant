import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Table, TableStatus } from "./entities/table.entity";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>
  ) {}

  async create(createTableDto: CreateTableDto): Promise<Table> {
    // Check if table with the same number already exists
    const existingTable = await this.tableRepository.findOne({
      where: { number: createTableDto.number },
    });

    if (existingTable) {
      throw new ConflictException(
        `Table with number ${createTableDto.number} already exists`
      );
    }

    const table = this.tableRepository.create(createTableDto);
    return this.tableRepository.save(table);
  }

  async findAll(tenantId?: string): Promise<Table[]> {
    const whereCondition = tenantId ? { tenantId } : {};

    return this.tableRepository.find({
      where: whereCondition,
      order: { number: "ASC" },
    });
  }

  async findOne(id: string, tenantId?: string): Promise<Table> {
    const whereCondition: any = { id };
    if (tenantId) {
      whereCondition.tenantId = tenantId;
    }

    const table = await this.tableRepository.findOne({
      where: whereCondition,
      relations: ["orders"],
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id);

    // Check if trying to update number and if the new number already exists
    if (updateTableDto.number && updateTableDto.number !== table.number) {
      const existingTable = await this.tableRepository.findOne({
        where: { number: updateTableDto.number },
      });

      if (existingTable) {
        throw new ConflictException(
          `Table with number ${updateTableDto.number} already exists`
        );
      }
    }

    // Update the table
    this.tableRepository.merge(table, updateTableDto);
    return this.tableRepository.save(table);
  }

  async remove(id: string): Promise<void> {
    const table = await this.findOne(id);

    // Check if table has active orders
    if (table.orders && table.orders.length > 0) {
      throw new ConflictException("Cannot delete table with active orders");
    }

    await this.tableRepository.remove(table);
  }

  async updateStatus(id: string, status: TableStatus): Promise<Table> {
    const table = await this.findOne(id);
    table.status = status;
    return this.tableRepository.save(table);
  }

  async findByStatus(status: string): Promise<Table[]> {
    return this.tableRepository.find({
      where: { status: status as TableStatus },
      order: { number: "ASC" },
    });
  }

  async createInitialTables() {
    // Check if any tables exist
    const tablesCount = await this.tableRepository.count();

    if (tablesCount === 0) {
      // Create tables
      await this.create({
        number: 1,
        capacity: 2,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 2,
        capacity: 2,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 3,
        capacity: 4,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 4,
        capacity: 4,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 5,
        capacity: 6,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 6,
        capacity: 6,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 7,
        capacity: 8,
        status: TableStatus.AVAILABLE,
      });
      await this.create({
        number: 8,
        capacity: 8,
        status: TableStatus.AVAILABLE,
      });
    }
  }
}
