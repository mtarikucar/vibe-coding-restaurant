import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Table } from "./table.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

@Entity()
export class TableQR {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  qrCode: string; // Unique QR code identifier

  @Column({ nullable: true })
  qrImageUrl: string; // URL to the generated QR code image

  @Column({ nullable: true })
  menuUrl: string; // URL that the QR code points to

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  expiresAt: Date; // Optional expiration for temporary QR codes

  @Column({ type: "jsonb", nullable: true })
  customization: Record<string, any>; // QR code styling options

  @OneToOne(() => Table, { onDelete: "CASCADE" })
  @JoinColumn()
  table: Table;

  @Column()
  tableId: string;

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
