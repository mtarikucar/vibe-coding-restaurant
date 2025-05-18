import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, DataSource, LessThan } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User, UserRole, OAuthProvider } from "./entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { EmailService } from "../shared/services/email.service";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyPasswordResetTokenDto,
} from "./dto/password-reset.dto";
import { RefreshTokenDto, TokenResponseDto } from "./dto/refresh-token.dto";
import { OAuthLoginDto, OAuthUserInfoDto } from "./dto/oauth.dto";
import { Tenant } from "../tenant/entities/tenant.entity";
import { firstValueFrom } from "rxjs";
import { TokenBlacklistService } from "./services/token-blacklist.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue The default value if not found
   * @returns The configuration value
   */
  getConfig<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue as T);
  }

  async register(
    createUserDto: CreateUserDto,
    tenantId?: string
  ): Promise<Omit<User, "password">> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists in the tenant
      const existingUser = await queryRunner.manager.findOne(User, {
        where: {
          username: createUserDto.username,
          ...(tenantId ? { tenantId } : {}),
        },
      });

      if (existingUser) {
        throw new ConflictException("Username already exists");
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Find tenant if tenantId is provided
      let tenant = null;
      if (tenantId) {
        tenant = await queryRunner.manager.findOne(Tenant, {
          where: { id: tenantId },
        });

        if (!tenant) {
          throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
        }
      } else {
        // If no tenantId provided, try to find the default tenant
        tenant = await queryRunner.manager.findOne(Tenant, {
          where: { schema: "public" },
        });
      }

      // Create new user
      const user = queryRunner.manager.create(User, {
        ...createUserDto,
        password: hashedPassword,
        tenantId: tenant?.id,
        // Set as super admin if it's the first user in the system
        isSuperAdmin: createUserDto.role === UserRole.SUPER_ADMIN,
      });

      // Save the user
      const savedUser = await queryRunner.manager.save(user);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Remove password from response
      const { password, ...result } = savedUser;
      return result;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to register user: ${error.message}`,
        error.stack
      );
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any, userAgent?: string, ipAddress?: string) {
    // Get tenant information if available
    let tenant = null;
    if (user.tenantId) {
      tenant = await this.tenantRepository.findOne({
        where: { id: user.tenantId },
      });
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };

    // Generate access token with shorter expiration
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress
    );

    // Get token expiration time from config
    const expiresIn = parseInt(
      this.configService.get("JWT_EXPIRATION", "900"),
      10
    ); // Default to 15 minutes (900 seconds)

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,
        tenant: tenant
          ? {
              id: tenant.id,
              name: tenant.name,
              displayName: tenant.displayName,
              logo: tenant.logo,
            }
          : null,
      },
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  async findById(id: string): Promise<Omit<User, "password"> | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  async createInitialUsers() {
    try {
      // Find the default tenant
      const defaultTenant = await this.tenantRepository.findOne({
        where: { schema: "public" },
      });

      if (!defaultTenant) {
        this.logger.warn(
          "Default tenant not found. Cannot create initial users."
        );
        return;
      }

      // Check if super admin user already exists
      const superAdminExists = await this.userRepository.findOne({
        where: { username: "superadmin" },
      });

      if (!superAdminExists) {
        // Create super admin user (system-wide admin)
        await this.register({
          username: "superadmin",
          password: "password",
          fullName: "Super Admin User",
          role: UserRole.SUPER_ADMIN,
          email: "superadmin@example.com",
        });

        this.logger.log("Super admin user created");
      }

      // Check if tenant admin user already exists
      const adminExists = await this.userRepository.findOne({
        where: {
          username: "admin",
          tenantId: defaultTenant.id,
        },
      });

      if (!adminExists) {
        // Create admin user (tenant admin)
        await this.register(
          {
            username: "admin",
            password: "password",
            fullName: "Admin User",
            role: UserRole.ADMIN,
            email: "admin@example.com",
          },
          defaultTenant.id
        );

        // Create manager user
        await this.register(
          {
            username: "manager",
            password: "password",
            fullName: "Manager User",
            role: UserRole.MANAGER,
            email: "manager@example.com",
          },
          defaultTenant.id
        );

        // Create waiter user
        await this.register(
          {
            username: "waiter",
            password: "password",
            fullName: "Waiter User",
            role: UserRole.WAITER,
            email: "waiter@example.com",
          },
          defaultTenant.id
        );

        // Create kitchen user
        await this.register(
          {
            username: "kitchen",
            password: "password",
            fullName: "Kitchen User",
            role: UserRole.KITCHEN,
            email: "kitchen@example.com",
          },
          defaultTenant.id
        );

        // Create cashier user
        await this.register(
          {
            username: "cashier",
            password: "password",
            fullName: "Cashier User",
            role: UserRole.CASHIER,
            email: "cashier@example.com",
          },
          defaultTenant.id
        );

        // Create inventory manager
        await this.register(
          {
            username: "inventory",
            password: "password",
            fullName: "Inventory Manager",
            role: UserRole.INVENTORY,
            email: "inventory@example.com",
          },
          defaultTenant.id
        );

        this.logger.log("Initial tenant users created");
      }
    } catch (error) {
      this.logger.error(
        `Failed to create initial users: ${error.message}`,
        error.stack
      );
    }
  }

  async findAllUsers(): Promise<Omit<User, "password">[]> {
    const users = await this.userRepository.find();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<Omit<User, "password">> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If username is being updated, check if it's already taken
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException("Username already exists");
      }
    }

    // If password is provided, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...result } = updatedUser;
    return result;
  }

  async removeUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  /**
   * Request a password reset
   * @param requestPasswordResetDto The email to send the reset link to
   */
  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto
  ): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    // If user not found, still return success to prevent email enumeration
    if (!user) {
      return {
        message:
          "If your email is registered, you will receive a password reset link",
      };
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token for storage
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiry (1 hour from now)
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token and expiry
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await this.userRepository.save(user);

    // Send password reset email
    try {
      const frontendUrl = this.configService.get<string>(
        "FRONTEND_URL",
        "http://localhost:5173"
      );
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${frontendUrl}/reset-password?token=${resetToken}`
      );

      return {
        message:
          "If your email is registered, you will receive a password reset link",
      };
    } catch (error) {
      // If email sending fails, remove the reset token from the user
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await this.userRepository.save(user);

      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Verify a password reset token
   * @param verifyPasswordResetTokenDto The token to verify
   */
  async verifyPasswordResetToken(
    verifyPasswordResetTokenDto: VerifyPasswordResetTokenDto
  ): Promise<{ valid: boolean }> {
    const { token } = verifyPasswordResetTokenDto;

    // Hash the token for comparison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with the token and check if it's still valid
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    // Return whether the token is valid
    return { valid: !!user };
  }

  /**
   * Reset a user's password
   * @param resetPasswordDto The reset password data
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto
  ): Promise<{ message: string }> {
    const { token, password, confirmPassword } = resetPasswordDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    // Hash the token for comparison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with the token and check if it's still valid
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    // If no user found or token expired
    if (!user) {
      throw new BadRequestException("Invalid or expired password reset token");
    }

    // Update user's password and clear reset token
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);

    return { message: "Password has been reset successfully" };
  }

  /**
   * Generate a refresh token for a user
   * @param userId The user ID
   * @param userAgent The user agent string
   * @param ipAddress The IP address
   * @returns The refresh token string
   */
  async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string> {
    // Generate a random token
    const tokenString = crypto.randomBytes(40).toString("hex");

    // Calculate expiration date (default: 30 days)
    const refreshTokenExpiration = this.configService.get<number>(
      "REFRESH_TOKEN_EXPIRATION",
      30 * 24 * 60 * 60 * 1000
    );
    const expiresAt = new Date(Date.now() + refreshTokenExpiration);

    // Create and save the refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token: tokenString,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return tokenString;
  }

  /**
   * Refresh an access token using a refresh token
   * @param refreshTokenDto The refresh token DTO
   * @param userAgent The user agent string
   * @param ipAddress The IP address
   * @returns A new token response
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<TokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Find the refresh token in the database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ["user"],
    });

    // Check if token exists and is valid
    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (storedToken.isRevoked) {
      // Revoke all tokens for this user as this might be a token reuse attack
      await this.revokeAllUserTokens(storedToken.userId);
      throw new ForbiddenException("Refresh token has been revoked");
    }

    if (storedToken.isExpired()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    // Get the user
    const user = storedToken.user;
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Revoke the current refresh token (one-time use)
    await this.revokeRefreshToken(storedToken.id);

    // Create new tokens
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };

    // Generate new access token
    const accessToken = this.jwtService.sign(payload);

    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress
    );

    // Get token expiration time from config
    const expiresIn = parseInt(
      this.configService.get("JWT_EXPIRATION", "900"),
      10
    ); // Default to 15 minutes (900 seconds)

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  /**
   * Revoke a refresh token
   * @param tokenId The token ID
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    const token = await this.refreshTokenRepository.findOne({
      where: { id: tokenId },
    });

    if (token) {
      token.isRevoked = true;
      token.revokedAt = new Date();
      await this.refreshTokenRepository.save(token);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId The user ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
    });

    for (const token of tokens) {
      token.isRevoked = true;
      token.revokedAt = new Date();
    }

    await this.refreshTokenRepository.save(tokens);
  }

  /**
   * Find a refresh token by its value
   * @param tokenValue The token value
   * @returns The refresh token entity or null
   */
  async findRefreshTokenByValue(
    tokenValue: string
  ): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { token: tokenValue },
    });
  }

  /**
   * Decode a JWT token
   * @param token The token to decode
   * @returns The decoded token payload
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      this.logger.error(
        `Failed to decode token: ${error.message}`,
        error.stack
      );
      return null;
    }
  }

  /**
   * Blacklist a token
   * @param token The token to blacklist
   * @param expiresIn Time in seconds until the token expires
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.tokenBlacklistService.addToBlacklist(token, expiresIn);
  }

  /**
   * Check if a token is blacklisted
   * @param token The token to check
   * @returns True if the token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklistService.isBlacklisted(token);
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Find tokens that have expired
      const expiredTokens = await this.refreshTokenRepository.find({
        where: { expiresAt: LessThan(new Date()) },
      });

      if (expiredTokens.length > 0) {
        await this.refreshTokenRepository.remove(expiredTokens);
        this.logger.log(
          `Removed ${expiredTokens.length} expired refresh tokens`
        );
      }
    } catch (error) {
      this.logger.error("Failed to clean up expired tokens", error.stack);
    }
  }

  /**
   * Handle OAuth2 login
   * @param oauthLoginDto The OAuth login data
   * @param userAgent The user agent string
   * @param ipAddress The IP address
   * @returns Token response
   */
  async oauthLogin(
    oauthLoginDto: OAuthLoginDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<TokenResponseDto> {
    const { provider, code, redirectUri } = oauthLoginDto;

    // Get user info from OAuth provider
    let userInfo: OAuthUserInfoDto;

    try {
      switch (provider) {
        case OAuthProvider.GOOGLE:
          userInfo = await this.getGoogleUserInfo(code, redirectUri);
          break;
        // Add other providers as needed
        default:
          throw new BadRequestException(
            `Unsupported OAuth provider: ${provider}`
          );
      }
    } catch (error) {
      this.logger.error(
        `OAuth authentication error: ${error.message}`,
        error.stack
      );
      throw new UnauthorizedException(
        "Failed to authenticate with OAuth provider"
      );
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: [
        { email: userInfo.email, provider },
        { providerId: userInfo.id, provider },
      ],
    });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        username: userInfo.email, // Use email as username for OAuth users
        email: userInfo.email,
        fullName: userInfo.name,
        // Generate a random password for OAuth users
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
        provider,
        providerId: userInfo.id,
        providerData: userInfo.raw,
        role: UserRole.WAITER, // Default role, can be changed later
      });

      try {
        user = await this.userRepository.save(user);
      } catch (error) {
        this.logger.error(
          `Failed to create OAuth user: ${error.message}`,
          error.stack
        );
        throw new InternalServerErrorException("Failed to create user account");
      }
    } else {
      // Update provider data
      user.providerData = userInfo.raw;
      await this.userRepository.save(user);
    }

    // Generate tokens
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress
    );
    const expiresIn = parseInt(
      this.configService.get("JWT_EXPIRATION", "900"),
      10
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  /**
   * Get user info from Google
   * @param code Authorization code
   * @param redirectUri Redirect URI
   * @returns User info
   */
  private async getGoogleUserInfo(
    code: string,
    redirectUri?: string
  ): Promise<OAuthUserInfoDto> {
    // Get OAuth configuration
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        "Google OAuth configuration is missing"
      );
    }

    // Exchange code for tokens
    try {
      const tokenResponse = await firstValueFrom(
        this.httpService.post("https://oauth2.googleapis.com/token", {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri:
            redirectUri ||
            this.configService.get<string>("GOOGLE_REDIRECT_URI"),
          grant_type: "authorization_code",
        })
      );

      const { access_token } = tokenResponse.data;

      // Get user info
      const userInfoResponse = await firstValueFrom(
        this.httpService.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${access_token}` },
        })
      );

      const userData = userInfoResponse.data;

      return {
        id: userData.sub,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        provider: OAuthProvider.GOOGLE,
        raw: userData,
      };
    } catch (error) {
      this.logger.error(`Google OAuth error: ${error.message}`, error.stack);
      throw new UnauthorizedException("Failed to authenticate with Google");
    }
  }
}
