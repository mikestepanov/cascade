/* eslint-disable no-var */

declare global {
  // Allow global.IS_TEST_ENV
  var IS_TEST_ENV: boolean | undefined;
}

declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        IS_TEST_ENV?: string;
      }
    }
  }
}

export {};
