import crypto from 'crypto';
import forge from 'node-forge';
import { DOMParser } from '@xmldom/xmldom';

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
 * Encrypts data using RSA public key (PKCS1 v1.5) following the
 * official Transactpay encryption guide.
 *
 * The encryption key is a Base64-encoded string that, once decoded, has
 * a "4096!" prefix followed by an XML <RSAKeyValue> containing Modulus
 * and Exponent elements.
 */
function encryptPayload(data: object, rsaPubKey: string): string {
  // 1. Decode the base64-encoded key and strip the "4096!" prefix
  let rsaKeyValue = Buffer.from(rsaPubKey, 'base64').toString('utf-8');
  rsaKeyValue = rsaKeyValue.replace('4096!', '');

  // 2. Parse the XML to extract Modulus and Exponent
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(rsaKeyValue, 'text/xml');
  const modulusB64 = xmlDoc.getElementsByTagName('Modulus')[0]?.textContent;
  const exponentB64 = xmlDoc.getElementsByTagName('Exponent')[0]?.textContent;

  if (!modulusB64 || !exponentB64) {
    throw new Error('Invalid encryption key: could not extract RSA Modulus/Exponent');
  }

  // 3. Convert Modulus and Exponent from base64 → BigInteger
  const BigInteger = forge.jsbn.BigInteger;
  const modulusBI = new BigInteger(
    forge.util.createBuffer(forge.util.decode64(modulusB64)).toHex(),
    16
  );
  const exponentBI = new BigInteger(
    forge.util.createBuffer(forge.util.decode64(exponentB64)).toHex(),
    16
  );

  // 4. Reconstruct the RSA public key
  const pubKey = forge.pki.setRsaPublicKey(modulusBI, exponentBI);

  // 5. Encrypt the JSON-stringified payload with PKCS1 v1.5
  const plaintext = JSON.stringify(data);
  const encryptedBytes = pubKey.encrypt(forge.util.encodeUtf8(plaintext));

  // 6. Return as Base64
  return Buffer.from(encryptedBytes, 'binary').toString('base64');
}

/**
 * Utility to integrate with Transactpay payment flows.
 * Docs: https://transactpay.readme.io/reference/encryption
 */
export class TransactpayService {
  private static API_URL = 'https://payment-api-service.transactpay.ai';

  /**
   * Creates an order on Transactpay and returns the checkout URL
   * that the user should be redirected to.
   *
   * Flow:
   *  1. Build the order payload
   *  2. RSA-encrypt it using the public encryption key
   *  3. POST { data: "<encrypted_base64>" } to /payment/order/create
   *  4. Extract checkout_url from the response
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
      // RSA-encrypt the entire payload
      const encryptedData = encryptPayload(payload, encryptionKey);

      const response = await fetch(`${this.API_URL}/payment/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': publicKey,
        },
        body: JSON.stringify({ data: encryptedData }),
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
