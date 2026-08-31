import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface PaymobAuthResponse {
  token: string;
}

export interface PaymobOrderResponse {
  id: number;
  created_at: string;
  amount_cents: number;
  currency: string;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface PaymobTransactionCallback {
  obj: {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    is_refunded: boolean;
    is_3d_secure: boolean;
    order: {
      id: number;
    };
    created_at: string;
    currency: string;
    error_occured: boolean;
  };
  type: string;
  hmac: string;
}

export interface PaymobCheckoutResult {
  iframeUrl: string;
  paymentKey: string;
  paymobOrderId: number;
}

// ────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────

@Injectable()
export class PaymobProvider {
  private readonly logger = new Logger(PaymobProvider.name);
  private readonly apiKey: string;
  private readonly integrationId: string;
  private readonly iframeId: string;
  private readonly hmacSecret: string;
  private readonly baseUrl = 'https://accept.paymob.com/api';

  /** Cached auth token + expiry */
  private cachedAuthToken: string | null = null;
  private authTokenExpiry = 0;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAYMOB_API_KEY', '');
    this.integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID', '');
    this.iframeId = this.configService.get<string>('PAYMOB_IFRAME_ID', '');
    this.hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET', '');

    if (!this.apiKey) {
      this.logger.warn(
        'Paymob API key not configured. Payment processing will use mock mode.',
      );
    }
  }

  /** Check if Paymob is configured */
  get isConfigured(): boolean {
    return !!(this.apiKey && this.integrationId);
  }

  // ──────────────────────── Authentication ────────────────────────

  /**
   * Get a valid auth token, refreshing if expired.
   * Paymob tokens are valid for ~1 hour.
   */
  async getAuthToken(): Promise<string> {
    if (this.cachedAuthToken && Date.now() < this.authTokenExpiry) {
      return this.cachedAuthToken;
    }

    const response = await fetch(`${this.baseUrl}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.apiKey }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Paymob auth failed: ${error}`);
      throw new Error(`Paymob authentication failed: ${response.status}`);
    }

    const data = (await response.json()) as PaymobAuthResponse;
    this.cachedAuthToken = data.token;
    // Expire 5 minutes early to be safe
    this.authTokenExpiry = Date.now() + 55 * 60 * 1000;

    return data.token;
  }

  // ──────────────────────── Order Registration ────────────────────────

  /**
   * Register an order with Paymob.
   */
  async registerOrder(
    authToken: string,
    amountCents: number,
    currency: string,
    merchantOrderId: string,
    items: { name: string; amount_cents: number; quantity: number }[],
  ): Promise<PaymobOrderResponse> {
    const response = await fetch(`${this.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency,
        merchant_order_id: merchantOrderId,
        items,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Paymob order registration failed: ${error}`);
      throw new Error(`Paymob order registration failed: ${response.status}`);
    }

    return (await response.json()) as PaymobOrderResponse;
  }

  // ──────────────────────── Payment Key ────────────────────────

  /**
   * Generate a payment key for the iframe.
   */
  async getPaymentKey(
    authToken: string,
    paymobOrderId: number,
    amountCents: number,
    currency: string,
    billingData: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    },
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/acceptance/payment_keys`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600, // 1 hour
          order_id: paymobOrderId,
          billing_data: {
            first_name: billingData.first_name,
            last_name: billingData.last_name,
            email: billingData.email,
            phone_number: billingData.phone_number || 'NA',
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'NA',
            country: 'EG',
            state: 'NA',
          },
          currency,
          integration_id: parseInt(this.integrationId, 10),
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Paymob payment key failed: ${error}`);
      throw new Error(`Paymob payment key failed: ${response.status}`);
    }

    const data = (await response.json()) as PaymobPaymentKeyResponse;
    return data.token;
  }

  // ──────────────────────── Iframe URL ────────────────────────

  /**
   * Build the iframe URL for redirecting the user to the payment page.
   */
  getIframeUrl(paymentKey: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
  }

  // ──────────────────────── Full Checkout Flow ────────────────────────

  /**
   * Complete checkout flow: auth → register order → payment key → iframe URL.
   */
  async initiateCheckout(
    amountCents: number,
    currency: string,
    merchantOrderId: string,
    items: { name: string; amount_cents: number; quantity: number }[],
    billingData: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    },
  ): Promise<PaymobCheckoutResult> {
    const authToken = await this.getAuthToken();

    const paymobOrder = await this.registerOrder(
      authToken,
      amountCents,
      currency,
      merchantOrderId,
      items,
    );

    const paymentKey = await this.getPaymentKey(
      authToken,
      paymobOrder.id,
      amountCents,
      currency,
      billingData,
    );

    return {
      iframeUrl: this.getIframeUrl(paymentKey),
      paymentKey,
      paymobOrderId: paymobOrder.id,
    };
  }

  // ──────────────────────── HMAC Validation ────────────────────────

  /**
   * Validate Paymob webhook HMAC signature.
   * @see https://docs.paymob.com/docs/hmac-calculation
   */
  validateHmac(
    payload: Record<string, unknown>,
    receivedHmac: string,
  ): boolean {
    if (!this.hmacSecret) {
      this.logger.warn('HMAC secret not configured — skipping validation');
      return true;
    }

    // Paymob HMAC concatenation order (alphabetical of specific fields)
    const obj = payload['obj'] as Record<string, unknown>;
    const order = obj['order'] as Record<string, unknown>;

    const hmacString = [
      obj['amount_cents'],
      obj['created_at'],
      obj['currency'],
      obj['error_occured'],
      obj['has_parent_transaction'],
      obj['id'],
      order['id'],
      obj['integration_id'],
      obj['is_3d_secure'],
      obj['is_auth'],
      obj['is_capture'],
      obj['is_refunded'],
      obj['is_standalone_payment'],
      obj['is_voided'],
      obj['owner'],
      obj['pending'],
      obj['source_data_pan'],
      obj['source_data_sub_type'],
      obj['source_data_type'],
      obj['success'],
    ].join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(hmacString)
      .digest('hex');

    return calculatedHmac === receivedHmac;
  }
}
