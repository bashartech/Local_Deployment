import "better-auth"

declare module "better-auth" {
  interface JwtOptions {
    enabled?: boolean
    issuer?: string
    maxAge?: number
  }
}
