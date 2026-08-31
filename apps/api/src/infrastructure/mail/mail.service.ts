import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface TemplateContext {
  [key: string]: string | number | boolean | undefined;
}

// ────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly mailEnabled: boolean;
  private readonly mailFrom: string;
  private readonly frontendUrl: string;
  private readonly appName = 'Top-Pharma';

  constructor(private readonly configService: ConfigService) {
    this.mailEnabled =
      this.configService.get<string>('MAIL_ENABLED', 'false') === 'true';
    this.mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@top-pharma.com',
    );
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    if (this.mailEnabled) {
      this.initializeTransport();
    } else {
      this.logger.warn(
        'Mail service is DISABLED (MAIL_ENABLED=false). Emails will be logged only.',
      );
    }
  }

  // ──────────────────────── Transport Setup ────────────────────────

  private initializeTransport(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST', 'smtp.sendgrid.net'),
        port: this.configService.get<number>('MAIL_PORT', 587),
        secure: this.configService.get<number>('MAIL_PORT', 587) === 465,
        auth: {
          user: this.configService.get<string>('MAIL_USER', ''),
          pass: this.configService.get<string>('MAIL_PASS', ''),
        },
      });

      // Verify connection
      this.transporter.verify().then(() => {
        this.logger.log('Mail transport verified and ready');
      }).catch((err) => {
        this.logger.error(`Mail transport verification failed: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize mail transport: ${(error as Error).message}`,
      );
    }
  }

  // ──────────────────────── Core Send ────────────────────────

  async sendMail(options: SendMailOptions): Promise<boolean> {
    // Always log the email for debugging
    this.logger.debug(
      `📧 Email → to: ${options.to} | subject: ${options.subject}`,
    );

    if (!this.mailEnabled || !this.transporter) {
      this.logger.debug('Mail is disabled — email logged but not sent.');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: `"${this.appName}" <${this.mailFrom}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  // ──────────────────────── Email Verification ────────────────────────

  async sendVerificationEmail(
    to: string,
    firstName: string,
    token: string,
  ): Promise<boolean> {
    const verifyUrl = `${this.frontendUrl}/auth/verify-email?token=${token}`;

    const html = this.renderTemplate('verification', {
      firstName,
      verifyUrl,
      appName: this.appName,
    });

    return this.sendMail({
      to,
      subject: `${this.appName} — تأكيد البريد الإلكتروني`,
      html,
    });
  }

  // ──────────────────────── Password Reset ────────────────────────

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    token: string,
  ): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    const html = this.renderTemplate('password-reset', {
      firstName,
      resetUrl,
      appName: this.appName,
    });

    return this.sendMail({
      to,
      subject: `${this.appName} — إعادة تعيين كلمة المرور`,
      html,
    });
  }

  // ──────────────────────── Payment Receipt ────────────────────────

  async sendPaymentReceipt(
    to: string,
    firstName: string,
    orderId: string,
    totalAmount: string,
    currency: string,
    items: { name: string; price: string }[],
  ): Promise<boolean> {
    const html = this.renderTemplate('payment-receipt', {
      firstName,
      orderId,
      totalAmount,
      currency,
      appName: this.appName,
      itemsHtml: items
        .map(
          (item) =>
            `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;text-align:right;">${item.price} ${currency}</td></tr>`,
        )
        .join(''),
    });

    return this.sendMail({
      to,
      subject: `${this.appName} — إيصال الدفع #${orderId.slice(-8)}`,
      html,
    });
  }

  // ──────────────────────── Generic Notification ────────────────────────

  async sendNotificationEmail(
    to: string,
    firstName: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    const html = this.renderTemplate('notification', {
      firstName,
      title,
      body,
      appName: this.appName,
      frontendUrl: this.frontendUrl,
    });

    return this.sendMail({
      to,
      subject: `${this.appName} — ${title}`,
      html,
    });
  }

  // ──────────────────────── Template Rendering ────────────────────────

  /**
   * Simple template renderer — replaces {{key}} placeholders.
   * For production, consider using handlebars/ejs/pug.
   */
  private renderTemplate(
    templateName: string,
    context: TemplateContext,
  ): string {
    const templates: Record<string, string> = {
      verification: this.getVerificationTemplate(),
      'password-reset': this.getPasswordResetTemplate(),
      'payment-receipt': this.getPaymentReceiptTemplate(),
      notification: this.getNotificationTemplate(),
    };

    let html = templates[templateName] || templates['notification'];

    for (const [key, value] of Object.entries(context)) {
      html = html.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value ?? ''),
      );
    }

    return html;
  }

  // ──────────────────────── HTML Templates ────────────────────────

  private getBaseWrapper(content: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{appName}}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">{{appName}}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">منصتك التعليمية الأولى</p>
    </div>
    <!-- Content -->
    <div style="padding:32px 24px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:20px 24px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        © ${new Date().getFullYear()} {{appName}} — جميع الحقوق محفوظة
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private getVerificationTemplate(): string {
    return this.getBaseWrapper(`
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;">مرحبًا {{firstName}} 👋</h2>
      <p style="color:#475569;font-size:16px;line-height:1.7;">
        شكرًا لتسجيلك في <strong>{{appName}}</strong>! لتأكيد بريدك الإلكتروني، اضغط على الزر أدناه:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{verifyUrl}}"
           style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(59,130,246,0.4);">
          تأكيد البريد الإلكتروني ✉️
        </a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">
        إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.
      </p>
    `);
  }

  private getPasswordResetTemplate(): string {
    return this.getBaseWrapper(`
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;">إعادة تعيين كلمة المرور 🔒</h2>
      <p style="color:#475569;font-size:16px;line-height:1.7;">
        مرحبًا {{firstName}}، تم طلب إعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{resetUrl}}"
           style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(239,68,68,0.4);">
          إعادة تعيين كلمة المرور
        </a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">
        هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين، تجاهل هذا البريد.
      </p>
    `);
  }

  private getPaymentReceiptTemplate(): string {
    return this.getBaseWrapper(`
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;">إيصال الدفع ✅</h2>
      <p style="color:#475569;font-size:16px;line-height:1.7;">
        مرحبًا {{firstName}}، تم تأكيد عملية الدفع بنجاح!
      </p>
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:14px;">رقم الطلب</p>
        <p style="margin:0 0 16px;color:#1e293b;font-size:18px;font-weight:600;">#{{orderId}}</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px 16px;text-align:right;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:13px;">المادة</th>
              <th style="padding:8px 16px;text-align:right;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:13px;">السعر</th>
            </tr>
          </thead>
          <tbody>
            {{itemsHtml}}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#1e293b;font-size:16px;">الإجمالي</td>
              <td style="padding:12px 16px;font-weight:700;color:#1e40af;font-size:16px;text-align:right;">{{totalAmount}} {{currency}}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style="color:#94a3b8;font-size:13px;">شكرًا لاستخدامك {{appName}}! 🎓</p>
    `);
  }

  private getNotificationTemplate(): string {
    return this.getBaseWrapper(`
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;">{{title}}</h2>
      <p style="color:#475569;font-size:16px;line-height:1.7;">
        مرحبًا {{firstName}}،
      </p>
      <p style="color:#475569;font-size:16px;line-height:1.7;">{{body}}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{frontendUrl}}"
           style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
          زيارة المنصة
        </a>
      </div>
    `);
  }
}
