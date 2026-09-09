import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorators';
import { AuthenticatedUser } from '../auth/auth.service';
import { PaymobTransactionCallback } from './providers/paymob.provider';

@ApiTags('Orders & Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create checkout session for selected subjects' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentsService.checkout(user.id, dto);
  }

  @Post('submit-manual-payment')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Submit manual payment with Vodafone Cash or InstaPay receipt' })
  async submitManualPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: {
      subjectIds: string[];
      senderNumber: string;
      paymentMethod?: string;
      receiptUrl: string;
      notes?: string;
      transactionRef?: string;
      discountCode?: string;
    },
  ) {
    return this.paymentsService.submitManualPayment(user.id, dto);
  }

  @Public()
  @Post('webhook/paymob')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paymob webhook transaction processed callback' })
  async paymobWebhook(
    @Body() payload: PaymobTransactionCallback,
    @Headers('hmac') hmacHeader?: string,
  ) {
    return this.paymentsService.handlePaymobWebhook(payload, hmacHeader);
  }

  @Post('mock-complete/:orderId')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Complete payment in mock mode (dev/test)' })
  async mockComplete(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.mockComplete(orderId, user.id);
  }

  @Get('orders')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user order history' })
  async getUserOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.paymentsService.getUserOrders(user.id, pageNum, limitNum);
  }

  @Get('orders/:id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get order details by ID' })
  async getOrderById(
    @Param('id') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.getOrderById(orderId, user.id);
  }
}
