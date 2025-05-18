import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../entities/user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      "roles",
      [context.getHandler(), context.getClass()]
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // If user is not authenticated, deny access
    if (!user) {
      return false;
    }

    // Super admins have access to everything
    if (user.isSuperAdmin || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user has one of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.debug(
        `User ${user.username} with role ${user.role} denied access. Required roles: ${requiredRoles.join(", ")}`
      );
    }

    return hasRole;
  }
}
