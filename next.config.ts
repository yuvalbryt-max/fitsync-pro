import type { NextConfig } from "next"

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection',          value: '1; mode=block' },
  { key: 'Permissions-Policy',        value: 'camera=(self), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  serverExternalPackages: ['sharp'],
}

export default nextConfig
