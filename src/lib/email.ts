/**
 * Email utility library using Resend
 *
 * Sends transactional emails for all major platform events.
 * Configure RESEND_API_KEY and RESEND_FROM_EMAIL in your environment.
 * Admin notifications go to ADMIN_EMAIL (azeedbestway@gmail.com).
 *
 * IMPORTANT: To send from a custom domain (e.g. noreply@azead.com),
 * verify the domain in your Resend dashboard first.
 * Until then, use the Resend sandbox or onboarding@resend.dev.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AZEAD Invest <hello@azeadinvest.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'azeedbestway@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://azeadinvest.com';

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#030712;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#0f172a);padding:32px 40px;border-radius:16px 16px 0 0;border:1px solid #1e293b;border-bottom:none;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#10b981,#14b8a6);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                          <span style="font-size:22px;line-height:40px;">📈</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="font-size:20px;font-weight:800;color:#f8fafc;letter-spacing:-0.5px;">AZEAD</span>
                          <span style="font-size:11px;color:#6ee7b7;display:block;margin-top:1px;font-weight:500;letter-spacing:0.5px;">INVESTMENT PLATFORM</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;color:#6ee7b7;font-weight:600;letter-spacing:0.5px;">25.00% APR</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#0f172a;padding:40px;border:1px solid #1e293b;border-top:none;border-bottom:none;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#030712;padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #1e293b;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;color:#475569;">
                © ${new Date().getFullYear()} AZEAD Invest — Banana Island, Lagos, Nigeria
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">azead.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:support@azead.com" style="color:#10b981;text-decoration:none;">support@azead.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function badge(text: string, color: 'green' | 'amber' | 'red' | 'blue'): string {
  const map = {
    green: { bg: '#064e3b', text: '#6ee7b7', border: '#10b981' },
    amber:  { bg: '#451a03', text: '#fcd34d', border: '#f59e0b' },
    red:    { bg: '#450a0a', text: '#fca5a5', border: '#ef4444' },
    blue:   { bg: '#0c1a3a', text: '#93c5fd', border: '#3b82f6' },
  };
  const c = map[color];
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${c.bg};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.5px;border:1px solid ${c.border};">${text}</span>`;
}

function infoRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#94a3b8;border-bottom:1px solid #1e293b;">${label}</td>
    <td style="padding:10px 16px;font-size:13px;color:#f8fafc;font-weight:600;text-align:right;border-bottom:1px solid #1e293b;">${value}</td>
  </tr>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#14b8a6);color:#030712;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;margin-top:24px;">${label}</a>`;
}

// ─── Helper: fire-and-forget email sender ─────────────────────────────────────

async function send(to: string | string[], subject: string, html: string): Promise<void> {
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    // Never let email failures crash the main flow
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER EMAILS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Welcome email sent after user confirms their email address.
 */
export async function sendUserWelcome(userEmail: string, firstName: string): Promise<void> {
  const html = baseLayout('Welcome to AZEAD Invest', `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f8fafc;">Welcome to AZEAD, ${firstName}! 🎉</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Your account has been verified and is now fully active. You can start building wealth today with our 25% APR structured investment plan.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td style="padding:20px 16px 16px;">
        <p style="margin:0 0 12px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Getting Started</p>
      </td></tr>
      <tr>
        <td style="padding:0 16px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 12px;background:#0f172a;border-radius:8px;margin-bottom:8px;">
                <span style="font-size:13px;color:#94a3b8;">✅ &nbsp;Email verified — account active</span>
              </td>
            </tr>
            <tr><td style="height:6px;"></td></tr>
            <tr>
              <td style="padding:8px 12px;background:#0f172a;border-radius:8px;">
                <span style="font-size:13px;color:#94a3b8;">💰 &nbsp;Fund your wallet to start your first investment</span>
              </td>
            </tr>
            <tr><td style="height:6px;"></td></tr>
            <tr>
              <td style="padding:8px 12px;background:#0f172a;border-radius:8px;">
                <span style="font-size:13px;color:#94a3b8;">📈 &nbsp;Watch your interest accrue in real-time</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard`, 'Go to My Dashboard')}
    </div>
  `);
  await send(userEmail, 'Welcome to AZEAD — Your Account Is Active', html);
}

/**
 * Deposit confirmed — sent when funds are successfully credited to wallet.
 */
export async function sendUserDepositConfirmed(
  userEmail: string,
  firstName: string,
  amount: number,
  reference: string,
  newBalance: number
): Promise<void> {
  const html = baseLayout('Deposit Confirmed', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#064e3b,#0f172a);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:2px solid #10b981;font-size:28px;line-height:64px;">✅</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;text-align:center;">Deposit Successful</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Hi ${firstName}, your wallet has been credited.</p>
    <p style="text-align:center;margin:0 0 28px;">${badge('CONFIRMED', 'green')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Transaction Summary</td></tr>
      ${infoRow('Amount Deposited', formatNaira(amount))}
      ${infoRow('Reference', reference)}
      ${infoRow('New Wallet Balance', formatNaira(newBalance))}
      ${infoRow('Status', 'Credited')}
    </table>

    <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px;">
      Your funds are now available in your wallet. You can deploy them into the <strong style="color:#f8fafc;">Azead Wealth Plan</strong> to start earning 25% annual interest immediately.
    </p>
    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/investments`, 'Invest Now')}
    </div>
  `);
  await send(userEmail, `Deposit of ${formatNaira(amount)} Confirmed — AZEAD`, html);
}

/**
 * Investment purchased — sent when a new investment position is created.
 */
export async function sendUserInvestmentPurchased(
  userEmail: string,
  firstName: string,
  amount: number,
  durationYears: number,
  maturityDate: Date,
  expectedPayout: number
): Promise<void> {
  const maturityStr = maturityDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const html = baseLayout('Investment Confirmed', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;line-height:1;">🔐</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;text-align:center;">Investment Locked In</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Hi ${firstName}, your wealth plan is now active and earning.</p>
    <p style="text-align:center;margin:0 0 28px;">${badge('ACTIVE', 'green')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Investment Details</td></tr>
      ${infoRow('Principal Amount', formatNaira(amount))}
      ${infoRow('Annual Interest Rate', '25.00% APR')}
      ${infoRow('Lock-in Duration', `${durationYears} Year${durationYears > 1 ? 's' : ''}`)}
      ${infoRow('Expected Total Payout', formatNaira(expectedPayout))}
      ${infoRow('Maturity Date', maturityStr)}
    </table>

    <div style="background:#0a2818;border:1px solid #10b981;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#6ee7b7;line-height:1.6;">
        <strong>📊 Live Accrual Active:</strong> Your interest is now accumulating in real-time on your dashboard. Log in any time to track your growing wealth.
      </p>
    </div>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/investments`, 'View My Investment')}
    </div>
  `);
  await send(userEmail, `Investment of ${formatNaira(amount)} Locked In — AZEAD`, html);
}

/**
 * Investment matured — sent when the lock-in period expires and payout is processed.
 */
export async function sendUserInvestmentMatured(
  userEmail: string,
  firstName: string,
  principalAmount: number,
  interestEarned: number,
  totalPayout: number
): Promise<void> {
  const html = baseLayout('Investment Matured', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;line-height:1;">🎊</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;text-align:center;">Your Investment Has Matured!</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Congratulations ${firstName}! Your full payout is now in your wallet.</p>
    <p style="text-align:center;margin:0 0 28px;">${badge('MATURED', 'green')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Maturity Summary</td></tr>
      ${infoRow('Original Principal', formatNaira(principalAmount))}
      ${infoRow('Total Interest Earned', formatNaira(interestEarned))}
      ${infoRow('Total Payout Credited', formatNaira(totalPayout))}
    </table>

    <div style="background:#0a2818;border:1px solid #10b981;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#6ee7b7;line-height:1.6;">
        Your payout has been credited to your wallet. You can withdraw it or reinvest to continue growing your wealth at <strong>25% APR</strong>.
      </p>
    </div>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/wallet`, 'Access My Wallet')}
    </div>
  `);
  await send(userEmail, `Investment Matured — ${formatNaira(totalPayout)} Credited to Your Wallet`, html);
}

/**
 * Withdrawal request submitted — sent when user creates a withdrawal request.
 */
export async function sendUserWithdrawalPending(
  userEmail: string,
  firstName: string,
  amount: number,
  fee: number,
  payoutAmount: number,
  bankName: string,
  accountNumber: string
): Promise<void> {
  const html = baseLayout('Withdrawal Request Received', `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;">Withdrawal Request Received</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Hi ${firstName}, your withdrawal request is pending compliance review.</p>
    <p style="margin:0 0 28px;">${badge('PENDING REVIEW', 'amber')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Withdrawal Details</td></tr>
      ${infoRow('Requested Amount', formatNaira(amount))}
      ${infoRow('Processing Fee (1.9%)', formatNaira(fee))}
      ${infoRow('Net Payout Amount', formatNaira(payoutAmount))}
      ${infoRow('Destination Bank', bankName)}
      ${infoRow('Account Number', `****${accountNumber.slice(-4)}`)}
    </table>

    <div style="background:#1c1507;border:1px solid #f59e0b;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#fcd34d;line-height:1.6;">
        ⏳ <strong>Processing Time:</strong> Withdrawals are manually reviewed and processed within 24 hours. You will receive a confirmation email once approved.
      </p>
    </div>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/wallet`, 'Track My Request')}
    </div>
  `);
  await send(userEmail, 'Withdrawal Request Submitted — AZEAD', html);
}

/**
 * Withdrawal approved — sent when admin approves the withdrawal.
 */
export async function sendUserWithdrawalApproved(
  userEmail: string,
  firstName: string,
  amount: number,
  payoutAmount: number,
  bankName: string
): Promise<void> {
  const html = baseLayout('Withdrawal Approved', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;line-height:1;">✅</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;text-align:center;">Withdrawal Approved</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Hi ${firstName}, your withdrawal has been approved and is being disbursed.</p>
    <p style="text-align:center;margin:0 0 28px;">${badge('APPROVED', 'green')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Payment Details</td></tr>
      ${infoRow('Approved Amount', formatNaira(amount))}
      ${infoRow('Net Payout', formatNaira(payoutAmount))}
      ${infoRow('Destination Bank', bankName)}
    </table>

    <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px;">
      Your funds are being processed. Typically reflect in your bank account within a few hours depending on your bank's processing time.
    </p>
    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/wallet`, 'View Wallet')}
    </div>
  `);
  await send(userEmail, `Withdrawal of ${formatNaira(payoutAmount)} Approved — AZEAD`, html);
}

/**
 * Withdrawal rejected — sent when admin rejects the withdrawal.
 */
export async function sendUserWithdrawalRejected(
  userEmail: string,
  firstName: string,
  amount: number,
  reason: string
): Promise<void> {
  const html = baseLayout('Withdrawal Rejected', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;line-height:1;">⛔</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;text-align:center;">Withdrawal Request Rejected</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Hi ${firstName}, your withdrawal request could not be processed at this time.</p>
    <p style="text-align:center;margin:0 0 28px;">${badge('REJECTED', 'red')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Request Details</td></tr>
      ${infoRow('Requested Amount', formatNaira(amount))}
      ${infoRow('Rejection Reason', reason || 'Audit check failed')}
    </table>

    <div style="background:#1a0505;border:1px solid #ef4444;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">
        Your funds have been refunded to your AZEAD wallet. Please contact our support team if you believe this is an error, or submit a new request with correct banking details.
      </p>
    </div>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/wallet`, 'Return to Wallet')}
    </div>
  `);
  await send(userEmail, 'Withdrawal Request Rejected — AZEAD', html);
}

/**
 * Early withdrawal penalty initiated — sent when user requests early termination.
 */
export async function sendUserEarlyWithdrawalInitiated(
  userEmail: string,
  firstName: string,
  principalAmount: number,
  penaltyAmount: number,
  netPayout: number
): Promise<void> {
  const html = baseLayout('Early Termination Initiated', `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;">Early Termination Request Received</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Hi ${firstName}, your early termination request has been logged.</p>
    <p style="margin:0 0 28px;">${badge('EARLY TERMINATION PENDING', 'amber')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Termination Summary</td></tr>
      ${infoRow('Investment Principal', formatNaira(principalAmount))}
      ${infoRow('Early Exit Penalty (10%)', `−${formatNaira(penaltyAmount)}`)}
      ${infoRow('Estimated Net Payout', formatNaira(netPayout))}
    </table>

    <div style="background:#1c1507;border:1px solid #f59e0b;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#fcd34d;line-height:1.6;">
        ⏳ <strong>30-Day Processing Period:</strong> As per our terms, early terminations are subject to a 10% principal penalty and a 30-day processing wait before payout is disbursed.
      </p>
    </div>

    <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0 0 16px;">
      Contact support@azead.com if you wish to discuss your options or reconsider the request before the 30-day window closes.
    </p>
    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/investments`, 'View My Investments')}
    </div>
  `);
  await send(userEmail, 'Early Termination Request Received — AZEAD', html);
}

/**
 * KYC approved — sent when admin approves KYC documents.
 */
export async function sendUserKYCApproved(userEmail: string, firstName: string): Promise<void> {
  const html = baseLayout('KYC Verification Approved', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;line-height:1;">🏅</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;text-align:center;">Identity Verified</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Hi ${firstName}, your identity verification has been approved.</p>
    <p style="text-align:center;margin:0 0 28px;">${badge('KYC VERIFIED', 'green')}</p>
    <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 24px;">
      Your account is now fully verified. You have full access to all AZEAD platform features including higher withdrawal limits.
    </p>
    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard`, 'Go to Dashboard')}
    </div>
  `);
  await send(userEmail, 'KYC Verification Approved — AZEAD', html);
}

/**
 * KYC rejected — sent when admin rejects KYC documents.
 */
export async function sendUserKYCRejected(userEmail: string, firstName: string, reason: string): Promise<void> {
  const html = baseLayout('KYC Verification Rejected', `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f8fafc;">Identity Verification Rejected</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Hi ${firstName}, we were unable to verify your identity documents.</p>
    <p style="margin:0 0 28px;">${badge('KYC REJECTED', 'red')}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Review Outcome</td></tr>
      ${infoRow('Reason', reason || 'Invalid or unclear documents')}
    </table>

    <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 24px;">
      Please re-submit your KYC documents with clearer images. Ensure the document is valid, unexpired, and all details are clearly visible.
    </p>
    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/dashboard/profile`, 'Resubmit KYC Documents')}
    </div>
  `);
  await send(userEmail, 'KYC Verification Rejected — AZEAD', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EMAILS (to azeedbestway@gmail.com)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Admin notification: new user signed up and verified their email.
 */
export async function sendAdminNewUserSignup(
  userEmail: string,
  firstName: string,
  lastName: string,
  userId: string
): Promise<void> {
  const html = baseLayout('[Admin] New User Registration', `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f8fafc;">🆕 New User Registration</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">A new user has verified their email and activated their AZEAD account.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">User Details</td></tr>
      ${infoRow('Full Name', `${firstName} ${lastName}`)}
      ${infoRow('Email Address', userEmail)}
      ${infoRow('User ID', userId.substring(0, 8) + '...')}
      ${infoRow('Status', 'Email Verified ✅')}
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/admin/users`, 'View in Admin Panel')}
    </div>
  `);
  await send(ADMIN_EMAIL, `[AZEAD Admin] New User: ${firstName} ${lastName}`, html);
}

/**
 * Admin notification: new deposit confirmed on a user's account.
 */
export async function sendAdminNewDeposit(
  userEmail: string,
  userName: string,
  amount: number,
  reference: string,
  userId: string
): Promise<void> {
  const html = baseLayout('[Admin] New Deposit Confirmed', `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f8fafc;">💰 New Deposit Confirmed</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">A deposit has been successfully credited on the platform.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Deposit Details</td></tr>
      ${infoRow('User', userName)}
      ${infoRow('Email', userEmail)}
      ${infoRow('User ID', userId.substring(0, 8) + '...')}
      ${infoRow('Amount', formatNaira(amount))}
      ${infoRow('Reference', reference)}
      ${infoRow('Status', 'Success ✅')}
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/admin/transactions`, 'View in Admin Panel')}
    </div>
  `);
  await send(ADMIN_EMAIL, `[AZEAD Admin] New Deposit: ${formatNaira(amount)} from ${userName}`, html);
}

/**
 * Admin notification: user submitted a withdrawal request.
 */
export async function sendAdminWithdrawalRequest(
  userEmail: string,
  userName: string,
  amount: number,
  payoutAmount: number,
  bankName: string,
  accountNumber: string,
  accountName: string,
  withdrawalId: string
): Promise<void> {
  const html = baseLayout('[Admin] Withdrawal Request', `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f8fafc;">🏦 Withdrawal Request Submitted</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">A user has submitted a withdrawal request requiring your review.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Withdrawal Details</td></tr>
      ${infoRow('User', userName)}
      ${infoRow('Email', userEmail)}
      ${infoRow('Gross Amount', formatNaira(amount))}
      ${infoRow('Net Payout (after 1.9% fee)', formatNaira(payoutAmount))}
      ${infoRow('Bank Name', bankName)}
      ${infoRow('Account Number', accountNumber)}
      ${infoRow('Account Name', accountName)}
      ${infoRow('Withdrawal ID', withdrawalId.substring(0, 8) + '...')}
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/admin/transactions`, 'Process in Admin Panel')}
    </div>
  `);
  await send(ADMIN_EMAIL, `[AZEAD Admin] Withdrawal Request: ${formatNaira(amount)} by ${userName}`, html);
}

/**
 * Admin notification: user submitted an early termination request.
 */
export async function sendAdminEarlyWithdrawalRequest(
  userEmail: string,
  userName: string,
  principalAmount: number,
  penaltyAmount: number,
  investmentId: string
): Promise<void> {
  const html = baseLayout('[Admin] Early Termination Request', `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f8fafc;">⚠️ Early Termination Request</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">A user has requested early termination of an active investment.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Termination Details</td></tr>
      ${infoRow('User', userName)}
      ${infoRow('Email', userEmail)}
      ${infoRow('Investment Principal', formatNaira(principalAmount))}
      ${infoRow('10% Penalty Applied', formatNaira(penaltyAmount))}
      ${infoRow('Investment ID', investmentId.substring(0, 8) + '...')}
      ${infoRow('30-Day Hold', 'In Effect')}
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/admin/investments`, 'View in Admin Panel')}
    </div>
  `);
  await send(ADMIN_EMAIL, `[AZEAD Admin] Early Termination: ${formatNaira(principalAmount)} by ${userName}`, html);
}

/**
 * Admin notification: new investment purchased by a user.
 */
export async function sendAdminNewInvestment(
  userEmail: string,
  userName: string,
  amount: number,
  durationYears: number,
  investmentId: string
): Promise<void> {
  const html = baseLayout('[Admin] New Investment Created', `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f8fafc;">📊 New Investment Created</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">A user has locked in a new investment on the platform.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Investment Details</td></tr>
      ${infoRow('User', userName)}
      ${infoRow('Email', userEmail)}
      ${infoRow('Principal Amount', formatNaira(amount))}
      ${infoRow('Duration', `${durationYears} Year${durationYears > 1 ? 's' : ''}`)}
      ${infoRow('Interest Rate', '25.00% APR')}
      ${infoRow('Investment ID', investmentId.substring(0, 8) + '...')}
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/admin/investments`, 'View in Admin Panel')}
    </div>
  `);
  await send(ADMIN_EMAIL, `[AZEAD Admin] New Investment: ${formatNaira(amount)} by ${userName}`, html);
}

/**
 * Admin notification: KYC document submitted by a user.
 */
export async function sendAdminKYCSubmission(
  userEmail: string,
  userName: string,
  userId: string
): Promise<void> {
  const html = baseLayout('[Admin] KYC Document Submitted', `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f8fafc;">🪪 KYC Submission Pending Review</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">A user has submitted their identity documents for KYC verification.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
      <tr><td colspan="2" style="padding:16px 16px 10px;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">User Details</td></tr>
      ${infoRow('User', userName)}
      ${infoRow('Email', userEmail)}
      ${infoRow('User ID', userId.substring(0, 8) + '...')}
    </table>

    <div style="text-align:center;">
      ${ctaButton(`${APP_URL}/admin/compliance`, 'Review KYC Documents')}
    </div>
  `);
  await send(ADMIN_EMAIL, `[AZEAD Admin] KYC Submission from ${userName}`, html);
}
