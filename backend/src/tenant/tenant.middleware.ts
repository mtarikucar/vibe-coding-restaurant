import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TenantService } from "./tenant.service";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { TenantStatus } from "./entities/tenant.entity";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private readonly defaultSchema = "public";

  constructor(
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract tenant from subdomain
      const host = req.headers.host || "";
      const subdomain = this.extractSubdomain(host);

      // Skip tenant resolution for public routes
      if (this.isPublicRoute(req.path)) {
        return next();
      }

      // Find tenant by subdomain
      let schema = this.defaultSchema;

      if (subdomain && subdomain !== "www" && subdomain !== "api") {
        try {
          const tenant = await this.tenantService.findBySubdomain(subdomain);

          // Check tenant status
          if (tenant.status === TenantStatus.SUSPENDED) {
            throw new HttpException(
              'Tenant account is suspended. Please contact support.',
              HttpStatus.FORBIDDEN
            );
          }

          if (tenant.status === TenantStatus.EXPIRED) {
            throw new HttpException(
              'Tenant subscription has expired. Please renew your subscription.',
              HttpStatus.PAYMENT_REQUIRED
            );
          }

          if (tenant.isDeleted) {
            throw new HttpException(
              'Tenant account not found.',
              HttpStatus.NOT_FOUND
            );
          }

          schema = tenant.schema;

          // Add tenant info to request
          (req as any).tenantId = tenant.id;
          (req as any).tenantSchema = schema;
          (req as any).tenant = tenant;
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          this.logger.warn(`Tenant not found for subdomain: ${subdomain}`);
          // Continue with default schema if tenant not found
        }
      }

      // Set schema for this request
      await this.dataSource.query(`SET search_path TO "${schema}"`);

      next();
    } catch (error) {
      this.logger.error(
        `Error in tenant middleware: ${error.message}`,
        error.stack
      );
      // Continue with default schema in case of error
      await this.dataSource.query(`SET search_path TO "${this.defaultSchema}"`);
      next();
    }
  }

  private extractSubdomain(host: string): string | null {
    const appDomain = this.configService.get<string>("APP_DOMAIN", "localhost");

    // For localhost development
    if (host.includes("localhost")) {
      return null;
    }

    // Extract subdomain from host
    if (host.includes(appDomain)) {
      const parts = host.split(".");
      if (parts.length > 2) {
        return parts[0];
      }
    }

    return null;
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/tenants",
      "/api/menu/categories",
      "/api/menu/items",
    ];

    return publicRoutes.some((route) => path.startsWith(route));
  }
}
