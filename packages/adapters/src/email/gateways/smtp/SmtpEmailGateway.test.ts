import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import {
  SmtpEmailGateway,
  EmailSendError,
} from "./SmtpEmailGateway";
import {
  validateSmtpEmailConfig,
  EmailConfigurationError,
} from "./SmtpEmailConfig";

describe("[UNIT] SmtpEmailGateway", () => {
  const validConfig = {
    host: "mailpit",
    port: 1025,
    user: "",
    pass: "",
    from: "test@example.com",
    secure: false,
  };

  describe("sendOtp", () => {
    it("should return Effect for OTP email", async () => {
      // Arrange
      const config = await Effect.runPromise(
        validateSmtpEmailConfig(validConfig),
      );
      const gateway = new SmtpEmailGateway(config);

      const input = {
        email: "user@example.com",
        otp: "123456",
        type: "email-verification" as const,
      };

      // Act
      const effect = gateway.sendOtp(input);

      // Assert
      expect(effect).toBeDefined();
      // The effect should be an Effect type
      expect(typeof effect).toBe("object");
    });

    it("should handle all OTP types", async () => {
      // Arrange
      const config = await Effect.runPromise(
        validateSmtpEmailConfig(validConfig),
      );
      const gateway = new SmtpEmailGateway(config);

      const types = [
        "email-verification",
        "sign-in",
        "forget-password",
        "change-email",
      ] as const;

      for (const type of types) {
        const input = {
          email: "user@example.com",
          otp: "123456",
          type,
        };

        // Act
        const effect = gateway.sendOtp(input);

        // Assert
        expect(effect).toBeDefined();
      }
    });
  });

  describe("sendEmail", () => {
    it("should return Effect for generic email", async () => {
      // Arrange
      const config = await Effect.runPromise(
        validateSmtpEmailConfig(validConfig),
      );
      const gateway = new SmtpEmailGateway(config);

      // Act
      const effect = gateway.sendEmail(
        "user@example.com",
        "Test Subject",
        "<p>Test body</p>",
      );

      // Assert
      expect(effect).toBeDefined();
    });
  });

  describe("configuration", () => {
    it("should create gateway with valid config", async () => {
      // Arrange & Act
      const config = await Effect.runPromise(
        validateSmtpEmailConfig(validConfig),
      );
      const gateway = new SmtpEmailGateway(config);

      // Assert
      expect(gateway).toBeInstanceOf(SmtpEmailGateway);
    });
  });
});

describe("[UNIT] SmtpEmailConfig", () => {
  describe("validateSmtpEmailConfig", () => {
    it("should validate and return config when valid", async () => {
      // Arrange
      const input = {
        host: "smtp.gmail.com",
        port: 587,
        user: "user@gmail.com",
        pass: "password",
        from: "noreply@example.com",
        secure: true,
      };

      // Act
      const effect = validateSmtpEmailConfig(input);
      const result = await Effect.runPromise(effect);

      // Assert
      expect(result.host).toBe("smtp.gmail.com");
      expect(result.port).toBe(587);
      expect(result.from).toBe("noreply@example.com");
      expect(result.secure).toBe(true);
    });

    it("should fail when host is empty", async () => {
      // Arrange
      const input = {
        host: "",
        port: 587,
        user: "user",
        pass: "pass",
        from: "test@example.com",
        secure: false,
      };

      // Act
      const effect = validateSmtpEmailConfig(input);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(EmailConfigurationError);
        expect(either.left.field).toBe("smtp.host");
      }
    });

    it("should fail when port is invalid", async () => {
      // Arrange
      const input = {
        host: "smtp.gmail.com",
        port: 70000, // Invalid port
        user: "user",
        pass: "pass",
        from: "test@example.com",
        secure: false,
      };

      // Act
      const effect = validateSmtpEmailConfig(input);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(EmailConfigurationError);
        expect(either.left.field).toBe("smtp.port");
      }
    });

    it("should fail when from email is invalid", async () => {
      // Arrange
      const input = {
        host: "smtp.gmail.com",
        port: 587,
        user: "user",
        pass: "pass",
        from: "invalid-email",
        secure: false,
      };

      // Act
      const effect = validateSmtpEmailConfig(input);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(EmailConfigurationError);
        expect(either.left.field).toBe("smtp.from");
      }
    });

    it("should fail when from email is empty", async () => {
      // Arrange
      const input = {
        host: "smtp.gmail.com",
        port: 587,
        user: "user",
        pass: "pass",
        from: "",
        secure: false,
      };

      // Act
      const effect = validateSmtpEmailConfig(input);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(EmailConfigurationError);
      }
    });
  });
});
