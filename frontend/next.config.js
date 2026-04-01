/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://auth-service:8000/api/v1/auth/:path*',
      },
      {
        source: '/api/policies/:path*',
        destination: 'http://policy-service:8000/api/v1/policies/:path*',
      },
      {
        source: '/api/products/:path*',
        destination: 'http://policy-service:8000/api/v1/products/:path*',
      },
      {
        source: '/api/quotes/:path*',
        destination: 'http://premium-engine:8000/api/v1/quotes/:path*',
      },
      {
        source: '/api/claims/:path*',
        destination: 'http://claims-service:8000/api/v1/claims/:path*',
      },
      {
        source: '/api/documents/:path*',
        destination: 'http://document-service:8000/api/v1/documents/:path*',
      },
      {
        source: '/api/notifications/:path*',
        destination: 'http://notification-service:8000/api/v1/notifications/:path*',
      },
    ]
  },
}

module.exports = nextConfig
