import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Stock } from '../../stock/entities/stock.entity';
import { MenuItemModifier } from './menu-item-modifier.entity';
import { MenuItemIngredient } from './menu-item-ingredient.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity()
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  preparationTime: number; // in minutes

  @Column({ type: 'jsonb', nullable: true })
  allergens: string[]; // Array of allergen names

  @Column({ type: 'jsonb', nullable: true })
  nutritionalInfo: Record<string, any>; // Calories, protein, etc.

  @Column({ type: 'jsonb', nullable: true })
  translations: Record<string, { name: string; description: string }>; // Multi-language support

  @Column({ default: false })
  isSpicy: boolean;

  @Column({ default: false })
  isVegetarian: boolean;

  @Column({ default: false })
  isVegan: boolean;

  @Column({ default: false })
  isGlutenFree: boolean;

  @Column({ nullable: true })
  sku: string; // Stock keeping unit

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number; // Cost to make the item

  @ManyToOne(() => Category, category => category.menuItems)
  @JoinColumn()
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.menuItem)
  orderItems: OrderItem[];

  @OneToMany(() => Stock, stock => stock.menuItem)
  stocks: Stock[];

  @OneToMany(() => MenuItemModifier, modifier => modifier.menuItem, { cascade: true })
  modifiers: MenuItemModifier[];

  @OneToMany(() => MenuItemIngredient, ingredient => ingredient.menuItem, { cascade: true })
  ingredients: MenuItemIngredient[];

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
