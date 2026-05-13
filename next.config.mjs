/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "twilio",
    "resend",
    "@supabase/supabase-js",
    "@supabase/ssr",
  ],
}

export default nextConfig
