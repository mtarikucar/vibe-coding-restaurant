import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { MenuItem } from "./menu-item.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

@Entity()
export class MenuItemIngredient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 3 })
  quantity: number; // Amount needed for one serving

  @Column()
  unit: string; // kg, g, ml, l, pieces, etc.

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  costPerUnit: number;

  @Column({ default: true })
  isEssential: boolean; // Cannot be removed from the dish

  @Column({ default: false })
  isAllergen: boolean;

  @Column({ nullable: true })
  allergenType: string; // nuts, dairy, gluten, etc.

  @Column({ type: "jsonb", nullable: true })
  nutritionalValue: Record<string, any>; // calories per unit, protein, etc.

  @Column({ type: "jsonb", nullable: true })
  translations: Record<string, { name: string; description: string }>; // Multi-language support

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.ingredients, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  menuItem: MenuItem;

  @Column()
  menuItemId: string;

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
