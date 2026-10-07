import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 7's generated client uses runtime imports that Turbopack cannot
  // resolve correctly. We opt the runtime packages out of bundling so that
  // Node's native `require` is used at runtime.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "@prisma/client-runtime-utils",
  ],
};

export default nextConfig;