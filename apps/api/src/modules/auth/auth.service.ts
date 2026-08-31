import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { MailService } from '../../infrastructure/mail/mail.service';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

/**
 * Represents the authenticated user object attached to request.user
 * by JwtStrategy after successful JWT validation.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

/** JWT payload embedded in access tokens */
interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/** Shape returned to the client after login / register / refresh */
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/** Full auth response with user profile + tokens */
export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
  expiresIn: number;
}

// ────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Refresh-token lifetime in seconds (default 30 days) */
  private readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.refreshTokenTtlSeconds = this.parseExpiryToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRY', '30d'),
    );
  }

  // ──────────────────────────── REGISTER ────────────────────────────

  async register(
    dto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string; expiresIn: number }> {
    // 1. Check if email already taken
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    // 2. Check phone uniqueness (if provided)
    if (dto.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException('Phone number is already registered');
      }
    }

    // 3. Hash password with argon2
    const passwordHash = await argon2.hash(dto.password);

    // 4. Create user + assign STUDENT role in a transaction
    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone || null,
          passwordHash,
          isActive: true,
          isEmailVerified: false,
          emailVerifyToken: uuidv4(),
        },
      });

      // Find or create STUDENT role
      let studentRole = await tx.role.findUnique({
        where: { name: 'STUDENT' },
      });

      if (!studentRole) {
        studentRole = await tx.role.create({
          data: {
            name: 'STUDENT',
            description: 'Default student role',
            isSystem: true,
          },
        });
      }

      // Assign role
      await tx.userRole_Assignment.create({
        data: {
          userId: newUser.id,
          roleId: studentRole.id,
        },
      });

      return newUser;
    });

    this.logger.log(`User registered: ${user.email} (${user.id})`);

    // 5. Send verification email (fire-and-forget)
    const createdUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (createdUser?.emailVerifyToken) {
      this.mailService
        .sendVerificationEmail(user.email, user.firstName, createdUser.emailVerifyToken)
        .catch((err) => this.logger.error(`Failed to send verification email: ${err.message}`));
    }

    // 6. Build AuthenticatedUser & issue tokens
    const authenticatedUser = await this.validateUserById(user.id);
    if (!authenticatedUser) {
      throw new InternalServerErrorException('Failed to load newly created user');
    }

    const tokens = await this.issueTokenPair(authenticatedUser, userAgent, ipAddress);

    return {
      user: authenticatedUser,
      ...tokens,
    };
  }

  // ──────────────────────────── LOGIN ────────────────────────────

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string; expiresIn: number }> {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    // 2. Verify password
    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 4. Build AuthenticatedUser & issue tokens
    const authenticatedUser = await this.validateUserById(user.id);
    if (!authenticatedUser) {
      throw new UnauthorizedException('Failed to load user profile');
    }

    const tokens = await this.issueTokenPair(authenticatedUser, userAgent, ipAddress);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: authenticatedUser,
      ...tokens,
    };
  }

  // ──────────────────────────── REFRESH TOKENS ────────────────────────────

  async refreshTokens(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string; expiresIn: number }> {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // 1. Find the refresh token in DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Check if revoked
    if (storedToken.revokedAt) {
      // Possible token theft — revoke ALL tokens for this user
      this.logger.warn(
        `Reuse of revoked refresh token detected for user ${storedToken.userId}. Revoking all tokens.`,
      );
      await this.revokeAllUserTokens(storedToken.userId);
      throw new UnauthorizedException('Token has been revoked. All sessions terminated for security.');
    }

    // 3. Check if expired
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 4. Check user is still active
    if (!storedToken.user.isActive || storedToken.user.deletedAt) {
      await this.revokeAllUserTokens(storedToken.userId);
      throw new UnauthorizedException('Account is suspended or deleted');
    }

    // 5. Token rotation: delete the old token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // 6. Issue new token pair
    const authenticatedUser = await this.validateUserById(storedToken.userId);
    if (!authenticatedUser) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokenPair(authenticatedUser, userAgent, ipAddress);

    return {
      user: authenticatedUser,
      ...tokens,
    };
  }

  // ──────────────────────────── LOGOUT ────────────────────────────

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return; // No token to revoke — just clear the cookie on the client
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  // ──────────────────────────── FORGOT PASSWORD ────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    const successMessage = 'If an account with this email exists, a password reset link has been sent.';

    if (!user || user.deletedAt || !user.isActive) {
      return { message: successMessage };
    }

    // Generate reset token + expiry (1 hour)
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // Send reset email
    this.mailService
      .sendPasswordResetEmail(user.email, user.firstName, resetToken)
      .catch((err) => this.logger.error(`Failed to send reset email: ${err.message}`));

    // In dev, also return token for easier testing
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv !== 'production') {
      this.logger.debug(`Password reset token for ${user.email}: ${resetToken}`);
      return { message: successMessage, resetToken };
    }

    return { message: successMessage };
  }

  // ──────────────────────────── RESET PASSWORD ────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // 1. Validate passwords match
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // 2. Find user by reset token
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // 3. Check token expiry
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      // Clear the expired token
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpiry: null },
      });
      throw new BadRequestException('Reset token has expired');
    }

    // 4. Hash new password + clear reset token + revoke all sessions
    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      // Revoke all refresh tokens (force re-login on all devices)
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    this.logger.log(`Password reset completed for ${user.email}`);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  // ──────────────────────────── VERIFY EMAIL ────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    this.logger.log(`Email verified for user: ${user.email}`);

    return { message: 'Email verified successfully' };
  }

  // ──────────────────────────── VALIDATE USER BY ID ────────────────────────────

  /**
   * Called by JwtStrategy.validate() on every authenticated request.
   * Returns the AuthenticatedUser payload that gets attached to req.user,
   * or null if the user doesn't exist / is inactive / soft-deleted.
   */
  async validateUserById(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      this.logger.debug(
        `validateUserById: user ${userId} not found, inactive, or deleted`,
      );
      return null;
    }

    // Flatten roles → string[]
    const roles: string[] = user.userRoles.map(
      (ur: { role: { name: string; permissions: { permission: { name: string } }[] } }) => ur.role.name,
    );

    // Flatten permissions → deduplicated string[]
    const permissions: string[] = [
      ...new Set<string>(
        user.userRoles.flatMap(
          (ur: { role: { name: string; permissions: { permission: { name: string } }[] } }) =>
            ur.role.permissions.map(
              (rp: { permission: { name: string } }) => rp.permission.name,
            ),
        ),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles,
      permissions,
    };
  }

  // ──────────────────────────── PRIVATE HELPERS ────────────────────────────

  /**
   * Issues a new access + refresh token pair.
   * The refresh token is persisted to the DB.
   */
  private async issueTokenPair(
    user: AuthenticatedUser,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlSeconds * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      },
    });

    // Access token expiry in seconds (for the client)
    const accessExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m');
    const expiresIn = this.parseExpiryToSeconds(accessExpiry);

    return { accessToken, refreshToken, expiresIn };
  }

  /** Revoke all active refresh tokens for a user */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.log(`All refresh tokens revoked for user ${userId}`);
  }

  /**
   * Parse duration strings like '15m', '1h', '30d' to seconds.
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 900; // fallback 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default:  return 900;
    }
  }
}
