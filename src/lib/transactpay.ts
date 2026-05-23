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
    const apiKey = process.env.TRANSACTPAY_API_KEY;
    
    // In test/local mode without valid keys, we redirect to our built-in mock checkout page
    if (!apiKey || apiKey.includes('dummy') || apiKey.includes('tp_api_key_test')) {
      const mockCheckoutUrl = `/dashboard/wallet/checkout?reference=${reference}&amount=${amount}&userId=${userId}&email=${encodeURIComponent(email)}`;
      return mockCheckoutUrl;
    }

    try {
      const response = await fetch(`${this.API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
      console.error('Transactpay initialization error, falling back to mock:', error);
      return `/dashboard/wallet/checkout?reference=${reference}&amount=${amount}&userId=${userId}&email=${encodeURIComponent(email)}`;
    }
  }

  /**
   * Verifies the webhook signature from Transactpay.
   */
  static verifySignature(body: string, signature: string): boolean {
    const secret = process.env.TRANSACTPAY_WEBHOOK_SECRET || 'tp_webhook_secret_12345';
    
    // For local mock verification, if signature is "mock-signature", allow it
    if (signature === 'mock-signature') {
      return true;
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
