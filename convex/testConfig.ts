const isTestEnv =
  typeof process !== "undefined" && process.env && process.env.IS_TEST_ENV === "true";
export const isTest = isTestEnv;
