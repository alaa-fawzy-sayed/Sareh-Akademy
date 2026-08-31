import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaymobProvider, PaymobTransactionCallback } from './providers/paymob.provider';
import { MailService } from '../../infrastructure/mail/mail.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import {
  AccessSource,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from '@top-pharma/types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymobProvider: PaymobProvider,
    private readonly mailService: MailService,
  ) {}

  /**
   * Create an order and initiate Paymob payment or Mock payment
   */
  async checkout(userId: string, dto: CreateCheckoutDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new ForbiddenException('User is not active or not found');
    }

    // 1. Fetch subjects
    const subjects = await this.prisma.subject.findMany({
      where: {
        id: { in: dto.subjectIds },
        isPublished: true,
        deletedAt: null,
      },
    });

    if (subjects.length !== dto.subjectIds.length) {
      throw new BadRequestException('One or more selected subjects are unavailable');
    }

    // Check if user already has active access to any of these subjects
    const existingAccess = await this.prisma.userAccess.findMany({
      where: {
        userId,
        subjectId: { in: dto.subjectIds },
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existingAccess.length > 0) {
      throw new BadRequestException('You already have active access to one or more selected subjects');
    }

    // 2. Calculate subtotal (in EGP / Numbers)
    let subtotal = 0;
    for (const sub of subjects) {
      const price = sub.isFree ? 0 : Number(sub.price ?? 0);
      subtotal += price;
    }

    // 3. Apply Discount (if applicable)
    let discountAmount = 0;
    let appliedDiscount: any = null;

    if (dto.discountCode) {
      const discount = await this.prisma.discount.findUnique({
        where: { code: dto.discountCode.toUpperCase().trim() },
        include: { subjects: true },
      });

      if (
        !discount ||
        !discount.isActive ||
        (discount.expiresAt && discount.expiresAt < new Date()) ||
        (discount.maxUses !== null && discount.usedCount >= discount.maxUses)
      ) {
        throw new BadRequestException('Invalid or expired discount code');
      }

      // Check subject restrictions if any
      const restrictedSubjectIds = discount.subjects.map((s: { subjectId: string }) => s.subjectId);
      const eligibleSubjects = restrictedSubjectIds.length > 0
        ? subjects.filter((s: { id: string }) => restrictedSubjectIds.includes(s.id))
        : subjects;

      if (eligibleSubjects.length === 0) {
        throw new BadRequestException('Discount code is not applicable to the selected subjects');
      }

      let eligibleTotal = 0;
      for (const s of eligibleSubjects) {
        eligibleTotal += s.isFree ? 0 : Number(s.price ?? 0);
      }

      const discVal = Number(discount.value);
      if (String(discount.type) === 'PERCENTAGE') {
        discountAmount = (eligibleTotal * discVal) / 100;
      } else {
        discountAmount = Math.min(discVal, eligibleTotal);
      }

      appliedDiscount = discount;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // 4. Create Order & OrderItems in a transaction
    const order = await this.prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          totalAmount: totalAmount.toFixed(2),
          currency: 'EGP',
          discountId: appliedDiscount ? appliedDiscount.id : null,
          discountAmount: appliedDiscount ? discountAmount.toFixed(2) : null,
          items: {
            create: subjects.map((sub: { id: string; nameAr: string; nameEn: string; isFree: boolean; price: any }) => ({
              subjectId: sub.id,
              subjectName: sub.nameAr || sub.nameEn,
              price: (sub.isFree ? 0 : Number(sub.price ?? 0)).toFixed(2),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      if (appliedDiscount) {
        await tx.discount.update({
          where: { id: appliedDiscount.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // 5. If totalAmount is 0 (e.g. 100% discount or free subjects), auto-verify and grant access immediately
    if (totalAmount === 0) {
      await this.completeOrderSuccess(order.id, 'FREE_OR_100_DISCOUNT', PaymentProvider.MANUAL);
      return {
        orderId: order.id,
        isFree: true,
        status: OrderStatus.PAID,
        message: 'Order completed successfully at zero cost',
      };
    }

    // 6. If Paymob is configured, initiate checkout with Paymob
    const amountCents = Math.round(totalAmount * 100);

    if (this.paymobProvider.isConfigured) {
      try {
        const checkout = await this.paymobProvider.initiateCheckout(
          amountCents,
          'EGP',
          order.id,
          order.items.map((i: { subjectName: string; price: any }) => ({
            name: i.subjectName,
            amount_cents: Math.round(Number(i.price) * 100),
            quantity: 1,
          })),
          {
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            phone_number: user.phone || '',
          },
        );

        // Record initial payment record
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            provider: PaymentProvider.PAYMOB as any,
            providerRef: String(checkout.paymobOrderId),
            status: PaymentStatus.PENDING as any,
            amount: totalAmount.toFixed(2),
            currency: 'EGP',
          },
        });

        return {
          orderId: order.id,
          isFree: false,
          status: OrderStatus.PENDING,
          iframeUrl: checkout.iframeUrl,
          paymentKey: checkout.paymentKey,
          paymobOrderId: checkout.paymobOrderId,
        };
      } catch (err) {
        this.logger.error(`Paymob initiateCheckout error: ${(err as Error).message}`);
        throw new BadRequestException('Failed to communicate with payment gateway');
      }
    } else {
      // Mock payment mode
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.MOCK as any,
          providerRef: `MOCK-${Date.now()}`,
          status: PaymentStatus.PENDING as any,
          amount: totalAmount.toFixed(2),
          currency: 'EGP',
        },
      });

      return {
        orderId: order.id,
        isFree: false,
        status: OrderStatus.PENDING,
        mockMode: true,
        message: 'Payment gateway in mock mode. Use /payments/mock-complete/:orderId to complete testing.',
      };
    }
  }

  /**
   * Handle Webhook from Paymob
   */
  async handlePaymobWebhook(payload: PaymobTransactionCallback, hmacHeader?: string) {
    if (hmacHeader) {
      const isValid = this.paymobProvider.validateHmac(payload as unknown as Record<string, unknown>, hmacHeader);
      if (!isValid) {
        this.logger.warn('Paymob Webhook HMAC validation failed');
        throw new ForbiddenException('Invalid HMAC signature');
      }
    }

    const txObj = payload.obj;
    if (!txObj) {
      return { received: true };
    }

    const isSuccess = txObj.success === true && !txObj.pending;
    const paymobOrderId = String(txObj.order?.id);
    const transactionId = String(txObj.id);

    // Find payment by providerRef (paymobOrderId)
    const payment = await this.prisma.payment.findFirst({
      where: {
        providerRef: paymobOrderId,
        provider: PaymentProvider.PAYMOB as any,
      },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Paymob webhook: Payment record not found for paymobOrderId ${paymobOrderId}`);
      return { received: true };
    }

    if (String(payment.status) === PaymentStatus.VERIFIED) {
      return { received: true, alreadyProcessed: true };
    }

    if (isSuccess) {
      await this.completeOrderSuccess(
        payment.orderId,
        transactionId,
        PaymentProvider.PAYMOB,
        payload as any,
      );
    } else {
      await this.prisma.$transaction(async (tx: any) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED as any,
            failedAt: new Date(),
            webhookPayload: payload as any,
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.FAILED as any },
        });
      });
      this.logger.warn(`Paymob payment failed for order ${payment.orderId}`);
    }

    return { received: true, success: isSuccess };
  }

  /**
   * Complete Order and grant subject access to the user
   */
  async completeOrderSuccess(
    orderId: string,
    providerRef: string,
    provider: PaymentProvider,
    webhookPayload?: any,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (String(order.status) === OrderStatus.PAID) {
      return order;
    }

    await this.prisma.$transaction(async (tx: any) => {
      // 1. Update Order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID as any },
      });

      // 2. Upsert/Update Payment
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PaymentStatus.VERIFIED as any,
            verifiedAt: new Date(),
            providerRef,
            webhookPayload: webhookPayload ?? order.payment.webhookPayload,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: provider as any,
            providerRef,
            status: PaymentStatus.VERIFIED as any,
            amount: order.totalAmount,
            currency: order.currency,
            verifiedAt: new Date(),
            webhookPayload,
          },
        });
      }

      // 3. Grant UserAccess for each subject
      for (const item of order.items) {
        const existing = await tx.userAccess.findFirst({
          where: {
            userId: order.userId,
            subjectId: item.subjectId,
            revokedAt: null,
          },
        });

        if (!existing) {
          await tx.userAccess.create({
            data: {
              userId: order.userId,
              subjectId: item.subjectId,
              source: AccessSource.PURCHASE as any,
              metadata: { orderId: order.id, price: item.price },
            },
          });
        }
      }

      // 4. Create in-app notification for user
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'PAYMENT_CONFIRMED' as any,
          title: 'تم تأكيد الدفع بنجاح',
          body: `تم تفعيل المواد بنجاح للطلب رقم #${order.id.slice(-8)}. بالتوفيق في دراستك!`,
          metadata: { orderId: order.id, totalAmount: order.totalAmount.toString() },
        },
      });
    });

    // 5. Send Payment Receipt Email asynchronously
    this.mailService
      .sendPaymentReceipt(
        order.user.email,
        order.user.firstName,
        order.id,
        order.totalAmount.toString(),
        order.currency,
        order.items.map((i: { subjectName: string; price: any }) => ({ name: i.subjectName, price: i.price.toString() })),
      )
      .catch((err) => this.logger.error(`Failed to send receipt email: ${err.message}`));

    this.logger.log(`Order ${orderId} successfully completed and access granted`);
    return order;
  }

  /**
   * Mock payment completion (useful in dev/test environment)
   */
  async mockComplete(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Cannot complete order belonging to another user');
    }

    return this.completeOrderSuccess(orderId, `MOCK-DONE-${Date.now()}`, PaymentProvider.MOCK);
  }

  /**
   * Get user order history
   */
  async getUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payment: {
            select: {
              provider: true,
              status: true,
              verifiedAt: true,
            },
          },
        },
      }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order details
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        discount: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Unauthorized access to order');
    }

    return order;
  }
}
