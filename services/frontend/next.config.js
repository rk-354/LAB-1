/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent pdf-parse, mammoth, xlsx from being bundled by webpack — use native Node.js require
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],
  },
}
module.exports = nextConfig
