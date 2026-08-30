import type { NextConfig } from "next";

function publicMediaRemotePatterns(): URL[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return [];

  try {
    return [new URL("/storage/v1/object/public/media-public/**", supabaseUrl)];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: publicMediaRemotePatterns(),
  },
};

export default nextConfig;
