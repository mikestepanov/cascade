import Resend from "@auth/core/providers/resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendAPI } from "resend";
import { getResendApiKey, getResendFromEmail } from "./lib/env";

export const ResendOTPVerification = Resend({
  id: "resend-otp-verification",
  apiKey: getResendApiKey(),
  // biome-ignore lint/suspicious/useAwait: Required by @auth/core provider interface
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };

    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const from = getResendFromEmail();
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Verify your email",
      text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, you can safely ignore this email.`,
    });

    if (error) {
      throw new Error("Could not send verification email");
    }
  },
});
