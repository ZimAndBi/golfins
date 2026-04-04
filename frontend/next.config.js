/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Auth
      { source: '/api/auth', destination: 'http://auth-service:8000/api/v1/auth' },
      { source: '/api/auth/:path*', destination: 'http://auth-service:8000/api/v1/auth/:path*' },

      // Policies
      { source: '/api/policies', destination: 'http://policy-service:8000/api/v1/policies' },
      { source: '/api/policies/:path*', destination: 'http://policy-service:8000/api/v1/policies/:path*' },

      // Products → premium-engine (NOT policy-service)
      { source: '/api/products', destination: 'http://premium-engine:8000/api/v1/products' },
      { source: '/api/products/:path*', destination: 'http://premium-engine:8000/api/v1/products/:path*' },

      // Quotes
      { source: '/api/quotes', destination: 'http://premium-engine:8000/api/v1/quotes' },
      { source: '/api/quotes/:path*', destination: 'http://premium-engine:8000/api/v1/quotes/:path*' },

      // Claims
      { source: '/api/claims', destination: 'http://claims-service:8000/api/v1/claims' },
      { source: '/api/claims/:path*', destination: 'http://claims-service:8000/api/v1/claims/:path*' },

      // Documents
      { source: '/api/documents', destination: 'http://document-service:8000/api/v1/documents' },
      { source: '/api/documents/:path*', destination: 'http://document-service:8000/api/v1/documents/:path*' },

      // Notifications
      { source: '/api/notifications', destination: 'http://notification-service:8000/api/v1/notifications' },
      { source: '/api/notifications/:path*', destination: 'http://notification-service:8000/api/v1/notifications/:path*' },
    ]
  },
}

module.exports = nextConfig
