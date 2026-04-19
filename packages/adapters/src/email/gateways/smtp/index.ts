// SMTP Email Gateway exports
export {
  SmtpEmailGateway,
  EmailSendError,
} from "./SmtpEmailGateway";

export {
  type SmtpEmailConfig,
  defaultSmtpEmailConfig,
  validateSmtpEmailConfig,
  loadSmtpConfigFromEnv,
  EmailConfigurationError,
} from "./SmtpEmailConfig";
