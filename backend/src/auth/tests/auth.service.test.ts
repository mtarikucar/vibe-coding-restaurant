import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User, UserRole } from "../entities/user.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";
import { TokenBlacklistService } from "../services/token-blacklist.service";
import { EmailService } from "../../shared/services/email.service";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

// Mock implementations
const mockUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockRefreshTokenRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

const mockTenantRepository = () => ({
  findOne: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => "test-token"),
  verify: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn((key) => {
    if (key === "JWT_SECRET") return "test-secret";
    if (key === "JWT_EXPIRATION") return "15m";
    if (key === "REFRESH_TOKEN_EXPIRATION") return "7d";
    if (key === "FRONTEND_URL") return "http://localhost:5173";
    return null;
  }),
});

const mockEmailService = () => ({
  sendPasswordResetEmail: jest.fn(),
});

const mockTokenBlacklistService = () => ({
  addToBlacklist: jest.fn(),
  isBlacklisted: jest.fn(() => false),
  removeFromBlacklist: jest.fn(),
});

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(() => "hashed-password"),
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        {
          provide: getRepositoryToken(RefreshToken),
          useFactory: mockRefreshTokenRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useFactory: mockTenantRepository,
        },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: EmailService, useFactory: mockEmailService },
        {
          provide: TokenBlacklistService,
          useFactory: mockTokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<
      Repository<User>
    >;
    refreshTokenRepository = module.get(
      getRepositoryToken(RefreshToken)
    ) as jest.Mocked<Repository<RefreshToken>>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    tokenBlacklistService = module.get(
      TokenBlacklistService
    ) as jest.Mocked<TokenBlacklistService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const createUserDto = {
        username: "testuser",
        password: "password",
        fullName: "Test User",
        email: "test@example.com",
        role: UserRole.WAITER,
      };

      const user = {
        id: "user-id",
        ...createUserDto,
        password: "hashed-password",
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(user as any);
      userRepository.save.mockResolvedValue(user as any);

      const result = await service.register(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: "user-id",
          username: "testuser",
          fullName: "Test User",
        })
      );
      // The password should be excluded from the result
      expect((result as any).password).toBeUndefined();
    });

    it("should throw an error if username already exists", async () => {
      const createUserDto = {
        username: "existinguser",
        password: "password",
        fullName: "Existing User",
        email: "existing@example.com",
        role: UserRole.WAITER,
      };

      userRepository.findOne.mockResolvedValue({ id: "existing-id" } as User);

      await expect(service.register(createUserDto)).rejects.toThrow();
    });
  });

  describe("validateUser", () => {
    it("should return a user if credentials are valid", async () => {
      const user = {
        id: "user-id",
        username: "testuser",
        password: "hashed-password",
        fullName: "Test User",
        role: UserRole.WAITER,
      };

      userRepository.findOne.mockResolvedValue(user as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("testuser", "password");

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        "hashed-password"
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: "user-id",
          username: "testuser",
        })
      );
      // The password should be excluded from the result
      expect((result as any).password).toBeUndefined();
    });

    it("should return null if user does not exist", async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser("nonexistent", "password");

      expect(result).toBeNull();
    });

    it("should return null if password is invalid", async () => {
      const user = {
        id: "user-id",
        username: "testuser",
        password: "hashed-password",
        fullName: "Test User",
        role: UserRole.WAITER,
      };

      userRepository.findOne.mockResolvedValue(user as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser("testuser", "wrongpassword");

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return tokens when login is successful", async () => {
      const user = {
        id: "user-id",
        username: "testuser",
        fullName: "Test User",
        role: UserRole.WAITER,
      };

      const refreshToken = {
        id: "token-id",
        token: "refresh-token",
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      refreshTokenRepository.create.mockReturnValue(
        refreshToken as RefreshToken
      );
      refreshTokenRepository.save.mockResolvedValue(
        refreshToken as RefreshToken
      );
      jwtService.sign.mockReturnValue("access-token");

      const result = await service.login(user, "user-agent", "127.0.0.1");

      expect(jwtService.sign).toHaveBeenCalled();
      expect(refreshTokenRepository.create).toHaveBeenCalled();
      expect(refreshTokenRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          accessToken: "access-token",
          refreshToken: "refresh-token",
        })
      );
    });
  });
});
