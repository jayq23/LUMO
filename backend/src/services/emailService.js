import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Lumo <onboarding@resend.dev>';
 
let resendClient = null;
const getClient = () => {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured on the server');
  }
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
};

export const sendPasswordResetEmail = async (toEmail, rawToken) => {
  const resend = getClient();
  const resetUrl = `${FRONTEND_URL}/reset-password/${rawToken}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Reset your Lumo password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #18160f; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #5e6278; line-height: 1.5;">
          We received a request to reset your Lumo password. Click the button below
          to choose a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin-top: 20px; padding: 12px 28px;
                  background: #f0a500; color: #0d0f14; text-decoration: none;
                  border-radius: 10px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #8a8070; font-size: 13px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email —
          your password will not be changed.
        </p>
        <p style="color: #8a8070; font-size: 12px; word-break: break-all; margin-top: 16px;">
          Or copy this link: ${resetUrl}
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send reset email');
  }
};