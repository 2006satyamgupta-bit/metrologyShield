import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  
  // AI Provider (OpenAI, Gemini, Azure OpenAI, etc.)
  AI_PROVIDER: z.enum(["openai", "gemini", "anthropic", "mock"]).default("openai"),
  AI_API_KEY: z.string().optional().or(z.literal("")),
  AI_MODEL: z.string().default("gpt-4o-mini"),

  // OCR Provider (Tesseract local engine, Google Cloud Vision, Azure, OpenAI Vision)
  OCR_PROVIDER: z.enum(["tesseract", "google_vision", "openai_vision"]).default("tesseract"),
  OCR_API_KEY: z.string().optional().or(z.literal("")),

  // App Settings
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  STORAGE_DRIVER: z.enum(["supabase", "local"]).default("local"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER || "openai",
    AI_API_KEY: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini",
    OCR_PROVIDER: process.env.OCR_PROVIDER || "tesseract",
    OCR_API_KEY: process.env.OCR_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NODE_ENV: process.env.NODE_ENV || "development",
    STORAGE_DRIVER: process.env.STORAGE_DRIVER || (process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase" : "local"),
  });

  if (!parsed.success) {
    console.warn("⚠️ Environment config warnings:", parsed.error.format());
    // Provide sensible defaults so app does not crash
    return {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      AI_PROVIDER: "openai",
      AI_API_KEY: "",
      AI_MODEL: "gpt-4o-mini",
      OCR_PROVIDER: "tesseract",
      OCR_API_KEY: "",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "development",
      STORAGE_DRIVER: "local",
    };
  }

  return parsed.data;
}

export const env = parseEnv();
