/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],
  // Cloudflare Pages: mark heavy Node.js-only routes as nodejs runtime
  // The chat, ingest, and upload routes use Node.js packages not available on edge
}
module.exports = nextConfig
