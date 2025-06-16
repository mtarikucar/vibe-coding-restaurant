import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { TableQR } from './table-qr.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  OUT_OF_ORDER = 'out_of_order',
  CLEANING = 'cleaning',
}

export enum TableShape {
  SQUARE = 'square',
  ROUND = 'round',
  RECTANGULAR = 'rectangular',
}

@Entity()
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  number: number;

  @Column({ nullable: true })
  name: string; // Optional table name (e.g., "Window Table", "VIP Table")

  @Column({ nullable: true })
  capacity: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @Column({
    type: 'enum',
    enum: TableShape,
    default: TableShape.SQUARE,
  })
  shape: TableShape;

  @Column({ nullable: true })
  location: string; // Section or area (e.g., "Patio", "Main Hall", "Private Room")

  @Column({ nullable: true })
  floor: number; // Floor number for multi-story restaurants

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  xPosition: number; // X coordinate for floor plan

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  yPosition: number; // Y coordinate for floor plan

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  width: number; // Table width for floor plan

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number; // Table height for floor plan

  @Column({ default: 0 })
  minPartySize: number;

  @Column({ nullable: true })
  maxPartySize: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  notes: string; // Special notes about the table

  @Column({ nullable: true })
  reservedBy: string; // Customer name for reservations

  @Column({ nullable: true })
  reservedAt: Date; // Reservation time

  @Column({ nullable: true })
  reservedUntil: Date; // Reservation end time

  @OneToMany(() => Order, order => order.table)
  orders: Order[];

  @OneToOne(() => TableQR, qr => qr.table, { cascade: true })
  qrCode: TableQR;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
