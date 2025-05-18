import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger("EventsGateway");

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized");
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);

    // Get user and tenant info from handshake auth
    const userId = client.handshake.auth.userId;
    const tenantId = client.handshake.auth.tenantId;

    if (userId) {
      // Join user-specific room
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} joined user room: user:${userId}`);

      // Join tenant room if tenant ID is provided
      if (tenantId) {
        client.join(`tenant:${tenantId}`);
        this.logger.log(
          `Client ${client.id} joined tenant room: tenant:${tenantId}`
        );
      }
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Order events
  emitOrderCreated(order: any) {
    this.server.emit("order:created", order);
  }

  emitOrderUpdated(order: any) {
    this.server.emit("order:updated", order);
  }

  emitOrderStatusChanged(order: any) {
    this.server.emit("order:status", order);
  }

  emitOrderItemStatusChanged(orderItem: any) {
    this.server.emit("order:item:status", orderItem);
  }

  // Table events
  emitTableStatusChanged(table: any) {
    this.server.emit("table:status", table);
  }

  // Payment events
  emitPaymentCreated(payment: any) {
    this.server.emit("payment:created", payment);
  }

  emitPaymentStatusChanged(payment: any) {
    this.server.emit("payment:status", payment);
  }

  // Stock events
  emitStockUpdated(stock: any) {
    this.server.emit("stock:updated", stock);
  }

  emitLowStockAlert(stock: any) {
    this.server.emit("stock:low", stock);
  }

  // Notification events
  emitNotification(notification: any) {
    // Emit to specific user if recipient is specified
    if (notification.recipientId) {
      this.server
        .to(`user:${notification.recipientId}`)
        .emit("notification:new", notification);
    }

    // Emit to all users in the tenant if it's a broadcast notification
    if (notification.isBroadcast && notification.tenantId) {
      this.server
        .to(`tenant:${notification.tenantId}`)
        .emit("notification:broadcast", notification);
    }
  }

  // Campaign events
  emitCampaignCreated(campaign: any) {
    this.server.emit("campaign:created", campaign);
  }

  emitCampaignUpdated(campaign: any) {
    this.server.emit("campaign:updated", campaign);
  }

  emitCampaignStatusChanged(campaign: any) {
    this.server.emit("campaign:status", campaign);
  }

  // Tenant events
  emitTenantUpdated(tenant: any) {
    this.server.to(`tenant:${tenant.id}`).emit("tenant:updated", tenant);
  }
}
