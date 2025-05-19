import { Injectable, ExecutionContext, Inject } from "@nestjs/common";
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerModuleOptions,
} from "@nestjs/throttler";
import Redis from "ioredis";
import { ThrottlerStorage } from "@nestjs/throttler/dist/throttler-storage.interface";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject("IOREDIS_CLIENT") private readonly redis: Redis,
    @Inject("THROTTLER_OPTIONS") options: ThrottlerModuleOptions,
    @Inject("THROTTLER_STORAGE") storageService: ThrottlerStorage,
    reflector: Reflector
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the tracker
    let ip = req.ip;

    // If behind a proxy, get the real IP
    if (req.headers["x-forwarded-for"]) {
      ip = req.headers["x-forwarded-for"].split(",")[0].trim();
    }

    // For login attempts, also include the username to prevent username enumeration
    if (req.path === "/auth/login" && req.body?.username) {
      return `${ip}-${req.body.username}`;
    }

    // For password reset attempts, include the email
    if (req.path === "/auth/forgot-password" && req.body?.email) {
      return `${ip}-${req.body.email}`;
    }

    return ip;
  }

  protected async handleRequest(
    requestProps: Record<string, any>
  ): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const req = context.switchToHttp().getRequest();
    const tracker = await this.getTracker(req);
    const key = `throttle:${tracker}`;

    // Get current count from Redis
    const count = await this.redis.get(key);

    if (count === null) {
      // First request, set to 1 with TTL
      await this.redis.set(key, 1, "EX", ttl);
      return true;
    }

    const currentCount = parseInt(count, 10);

    if (currentCount >= limit) {
      // Too many requests
      throw new ThrottlerException();
    }

    // Increment count
    await this.redis.incr(key);

    return true;
  }
}
