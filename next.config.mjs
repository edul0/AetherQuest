/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    // Ignora erros de linting durante o build na Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de tipagem do TypeScript durante o build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
