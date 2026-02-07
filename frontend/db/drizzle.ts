import { drizzle } from "drizzle-orm/neon-http";

// Remove dotenv import and usage - environment variables should be injected at runtime                                                            │  
// The DATABASE_URL should be provided via environment variables in deployment

export const db = drizzle(process.env.DATABASE_URL!);
