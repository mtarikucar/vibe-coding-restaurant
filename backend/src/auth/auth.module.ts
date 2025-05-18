import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "./entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { Tenant } from "../tenant/entities/tenant.entity";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { AuthThrottlerGuard } from "./guards/throttle.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, RefreshToken]),
    PassportModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET", "secret"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRATION", "15m"), // Shorter expiration for access tokens
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get("THROTTLE_TTL", 60), // Time window in seconds
        limit: configService.get("THROTTLE_LIMIT", 10), // Max requests per time window
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    TokenBlacklistService,
    AuthThrottlerGuard,
  ],
  exports: [AuthService, TokenBlacklistService, AuthThrottlerGuard],
})
export class AuthModule {}
