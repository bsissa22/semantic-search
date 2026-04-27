import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #F2EFEA; border-radius: 16px;">
      <h1 style="font-size: 28px; font-weight: 300; color: #2C2824; margin-bottom: 8px;">Partme</h1>
      <p style="font-size: 14px; color: #2C2824; opacity: 0.6; margin-bottom: 32px;">P2P Live Streaming</p>
      <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
        <p style="font-size: 15px; color: #2C2824; margin-bottom: 24px;">Your verification code is:</p>
        <div style="font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #C48C56; margin-bottom: 24px;">${code}</div>
        <p style="font-size: 13px; color: #2C2824; opacity: 0.5;">This code expires in 10 minutes.</p>
      </div>
      <p style="font-size: 12px; color: #2C2824; opacity: 0.4; margin-top: 24px; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Partme" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Your Partme Verification Code",
    html,
  });
}
