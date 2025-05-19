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
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, RefreshToken]),
    PassportModule,
    HttpModule,
    RedisModule, // Re-enabled Redis module for token blacklisting and throttling
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtExpiration = configService.get("JWT_EXPIRATION", "7d");
        return {
          secret: configService.get("JWT_SECRET", "secret"),
          signOptions: {
            expiresIn: jwtExpiration, // Use the configured expiration
          },
        };
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "auth",
          ttl: 60, // Time window in seconds
          limit: 10, // Max requests per time window
        },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    TokenBlacklistService,
    {
      provide: "THROTTLER_OPTIONS",
      useValue: {
        throttlers: [
          {
            name: "auth",
            ttl: 60,
            limit: 10,
          },
        ],
      },
    },
    {
      provide: "THROTTLER_STORAGE",
      useFactory: (redis) => {
        return {
          async increment(key: string, ttl: number): Promise<number> {
            const value = await redis.incr(key);
            await redis.expire(key, ttl);
            return value;
          },
          async get(key: string): Promise<number> {
            const value = await redis.get(key);
            return value ? parseInt(value, 10) : 0;
          },
        };
      },
      inject: ["IOREDIS_CLIENT"],
    },
    {
      provide: AuthThrottlerGuard,
      useFactory: (redis, options, storageService, reflector) => {
        return new AuthThrottlerGuard(
          redis,
          options,
          storageService,
          reflector
        );
      },
      inject: [
        "IOREDIS_CLIENT",
        "THROTTLER_OPTIONS",
        "THROTTLER_STORAGE",
        "Reflector",
      ],
    },
  ],
  exports: [AuthService, TokenBlacklistService, AuthThrottlerGuard],
})
export class AuthModule {}
