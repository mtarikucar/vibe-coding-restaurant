import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Order events
  emitOrderCreated(order: any) {
    this.server.emit('order:created', order);
  }

  emitOrderUpdated(order: any) {
    this.server.emit('order:updated', order);
  }

  emitOrderStatusChanged(order: any) {
    this.server.emit('order:status', order);
  }

  emitOrderItemStatusChanged(orderItem: any) {
    this.server.emit('order:item:status', orderItem);
  }

  // Table events
  emitTableStatusChanged(table: any) {
    this.server.emit('table:status', table);
  }

  // Payment events
  emitPaymentCreated(payment: any) {
    this.server.emit('payment:created', payment);
  }

  emitPaymentStatusChanged(payment: any) {
    this.server.emit('payment:status', payment);
  }

  // Stock events
  emitStockUpdated(stock: any) {
    this.server.emit('stock:updated', stock);
  }

  emitLowStockAlert(stock: any) {
    this.server.emit('stock:low', stock);
  }
}
