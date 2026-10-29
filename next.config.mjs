/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors MUST block builds (this is the primary Phase 0 quality gate).
  // Lint is deferred to a later step; Next 16 removed the `eslint` config key.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
