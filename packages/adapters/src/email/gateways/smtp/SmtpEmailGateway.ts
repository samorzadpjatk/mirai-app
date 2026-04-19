import { createTransport, type Transporter } from "nodemailer";
import { Effect, Data } from "effect";
import type {
  IEmailPort,
  SendEmailOtpInput,
  IPortError,
} from "@mirai-app/domain";
import type { SmtpEmailConfig } from "./SmtpEmailConfig";

/**
 * Email sending error
 */
export class EmailSendError
  extends Data.TaggedError("EmailSendError")<{
    cause: unknown;
    recipient?: string;
  }>
  implements IPortError
{
  override readonly message: string;

  constructor(props: { cause: unknown; recipient?: string }) {
    super(props);
    this.message = props.recipient
      ? `Failed to send email to ${props.recipient}`
      : "Failed to send email";
  }
}

/**
 * SMTP Email Gateway
 *
 * Implements IEmailPort using nodemailer for SMTP email delivery.
 * Supports OTP emails for authentication flows and generic email sending.
 *
 * Configuration via environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (default: 1025 for Mailpit dev)
 * - SMTP_USER: SMTP username
 * - SMTP_PASS: SMTP password
 * - SMTP_FROM: Sender email address
 * - SMTP_SECURE: Use TLS/SSL (default: false for dev)
 */
export class SmtpEmailGateway implements IEmailPort {
  private readonly transporter: Transporter;
  private readonly config: SmtpEmailConfig;

  constructor(config: SmtpEmailConfig) {
    this.config = config;
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
    });
  }

  /**
   * Send an OTP email for authentication flows
   *
   * Generates an HTML email with the OTP code based on the type of authentication.
   * Supports: email-verification, sign-in, forget-password, change-email
   */
  sendOtp(input: SendEmailOtpInput) {
    const { email, otp, type } = input;
    const transporter = this.transporter;
    const from = this.config.from;

    return Effect.gen(function* () {
      const subject = getOtpSubject(type);
      const body = getOtpEmailTemplate(type, otp);

      yield* Effect.tryPromise({
        try: () =>
          transporter.sendMail({
            from,
            to: email,
            subject,
            html: body,
          }),
        catch: (error) => new EmailSendError({ cause: error, recipient: email }),
      });
    });
  }

  /**
   * Send a generic email
   *
   * Sends an email with the specified subject and body content.
   * Body can be HTML or plain text.
   */
  sendEmail(to: string, subject: string, body: string) {
    const transporter = this.transporter;
    const from = this.config.from;

    return Effect.tryPromise({
      try: () =>
        transporter.sendMail({
          from,
          to,
          subject,
          html: body,
        }),
      catch: (error) => new EmailSendError({ cause: error, recipient: to }),
    });
  }
}

/**
 * Get email subject based on OTP type
 */
function getOtpSubject(
  type: "email-verification" | "sign-in" | "forget-password" | "change-email",
): string {
  switch (type) {
    case "email-verification":
      return "Verify your email address";
    case "sign-in":
      return "Your sign-in code";
    case "forget-password":
      return "Password reset code";
    case "change-email":
      return "Verify your new email address";
    default:
      return "Verification code";
  }
}

/**
 * Generate HTML email template for OTP
 */
function getOtpEmailTemplate(
  type: "email-verification" | "sign-in" | "forget-password" | "change-email",
  otp: string,
): string {
  const heading = getOtpHeading(type);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; border-radius: 8px; padding: 30px; }
    .heading { font-size: 24px; font-weight: 600; margin-bottom: 20px; color: #1a1a1a; }
    .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #e0e0e0; }
    .message { margin-bottom: 20px; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="heading">${heading}</div>
    <div class="message">
      <p>Use the verification code below to complete your request:</p>
    </div>
    <div class="code">${otp}</div>
    <div class="message">
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from PJ App. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get heading text based on OTP type
 */
function getOtpHeading(
  type: "email-verification" | "sign-in" | "forget-password" | "change-email",
): string {
  switch (type) {
    case "email-verification":
      return "Verify Your Email";
    case "sign-in":
      return "Sign In Code";
    case "forget-password":
      return "Reset Your Password";
    case "change-email":
      return "Verify New Email";
    default:
      return "Verification Code";
  }
}
