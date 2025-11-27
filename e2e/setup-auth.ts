/**
 * Script to set up authentication state for E2E tests
 * Run with: pnpm e2e:setup-auth
 */
import { setupAuthState } from "./fixtures";

setupAuthState().catch(console.error);
