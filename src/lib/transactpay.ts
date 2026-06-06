import crypto from 'crypto';

interface InitializePaymentParams {
  email: string;
  amount: number;
  reference: string;
}

export interface WebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: 'success' | 'failed';
    customer: {
      email: string;
    };
    metadata?: Record<string, unknown>;
  };
}

/**
 * Utility to integrate with Transactpay payment flows.
 * Docs: https://payment-api-service.transactpay.ai
 */
export class TransactpayService {
  private static API_URL = 'https://payment-api-service.transactpay.ai';

  /**
   * Creates an order on Transactpay and returns the checkout URL
   * that the user should be redirected to.
   */
  static async initializePayment({ email, amount, reference }: InitializePaymentParams): Promise<string> {
    const publicKey = process.env.TRANSACTPAY_PUBLIC_KEY;
    const encryptionKey = process.env.TRANSACTPAY_ENCRYPTION_KEY;

    if (!publicKey) {
      throw new Error('TRANSACTPAY_PUBLIC_KEY is not configured.');
    }
    if (!encryptionKey) {
      throw new Error('TRANSACTPAY_ENCRYPTION_KEY is not configured.');
    }

    // Split email to approximate first/last name for the customer object
    const nameParts = email.split('@')[0].split(/[._-]/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts[1] : 'User';

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet/callback`;

    const payload = {
      customer: {
        firstname: firstName,
        lastname: lastName,
        mobile: '',
        country: 'NG',
        email,
      },
      order: {
        amount,
        reference,
        description: `Wallet deposit – ${reference}`,
        currency: 'NGN',
      },
      payment: {
        RedirectUrl: callbackUrl,
      },
    };

    try {
      const response = await fetch(`${this.API_URL}/payment/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': publicKey,
          'encryption-key': encryptionKey,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      console.log('Transactpay order/create response:', JSON.stringify(resData, null, 2));

      if (resData.status && resData.data?.checkout_url) {
        return resData.data.checkout_url;
      }

      throw new Error(resData.message || 'Transactpay order creation failed');
    } catch (error) {
      console.error('Transactpay initialization error:', error);
      throw error;
    }
  }

  /**
   * Verifies the webhook signature from Transactpay.
   */
  static verifySignature(body: string, signature: string): boolean {
    const secret = process.env.TRANSACTPAY_SECRET_KEY;
    if (!secret) {
      console.error('TRANSACTPAY_SECRET_KEY is not configured for signature verification.');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (e) {
      console.error('Error verifying Transactpay signature:', e);
      return false;
    }
  }
}
