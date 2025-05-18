import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User, UserRole } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { EmailService } from "../shared/services/email.service";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyPasswordResetTokenDto,
} from "./dto/password-reset.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {}

  async register(
    createUserDto: CreateUserDto
  ): Promise<Omit<User, "password">> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Save the user
    const savedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...result } = savedUser;
    return result;
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

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      token: this.jwtService.sign(payload),
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
    // Check if admin user already exists
    const adminExists = await this.userRepository.findOne({
      where: { username: "admin" },
    });

    if (!adminExists) {
      // Create admin user
      await this.register({
        username: "admin",
        password: "password",
        fullName: "Admin User",
        role: UserRole.ADMIN,
      });

      // Create waiter user
      await this.register({
        username: "waiter",
        password: "password",
        fullName: "Waiter User",
        role: UserRole.WAITER,
      });

      // Create kitchen user
      await this.register({
        username: "kitchen",
        password: "password",
        fullName: "Kitchen User",
        role: UserRole.KITCHEN,
      });

      // Create cashier user
      await this.register({
        username: "cashier",
        password: "password",
        fullName: "Cashier User",
        role: UserRole.CASHIER,
      });
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
}
