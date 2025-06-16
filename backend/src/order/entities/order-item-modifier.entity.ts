import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { MenuItemModifier } from '../../menu/entities/menu-item-modifier.entity';

@Entity()
export class OrderItemModifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderItem, orderItem => orderItem.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn()
  orderItem: OrderItem;

  @Column()
  orderItemId: string;

  @ManyToOne(() => MenuItemModifier, { nullable: true })
  @JoinColumn()
  menuItemModifier: MenuItemModifier;

  @Column({ nullable: true })
  menuItemModifierId: string;

  @Column()
  name: string; // Store the modifier name at time of order

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string; // Store the modifier type at time of order

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAdjustment: number;

  @Column({ nullable: true })
  selectedOption: string; // For option-type modifiers

  @Column({ default: 1 })
  quantity: number; // For modifiers that can have quantities

  @CreateDateColumn()
  createdAt: Date;
}
