import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MenuItem } from '../../menu/entities/menu-item.entity';
import { StockHistory } from './stock-history.entity';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MenuItem, menuItem => menuItem.stocks)
  @JoinColumn()
  menuItem: MenuItem;

  @Column()
  menuItemId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minQuantity: number;

  @Column({ default: false })
  isLowStock: boolean;

  @OneToMany(() => StockHistory, stockHistory => stockHistory.stock)
  history: StockHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
