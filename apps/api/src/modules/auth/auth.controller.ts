import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, AuthenticatedUser } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  /** Refresh token cookie name */
  private readonly COOKIE_NAME = 'refresh_token';

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ──────────────────────────── REGISTER ────────────────────────────

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      dto,
      req.headers['user-agent'],
      req.ip,
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  // ──────────────────────────── LOGIN ────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.headers['user-agent'],
      req.ip,
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  // ──────────────────────────── REFRESH TOKEN ────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies?.[this.COOKIE_NAME];

    const result = await this.authService.refreshTokens(
      oldRefreshToken,
      req.headers['user-agent'],
      req.ip,
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  // ──────────────────────────── LOGOUT ────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[this.COOKIE_NAME];

    await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  // ──────────────────────────── FORGOT PASSWORD ────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent (if account exists)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ──────────────────────────── RESET PASSWORD ────────────────────────────

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ──────────────────────────── VERIFY EMAIL ────────────────────────────

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address using token' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Req() req: Request) {
    const token = (req.query as Record<string, string>).token;
    return this.authService.verifyEmail(token);
  }

  // ──────────────────────────── ME (current user) ────────────────────────────

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  // ──────────────────────────── COOKIE HELPERS ────────────────────────────

  /**
   * Sets the refresh token as an httpOnly cookie.
   * - HttpOnly: not accessible from JS
   * - Secure: HTTPS only in production
   * - SameSite=Lax: CSRF protection
   * - Path=/api/v1/auth: only sent with auth requests
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieSecure = this.configService.get<string>('COOKIE_SECURE', 'false') === 'true';
    const refreshExpiryStr = this.configService.get<string>('JWT_REFRESH_EXPIRY', '30d');
    const maxAgeMs = this.parseExpiryToMs(refreshExpiryStr);

    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction || cookieSecure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: maxAgeMs,
    });
  }

  /** Clears the refresh token cookie */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(this.COOKIE_NAME, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  /** Parse duration strings like '30d' to milliseconds */
  private parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // 30 days fallback

    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 3600 * 1000;
      case 'd': return value * 86400 * 1000;
      default:  return 30 * 86400 * 1000;
    }
  }
}
