import { describe, expect, it } from "vitest";
import { decrypt, decryptIfNeeded, encrypt, encryptIfNeeded, isEncrypted } from "./encryption";

describe("Encryption", () => {
  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt a simple string", async () => {
      const plaintext = "Hello, World!";
      const encrypted = await encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt an empty string", async () => {
      const plaintext = "";
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt a long string", async () => {
      const plaintext = "x".repeat(10000);
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt special characters", async () => {
      const plaintext = "🎉 Hello! こんにちは @#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt JSON", async () => {
      const data = { token: "abc123", secret: "xyz789" };
      const plaintext = JSON.stringify(data);
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(JSON.parse(decrypted)).toEqual(data);
    });

    it("should produce different ciphertext for same plaintext (random IV)", async () => {
      const plaintext = "Same message";
      const encrypted1 = await encrypt(plaintext);
      const encrypted2 = await encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to the same plaintext
      expect(await decrypt(encrypted1)).toBe(plaintext);
      expect(await decrypt(encrypted2)).toBe(plaintext);
    });

    it("should produce base64 output", async () => {
      const plaintext = "Test";
      const encrypted = await encrypt(plaintext);

      // Valid base64 pattern
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe("isEncrypted", () => {
    it("should return true for encrypted values", async () => {
      const encrypted = await encrypt("test token");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for short strings", () => {
      expect(isEncrypted("short")).toBe(false);
      expect(isEncrypted("gho_abc123")).toBe(false);
    });

    it("should return false for invalid base64", () => {
      expect(isEncrypted("not-valid-base64!!!")).toBe(false);
    });

    it("should return false for plaintext OAuth tokens", () => {
      // GitHub token format
      expect(isEncrypted("gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(false);
      // Google token format (short)
      expect(isEncrypted("ya29.a0AfH6SMB")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isEncrypted("")).toBe(false);
      expect(isEncrypted("a")).toBe(false);
      // Exactly at threshold
      expect(isEncrypted("a".repeat(39))).toBe(false);
    });
  });

  describe("encryptIfNeeded", () => {
    it("should encrypt plaintext", async () => {
      const plaintext = "my-oauth-token";
      const result = await encryptIfNeeded(plaintext);

      expect(result).not.toBe(plaintext);
      expect(isEncrypted(result)).toBe(true);
    });

    it("should not re-encrypt already encrypted values", async () => {
      const plaintext = "my-oauth-token";
      const encrypted = await encrypt(plaintext);
      const result = await encryptIfNeeded(encrypted);

      expect(result).toBe(encrypted);
    });

    it("should be idempotent", async () => {
      const plaintext = "token123";

      const encrypted1 = await encryptIfNeeded(plaintext);
      const encrypted2 = await encryptIfNeeded(encrypted1);
      const encrypted3 = await encryptIfNeeded(encrypted2);

      // Should only encrypt once
      expect(encrypted2).toBe(encrypted1);
      expect(encrypted3).toBe(encrypted1);

      // Should still decrypt correctly
      expect(await decrypt(encrypted3)).toBe(plaintext);
    });
  });

  describe("decryptIfNeeded", () => {
    it("should decrypt encrypted values", async () => {
      const plaintext = "my-secret-token";
      const encrypted = await encrypt(plaintext);
      const result = await decryptIfNeeded(encrypted);

      expect(result).toBe(plaintext);
    });

    it("should return plaintext values unchanged", async () => {
      const plaintext = "short-token";
      const result = await decryptIfNeeded(plaintext);

      expect(result).toBe(plaintext);
    });

    it("should handle OAuth token formats gracefully", async () => {
      const githubToken = "gho_abc123def456";
      const result = await decryptIfNeeded(githubToken);

      expect(result).toBe(githubToken);
    });

    it("should be idempotent", async () => {
      const plaintext = "my-token";
      const encrypted = await encrypt(plaintext);

      const decrypted1 = await decryptIfNeeded(encrypted);
      const decrypted2 = await decryptIfNeeded(decrypted1);
      const decrypted3 = await decryptIfNeeded(decrypted2);

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
      expect(decrypted3).toBe(plaintext);
    });
  });

  describe("round-trip encryption", () => {
    it("should handle encrypt -> encryptIfNeeded -> decryptIfNeeded", async () => {
      const original = "sensitive-data";

      const step1 = await encrypt(original);
      const step2 = await encryptIfNeeded(step1); // Should not re-encrypt
      const step3 = await decryptIfNeeded(step2);

      expect(step2).toBe(step1);
      expect(step3).toBe(original);
    });

    it("should handle multiple round trips", async () => {
      const original = "test-token-123";

      // First round trip
      const encrypted = await encrypt(original);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(original);

      // Second round trip with same value
      const encrypted2 = await encrypt(original);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted2).toBe(original);

      // Different ciphertexts but same plaintext
      expect(encrypted).not.toBe(encrypted2);
    });
  });
});
