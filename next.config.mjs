/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // mongoose must stay a server-side external package
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
