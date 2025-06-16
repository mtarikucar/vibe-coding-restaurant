import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';

export enum ModifierType {
  SIZE = 'size',
  EXTRA = 'extra',
  OPTION = 'option',
  SAUCE = 'sauce',
  COOKING_STYLE = 'cooking_style',
  TEMPERATURE = 'temperature',
}

@Entity()
export class MenuItemModifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ModifierType,
    default: ModifierType.EXTRA,
  })
  type: ModifierType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment: number; // Can be positive or negative

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: 1 })
  maxSelections: number; // For option groups

  @Column({ default: 0 })
  minSelections: number; // For required option groups

  @Column({ type: 'jsonb', nullable: true })
  options: string[]; // For option type modifiers (e.g., ['Small', 'Medium', 'Large'])

  @Column({ type: 'jsonb', nullable: true })
  translations: Record<string, { name: string; description: string }>; // Multi-language support

  @ManyToOne(() => MenuItem, menuItem => menuItem.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn()
  menuItem: MenuItem;

  @Column()
  menuItemId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
