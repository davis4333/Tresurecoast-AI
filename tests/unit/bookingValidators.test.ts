import { describe, it, expect } from "vitest";
import {
  validateName,
  validatePhone,
  validateEmail,
  validateUrl,
  looksLikeServiceSelection,
} from "@/lib/booking/validators";

describe("validateName", () => {
  describe("valid names", () => {
    it("accepts simple name", () => {
      const result = validateName("John Smith");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("John Smith");
    });

    it("accepts name with apostrophe", () => {
      const result = validateName("O'Brien");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("O'Brien");
    });

    it("accepts hyphenated name", () => {
      const result = validateName("Jean-Luc Picard");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("Jean-Luc Picard");
    });

    it("accepts name with period", () => {
      const result = validateName("Dr. Smith Jr.");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("Dr. Smith Jr.");
    });

    it("accepts international names (Spanish)", () => {
      const result = validateName("María García");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("María García");
    });

    it("accepts international names (Chinese)", () => {
      const result = validateName("李明");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("李明");
    });

    it("accepts international names (Arabic)", () => {
      const result = validateName("محمد");
      expect(result.isValid).toBe(true);
    });

    it("accepts international names (Cyrillic)", () => {
      const result = validateName("Иван Петров");
      expect(result.isValid).toBe(true);
    });

    it("trims whitespace", () => {
      const result = validateName("  John Smith  ");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("John Smith");
    });

    it("collapses multiple spaces", () => {
      const result = validateName("John    Smith");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("John Smith");
    });

    it("normalizes unicode", () => {
      const result = validateName("J\u006Fhn");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("John");
    });
  });

  describe("invalid names", () => {
    it("rejects empty string", () => {
      const result = validateName("");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_REQUIRED");
    });

    it("rejects whitespace only", () => {
      const result = validateName("   ");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_REQUIRED");
    });

    it("rejects too short name", () => {
      const result = validateName("J");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_TOO_SHORT");
    });

    it("rejects too long name", () => {
      const result = validateName("A".repeat(101));
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_TOO_LONG");
    });

    it("rejects name without letters", () => {
      const result = validateName("123");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_NO_LETTERS");
    });

    it("rejects XSS attempt", () => {
      const result = validateName("<script>alert('xss')</script>");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_INVALID_CHARACTERS");
    });

    it("rejects name with numbers", () => {
      const result = validateName("John123");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_INVALID_CHARACTERS");
    });

    it("rejects consecutive special characters", () => {
      const result = validateName("O''Brien");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_INVALID_SEQUENCE");
    });

    it("rejects consecutive hyphens", () => {
      const result = validateName("Jean--Luc");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("NAME_INVALID_SEQUENCE");
    });
  });

  describe("sanitization logging", () => {
    it("logs sanitization actions", () => {
      const result = validateName("  John  Smith  ");
      expect(result.isValid).toBe(true);
      expect(result.sanitizationLog).toBeDefined();
      expect(result.sanitizationLog).toContain("whitespace_trim");
      expect(result.sanitizationLog).toContain("whitespace_collapse");
    });
  });
});

describe("validatePhone", () => {
  describe("valid phone numbers", () => {
    it("accepts 10-digit US number", () => {
      const result = validatePhone("1234567890");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("1234567890");
    });

    it("accepts formatted US number", () => {
      const result = validatePhone("(123) 456-7890");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("1234567890");
    });

    it("accepts international number with +", () => {
      const result = validatePhone("+1 234 567 8901");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("+12345678901");
    });

    it("accepts UK number", () => {
      const result = validatePhone("+44 20 7946 0958");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("+442079460958");
    });

    it("accepts number with dots", () => {
      const result = validatePhone("123.456.7890");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("1234567890");
    });

    it("accepts 15-digit international number", () => {
      const result = validatePhone("+123456789012345");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("+123456789012345");
    });
  });

  describe("invalid phone numbers", () => {
    it("rejects empty string", () => {
      const result = validatePhone("");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("PHONE_REQUIRED");
    });

    it("rejects too short number", () => {
      const result = validatePhone("123");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("PHONE_TOO_SHORT");
    });

    it("rejects too long number", () => {
      const result = validatePhone("1234567890123456");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("PHONE_TOO_LONG");
    });

    it("rejects letters", () => {
      const result = validatePhone("abc-def-ghij");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("PHONE_INVALID_CHARACTERS");
    });

    it("rejects javascript injection", () => {
      const result = validatePhone("javascript:void(0)");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("PHONE_INVALID_CHARACTERS");
    });
  });
});

describe("validateEmail", () => {
  describe("valid emails", () => {
    it("accepts simple email", () => {
      const result = validateEmail("john@example.com");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("john@example.com");
    });

    it("normalizes to lowercase", () => {
      const result = validateEmail("JOHN@EXAMPLE.COM");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("john@example.com");
    });

    it("accepts email with plus", () => {
      const result = validateEmail("user+tag@domain.co.uk");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("user+tag@domain.co.uk");
    });

    it("accepts email with dots in local part", () => {
      const result = validateEmail("john.smith@example.com");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("john.smith@example.com");
    });

    it("accepts subdomain email", () => {
      const result = validateEmail("user@mail.example.com");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("user@mail.example.com");
    });
  });

  describe("invalid emails", () => {
    it("rejects empty string", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_REQUIRED");
    });

    it("rejects missing @", () => {
      const result = validateEmail("notanemail");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_MISSING_AT");
    });

    it("rejects multiple @", () => {
      const result = validateEmail("user@@example.com");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_MULTIPLE_AT");
    });

    it("rejects missing local part", () => {
      const result = validateEmail("@example.com");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_MISSING_LOCAL_PART");
    });

    it("rejects missing domain", () => {
      const result = validateEmail("user@");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_MISSING_DOMAIN");
    });

    it("rejects domain without TLD", () => {
      const result = validateEmail("user@localhost");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_INVALID_DOMAIN");
    });

    it("rejects domain starting with dot", () => {
      const result = validateEmail("user@.example.com");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_DOMAIN_FORMAT_INVALID");
    });

    it("rejects domain ending with hyphen", () => {
      const result = validateEmail("user@example-.com");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_FORMAT_INVALID");
    });

    it("rejects too long email", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("EMAIL_TOO_LONG");
    });
  });
});

describe("validateUrl", () => {
  describe("valid URLs", () => {
    it("accepts HTTPS URL", () => {
      const result = validateUrl("https://example.com");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("https://example.com/");
    });

    it("accepts HTTPS URL with path", () => {
      const result = validateUrl("https://example.com/path/to/resource");
      expect(result.isValid).toBe(true);
    });

    it("accepts HTTP when allowed", () => {
      const result = validateUrl("http://localhost:3000", { allowHttp: true });
      expect(result.isValid).toBe(true);
    });

    it("accepts URL from allowed domain", () => {
      const result = validateUrl("https://calendly.com/book", {
        allowedDomains: ["calendly.com", "square.com"],
      });
      expect(result.isValid).toBe(true);
    });

    it("accepts subdomain of allowed domain", () => {
      const result = validateUrl("https://app.calendly.com/book", {
        allowedDomains: ["calendly.com"],
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("invalid URLs", () => {
    it("rejects empty string", () => {
      const result = validateUrl("");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_REQUIRED");
    });

    it("rejects invalid format", () => {
      const result = validateUrl("not a url");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_INVALID_FORMAT");
    });

    it("rejects javascript: protocol", () => {
      const result = validateUrl("javascript:alert('xss')");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_PROTOCOL_BLOCKED");
    });

    it("rejects data: protocol", () => {
      const result = validateUrl("data:text/html,<script>alert(1)</script>");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_PROTOCOL_BLOCKED");
    });

    it("rejects file: protocol", () => {
      const result = validateUrl("file:///etc/passwd");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_PROTOCOL_BLOCKED");
    });

    it("rejects HTTP when not allowed", () => {
      const result = validateUrl("http://example.com");
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_MUST_BE_HTTPS");
    });

    it("rejects URL from non-allowed domain", () => {
      const result = validateUrl("https://evil.com/phish", {
        allowedDomains: ["calendly.com", "square.com"],
      });
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("URL_DOMAIN_NOT_ALLOWED");
    });
  });
});

describe("looksLikeServiceSelection", () => {
  it("returns true for pure number", () => {
    expect(looksLikeServiceSelection("123")).toBe(true);
  });

  it("returns true for short service name", () => {
    expect(looksLikeServiceSelection("haircut")).toBe(true);
  });

  it("returns true for multi-word service name", () => {
    expect(looksLikeServiceSelection("beard trim")).toBe(true);
  });

  it("returns false for long sentence", () => {
    expect(looksLikeServiceSelection("I really want to book a haircut appointment please")).toBe(false);
  });

  it("returns false for long text", () => {
    expect(
      looksLikeServiceSelection("This is a very long message that is clearly not a service selection")
    ).toBe(false);
  });

  it("returns false for text with punctuation", () => {
    expect(looksLikeServiceSelection("Hello!")).toBe(false);
  });

  it("returns true for 5 word phrase without punctuation", () => {
    expect(looksLikeServiceSelection("deluxe full body massage")).toBe(true);
  });
});
