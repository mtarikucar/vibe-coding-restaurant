import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User, UserRole } from "../entities/user.entity";
import { EmailService } from "../../shared/services/email.service";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";

// Mock implementations
const mockUserRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => "test-token"),
});

const mockConfigService = () => ({
  get: jest.fn((key, defaultValue) => {
    if (key === "JWT_SECRET") return "test-secret";
    if (key === "FRONTEND_URL") return "http://localhost:5173";
    return defaultValue;
  }),
});

const mockEmailService = () => ({
  sendPasswordResetEmail: jest.fn(),
});

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(() => "hashed-password"),
  compare: jest.fn(),
}));

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => "random-token"),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => "hashed-token"),
    })),
  })),
}));

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: EmailService, useFactory: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
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

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockReturnValue(user);
      (userRepository.save as jest.Mock).mockResolvedValue(user);

      const result = await service.register(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: "hashed-password",
      });
      expect(userRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        id: "user-id",
        username: "testuser",
        fullName: "Test User",
        role: UserRole.WAITER,
      });
    });

    it("should throw ConflictException if username already exists", async () => {
      const createUserDto = {
        username: "testuser",
        password: "password",
        fullName: "Test User",
        email: "test@example.com",
        role: UserRole.WAITER,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: "existing-user",
      });

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe("requestPasswordReset", () => {
    it("should generate a reset token and send an email", async () => {
      const email = "test@example.com";
      const user = {
        id: "user-id",
        email,
        passwordResetToken: null,
        passwordResetExpires: null,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...user,
        passwordResetToken: "hashed-token",
        passwordResetExpires: expect.any(Date),
      });

      const result = await service.requestPasswordReset({ email });

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(crypto.createHash).toHaveBeenCalledWith("sha256");
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        passwordResetToken: "hashed-token",
        passwordResetExpires: expect.any(Date),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        "random-token",
        "http://localhost:5173/reset-password?token=random-token"
      );
      expect(result).toEqual({
        message:
          "If your email is registered, you will receive a password reset link",
      });
    });

    it("should return success message even if user not found", async () => {
      const email = "nonexistent@example.com";

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.requestPasswordReset({ email });

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result).toEqual({
        message:
          "If your email is registered, you will receive a password reset link",
      });
    });
  });

  describe("verifyPasswordResetToken", () => {
    it("should return valid=true for a valid token", async () => {
      const token = "valid-token";
      const user = {
        id: "user-id",
        passwordResetToken: "hashed-token",
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour in the future
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.verifyPasswordResetToken({ token });

      expect(crypto.createHash).toHaveBeenCalledWith("sha256");
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          passwordResetToken: "hashed-token",
          passwordResetExpires: expect.any(Object),
        },
      });
      expect(result).toEqual({ valid: true });
    });

    it("should return valid=false for an invalid token", async () => {
      const token = "invalid-token";

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.verifyPasswordResetToken({ token });

      expect(result).toEqual({ valid: false });
    });
  });

  describe("resetPassword", () => {
    it("should reset the password with a valid token", async () => {
      const resetPasswordDto = {
        token: "valid-token",
        password: "newpassword",
        confirmPassword: "newpassword",
      };

      const user = {
        id: "user-id",
        passwordResetToken: "hashed-token",
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour in the future
        password: "old-hashed-password",
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...user,
        password: "hashed-password",
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      const result = await service.resetPassword(resetPasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword", 10);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        password: "hashed-password",
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      expect(result).toEqual({
        message: "Password has been reset successfully",
      });
    });

    it("should throw BadRequestException if passwords do not match", async () => {
      const resetPasswordDto = {
        token: "valid-token",
        password: "newpassword",
        confirmPassword: "differentpassword",
      };

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw BadRequestException if token is invalid", async () => {
      const resetPasswordDto = {
        token: "invalid-token",
        password: "newpassword",
        confirmPassword: "newpassword",
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
