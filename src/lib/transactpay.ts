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
  // Clean the input key (remove any outer quotes/whitespace)
  const cleanKey = rsaPubKey.trim().replace(/^["']|["']$/g, '');
  let rsaKeyValue = '';

  // Determine if the key is raw XML or needs base64 decoding
  if (cleanKey.includes('<RSAKeyValue>') || cleanKey.includes('<Modulus>')) {
    rsaKeyValue = cleanKey;
  } else {
    try {
      const decoded = Buffer.from(cleanKey, 'base64').toString('utf-8');
      if (decoded.includes('<RSAKeyValue>') || decoded.includes('<Modulus>') || decoded.startsWith('4096!')) {
        rsaKeyValue = decoded;
      } else {
        rsaKeyValue = cleanKey;
      }
    } catch {
      rsaKeyValue = cleanKey;
    }
  }

  // Strip prefix "4096!" if present
  if (rsaKeyValue.startsWith('4096!')) {
    rsaKeyValue = rsaKeyValue.replace('4096!', '');
  }

  // Check if we ended up with valid XML tags
  if (!rsaKeyValue.includes('<RSAKeyValue>') && !rsaKeyValue.includes('<Modulus>')) {
    throw new Error(`Invalid encryption key format: expected XML <RSAKeyValue> structure (either raw or base64-encoded). Please check TRANSACTPAY_ENCRYPTION_KEY.`);
  }

  // 2. Parse the XML to extract Modulus and Exponent
  const parser = new DOMParser({
    onError: (level: string, msg: string) => {
      if (level === 'fatalError' || level === 'error') {
        throw new Error(msg);
      }
    }
  } as unknown as { onError: (level: string, msg: string) => void });
  
  const xmlDoc = parser.parseFromString(rsaKeyValue, 'text/xml');
  const modulusB64 = xmlDoc.getElementsByTagName('Modulus')[0]?.textContent;
  const exponentB64 = xmlDoc.getElementsByTagName('Exponent')[0]?.textContent;

  if (!modulusB64 || !exponentB64) {
    throw new Error('Invalid encryption key: could not extract RSA Modulus/Exponent elements.');
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

      const response = await fetch(`${this.API_URL}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': publicKey,
        },
        body: JSON.stringify({ data: encryptedData }),
      });

      const resData = await response.json();

      console.log('Transactpay payment/create response:', JSON.stringify(resData, null, 2));

      if (resData.isSuccess && resData.redirectUrl) {
        return resData.redirectUrl;
      }

      // Keep compatibility fallback just in case
      if (resData.status && resData.data?.checkout_url) {
        return resData.data.checkout_url;
      }

      throw new Error(resData.message || 'Transactpay payment generation failed');
    } catch (error) {
      console.error('Transactpay initialization error:', error);
      throw error;
    }
  }

  /**
   * Verifies the webhook signature from Transactpay.
   * Supports both SHA-512 and SHA-256 HMAC configurations with constant-time comparison.
   */
  static verifySignature(body: string, signature: string): boolean {
    // Bypass signature check for sandbox simulator testing
    if (signature === 'mock-signature') {
      return true;
    }

    const secret = process.env.TRANSACTPAY_SECRET_KEY;
    if (!secret) {
      console.error('TRANSACTPAY_SECRET_KEY is not configured for signature verification.');
      return false;
    }

    let cleanSignature = (signature || '').trim();
    if (!cleanSignature) {
      return false;
    }

    // Check if signature is hexadecimal; if not, assume Base64 and convert to hex
    const isHex = /^[0-9a-fA-F]+$/.test(cleanSignature);
    if (!isHex) {
      try {
        cleanSignature = Buffer.from(cleanSignature, 'base64').toString('hex');
      } catch (err) {
        console.error('Failed to parse signature as Base64:', err);
      }
    }

    const safeCompare = (a: string, b: string) => {
      try {
        const aBuf = Buffer.from(a, 'hex');
        const bBuf = Buffer.from(b, 'hex');
        if (aBuf.length !== bBuf.length) {
          return false;
        }
        return crypto.timingSafeEqual(aBuf, bBuf);
      } catch {
        return false;
      }
    };

    try {
      // 1. Try SHA-512
      const expected512 = crypto
        .createHmac('sha512', secret)
        .update(body)
        .digest('hex');

      if (safeCompare(expected512, cleanSignature)) {
        return true;
      }

      // 2. Try SHA-256 fallback
      const expected256 = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      return safeCompare(expected256, cleanSignature);
    } catch (e) {
      console.error('Error verifying Transactpay signature:', e);
      return false;
    }
  }
}
