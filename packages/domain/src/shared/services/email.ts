import type { Effect } from "effect";
import type { IPortError } from "../errors/ports";

/**
 * Email OTP types for verification flows
 */
export type EmailOtpType =
  | "email-verification"
  | "sign-in"
  | "forget-password"
  | "change-email";

/**
 * Input for sending an email with OTP
 */
export interface SendEmailOtpInput {
  /** Recipient email address */
  email: string;
  /** The one-time password code */
  otp: string;
  /** Type of OTP being sent */
  type: EmailOtpType;
}

/**
 * Interface for email service operations
 *
 * This interface defines the contract for sending emails, particularly
 * OTP (one-time password) emails for authentication flows.
 *
 * Implemented by SMTP gateway in the adapters layer.
 */
export interface IEmailPort {
  /**
   * Send an OTP email to the specified address
   *
   * @param input - Email OTP input containing recipient, OTP code, and type
   * @returns Effect that succeeds when email is sent, fails with IPortError otherwise
   */
  sendOtp(input: SendEmailOtpInput): Effect.Effect<void, IPortError, never>;

  /**
   * Send a generic email
   *
   * @param to - Recipient email address
   * @param subject - Email subject line
   * @param body - Email body content (HTML or plain text)
   * @returns Effect that succeeds when email is sent, fails with IPortError otherwise
   */
  sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Effect.Effect<void, IPortError, never>;
}
