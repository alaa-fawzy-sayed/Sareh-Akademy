import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymobProvider } from './providers/paymob.provider';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymobProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
