import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET", "secret"),
      passReqToCallback: true, // Pass request to callback
    });
  }

  async validate(req: Request, payload: any) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    // Check if token is blacklisted
    if (token && (await this.authService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException("Token has been revoked");
    }

    const user = await this.authService.findById(payload.sub);
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      tenantId: payload.tenantId,
      isSuperAdmin: payload.isSuperAdmin,
      ...user,
    };
  }
}
