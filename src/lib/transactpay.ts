import crypto from 'crypto';

interface InitializePaymentParams {
  userId: string;
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
 */
export class TransactpayService {
  private static API_URL = 'https://api.transactpay.com/v1'; // Dummy Transactpay API URL

  /**
   * Initializes a payment session on Transactpay.
   * Returns a checkout URL. If credentials are dummy, returns a local mock checkout URL.
   */
  static async initializePayment({ userId, email, amount, reference }: InitializePaymentParams): Promise<string> {
    const secretKey = process.env.TRANSACTPAY_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('TRANSACTPAY_SECRET_KEY is not configured.');
    }

    try {
      const response = await fetch(`${this.API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Transactpay might expect amount in kobo, standard for Nigerian gateways
          email,
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet/callback`,
          metadata: { userId },
        }),
      });

      const resData = await response.json();
      if (resData.status && resData.data?.checkout_url) {
        return resData.data.checkout_url;
      }
      throw new Error(resData.message || 'Transactpay initialization failed');
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
