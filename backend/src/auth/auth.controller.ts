import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Param,
  Patch,
  Delete,
  Ip,
  Headers,
  Query,
  Res,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { AuthThrottlerGuard } from "./guards/throttle.guard";
import { Roles } from "./decorators/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole, OAuthProvider } from "./entities/user.entity";
import {
  RequestPasswordResetDto,
  VerifyPasswordResetTokenDto,
  ResetPasswordDto,
} from "./dto/password-reset.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { OAuthLoginDto, OAuthCallbackDto } from "./dto/oauth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(
    @Body() loginDto: LoginDto,
    @Request() req,
    @Headers("user-agent") userAgent: string,
    @Ip() ip: string
  ) {
    return this.authService.login(req.user, userAgent, ip);
  }

  @Post("refresh")
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers("user-agent") userAgent: string,
    @Ip() ip: string
  ) {
    return this.authService.refreshToken(refreshTokenDto, userAgent, ip);
  }

  @Post("oauth/login")
  async oauthLogin(
    @Body() oauthLoginDto: OAuthLoginDto,
    @Headers("user-agent") userAgent: string,
    @Ip() ip: string
  ) {
    return this.authService.oauthLogin(oauthLoginDto, userAgent, ip);
  }

  @Get("oauth/google")
  googleAuth(@Query("redirect_uri") redirectUri: string, @Res() res: Response) {
    const clientId = this.authService.getConfig("GOOGLE_CLIENT_ID");
    if (!clientId) {
      throw new UnauthorizedException("Google OAuth is not configured");
    }

    // Generate the Google OAuth URL
    const scope = encodeURIComponent("email profile");
    const responseType = encodeURIComponent("code");
    const redirectUriEncoded = encodeURIComponent(
      redirectUri || this.authService.getConfig("GOOGLE_REDIRECT_URI")
    );

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUriEncoded}&response_type=${responseType}&scope=${scope}`;

    // Redirect to Google's OAuth page
    return res.status(HttpStatus.FOUND).redirect(authUrl);
  }

  @Get("oauth/github")
  githubAuth(@Query("redirect_uri") redirectUri: string, @Res() res: Response) {
    const clientId = this.authService.getConfig("GITHUB_CLIENT_ID");
    if (!clientId) {
      throw new UnauthorizedException("GitHub OAuth is not configured");
    }

    // Generate the GitHub OAuth URL
    const scope = encodeURIComponent("user:email");
    const redirectUriEncoded = encodeURIComponent(
      redirectUri || this.authService.getConfig("GITHUB_REDIRECT_URI")
    );

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUriEncoded}&scope=${scope}`;

    // Redirect to GitHub's OAuth page
    return res.status(HttpStatus.FOUND).redirect(authUrl);
  }

  @Get("oauth/callback/google")
  async googleCallback(
    @Query() query: OAuthCallbackDto,
    @Headers("user-agent") userAgent: string,
    @Ip() ip: string,
    @Query("redirect_uri") redirectUri: string,
    @Res() res: Response
  ) {
    try {
      const { code } = query;
      if (!code) {
        throw new UnauthorizedException("Invalid OAuth callback");
      }

      const result = await this.authService.oauthLogin(
        {
          provider: OAuthProvider.GOOGLE,
          code,
          redirectUri,
        },
        userAgent,
        ip
      );

      // Get the frontend URL from config
      const frontendUrl = this.authService.getConfig(
        "FRONTEND_URL",
        "http://localhost:5173"
      );

      // Redirect to frontend with tokens
      return res
        .status(HttpStatus.FOUND)
        .redirect(
          `${frontendUrl}/oauth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&expires_in=${result.expiresIn}&provider=google`
        );
    } catch (error) {
      const frontendUrl = this.authService.getConfig(
        "FRONTEND_URL",
        "http://localhost:5173"
      );
      return res
        .status(HttpStatus.FOUND)
        .redirect(
          `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error.message)}`
        );
    }
  }

  @Get("oauth/callback/github")
  async githubCallback(
    @Query() query: OAuthCallbackDto,
    @Headers("user-agent") userAgent: string,
    @Ip() ip: string,
    @Query("redirect_uri") redirectUri: string,
    @Res() res: Response
  ) {
    try {
      const { code } = query;
      if (!code) {
        throw new UnauthorizedException("Invalid OAuth callback");
      }

      const result = await this.authService.oauthLogin(
        {
          provider: OAuthProvider.GITHUB,
          code,
          redirectUri,
        },
        userAgent,
        ip
      );

      // Get the frontend URL from config
      const frontendUrl = this.authService.getConfig(
        "FRONTEND_URL",
        "http://localhost:5173"
      );

      // Redirect to frontend with tokens
      return res
        .status(HttpStatus.FOUND)
        .redirect(
          `${frontendUrl}/oauth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&expires_in=${result.expiresIn}&provider=github`
        );
    } catch (error) {
      const frontendUrl = this.authService.getConfig(
        "FRONTEND_URL",
        "http://localhost:5173"
      );
      return res
        .status(HttpStatus.FOUND)
        .redirect(
          `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error.message)}`
        );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(
    @Request() req,
    @Body() body: { refreshToken?: string },
    @Headers("authorization") authHeader: string
  ) {
    // Extract the token from the Authorization header
    const token = authHeader?.split(" ")[1];

    // Blacklist the access token
    if (token) {
      const decodedToken = this.authService.decodeToken(token);
      const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        await this.authService.blacklistToken(token, expiresIn);
      }
    }

    if (body.refreshToken) {
      // If refresh token is provided, revoke only that token
      const refreshToken = await this.authService.findRefreshTokenByValue(
        body.refreshToken
      );
      if (refreshToken && refreshToken.userId === req.user.id) {
        await this.authService.revokeRefreshToken(refreshToken.id);
      }
    } else {
      // Otherwise revoke all tokens for the user
      await this.authService.revokeAllUserTokens(req.user.id);
    }

    return { message: "Logged out successfully" };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("users")
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("users/:id")
  findOneUser(@Param("id") id: string) {
    return this.authService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("users/:id")
  updateUser(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("users/:id")
  removeUser(@Param("id") id: string) {
    return this.authService.removeUser(id);
  }

  @UseGuards(AuthThrottlerGuard)
  @Post("forgot-password")
  requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto
  ) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post("verify-reset-token")
  verifyPasswordResetToken(
    @Body() verifyPasswordResetTokenDto: VerifyPasswordResetTokenDto
  ) {
    return this.authService.verifyPasswordResetToken(
      verifyPasswordResetTokenDto
    );
  }

  @UseGuards(AuthThrottlerGuard)
  @Post("reset-password")
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
