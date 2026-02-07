// API route handler for Better Auth
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"

// Use nodejs runtime for full server capabilities
export const runtime = "nodejs"

export const { GET, POST } = toNextJsHandler(auth)

