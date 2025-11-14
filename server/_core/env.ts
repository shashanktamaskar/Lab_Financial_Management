// Environment variables configuration
export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/lab_finance",
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
} as const;
