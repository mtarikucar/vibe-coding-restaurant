import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserRole } from '../entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';

// Mock implementations
const mockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  findAllUsers: jest.fn(),
  findById: jest.fn(),
  updateUser: jest.fn(),
  removeUser: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyPasswordResetToken: jest.fn(),
  resetPassword: jest.fn(),
});

// Mock guards
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };
const mockLocalAuthGuard = { canActivate: jest.fn(() => true) };

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useFactory: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto = {
        username: 'testuser',
        password: 'password',
        fullName: 'Test User',
        role: UserRole.WAITER,
      };

      const expectedResult = {
        id: 'user-id',
        username: 'testuser',
        fullName: 'Test User',
        role: UserRole.WAITER,
      };

      (service.register as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(service.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password',
      };

      const req = {
        user: {
          id: 'user-id',
          username: 'testuser',
          fullName: 'Test User',
          role: UserRole.WAITER,
        },
      };

      const expectedResult = {
        user: {
          id: 'user-id',
          username: 'testuser',
          fullName: 'Test User',
          role: UserRole.WAITER,
        },
        token: 'jwt-token',
      };

      (service.login as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, req);

      expect(service.login).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request a password reset', async () => {
      const requestPasswordResetDto = {
        email: 'test@example.com',
      };

      const expectedResult = {
        message: 'If your email is registered, you will receive a password reset link',
      };

      (service.requestPasswordReset as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.requestPasswordReset(requestPasswordResetDto);

      expect(service.requestPasswordReset).toHaveBeenCalledWith(requestPasswordResetDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify a password reset token', async () => {
      const verifyPasswordResetTokenDto = {
        token: 'reset-token',
      };

      const expectedResult = {
        valid: true,
      };

      (service.verifyPasswordResetToken as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.verifyPasswordResetToken(verifyPasswordResetTokenDto);

      expect(service.verifyPasswordResetToken).toHaveBeenCalledWith(verifyPasswordResetTokenDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should reset a password', async () => {
      const resetPasswordDto = {
        token: 'reset-token',
        password: 'newpassword',
        confirmPassword: 'newpassword',
      };

      const expectedResult = {
        message: 'Password has been reset successfully',
      };

      (service.resetPassword as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(service.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
