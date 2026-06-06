import { POST } from '../src/app/api/webhooks/transactpay/route';
import * as fs from 'fs';
import * as path from 'path';

// Set up environment variables manually from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

for (const line of lines) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    process.env[key] = val;
  }
}

async function run() {
  console.log('Simulating webhook call for reference DEP-E251F867...');

  // Create a mock Request
  const mockPayload = {
    event: 'payment.success',
    data: {
      reference: 'DEP-E251F867',
      amount: 1000000,
      status: 'success',
      customer: { email: 'customer@example.com' }
    }
  };

  const req = new Request('http://localhost/api/webhooks/transactpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-transactpay-signature': 'mock-signature'
    },
    body: JSON.stringify(mockPayload)
  });

  try {
    const response = await POST(req);
    const json = await response.json();
    console.log('Webhook Response:', JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error('Webhook simulation failed with error:', err.stack || err);
  }
}

run();
