<<<<<<< HEAD
# Golf Insurance Platform - MVP

**A production-ready golf insurance web platform built with Next.js, FastAPI, and Docker.**

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11+ (if running services locally)
- Node.js 18+ (if running frontend locally)

### 1. Clone and Setup
```bash
cd e:\docker\golfins
cp .env.example .env
```

### 2. Start Services
```bash
docker-compose up -d
```

**Wait 30 seconds for all services to be healthy:**
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- RabbitMQ Admin: localhost:15672
- MailHog: localhost:8025
- MinIO: localhost:9000
- Auth Service: localhost:8001
- Policy Service: localhost:8002
- Premium Engine: localhost:8003
- Claims Service: localhost:8004
- Document Service: localhost:8008
- Notification Service: localhost:8007
- Frontend: localhost:3000
- Nginx: localhost

### 3. Access Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost/api

User: admin@golfins.com
Password: Admin@123

Test xác nhận thanh toán:
curl.exe -X POST http://localhost/api/v1/payments/webhook `
         -H "Content-Type: application/json" `
         -d '{\"transaction_content\": \"GOLF POL-22971E\"}'

## 📋 Features

### ✅ Implemented (MVP)
1. **Auth Service** - Register, login, JWT tokens
2. **Policy Service** - Policy CRUD, management
3. **Premium Engine** - Intelligent quote calculation (age, handicap, frequency)
4. **Claims Service** - Submit and track insurance claims
5. **Document Service** - Certificate generation
6. **Notification Service** - Email notifications
7. **Frontend** - Complete customer portal with auth, quotes, policies, claims

### ⏳ Future (Phase 2)
- Admin dashboard for product/rule configuration
- Equipment registry
- Hole-in-one verification workflow
- Membership integration
- Advanced fraud detection
- B2B golf course integration
- Mobile app

## 🏗️ Architecture

### Microservices
- **Auth Service** (Port 8001): User authentication & JWT management
- **Policy Service** (Port 8002): Policy lifecycle management
- **Premium Engine** (Port 8003): Dynamic premium calculation
- **Claims Service** (Port 8004): Claims workflow & tracking
- **Document Service** (Port 8008): PDF certificate generation
- **Notification Service** (Port 8007): Event-driven email notifications

### Infrastructure
- **PostgreSQL 15**: Primary database
- **Redis 7**: Caching & token management
- **RabbitMQ 3.12**: Event queue for async operations
- **MinIO**: S3-compatible object storage
- **MailHog**: Email testing (local SMTP)
- **Nginx**: Reverse proxy & load balancer

### Frontend
- **Next.js 14**: Modern React framework
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management
- **Axios**: HTTP client with automatic auth

## 🧪 Testing Workflow

### Test User Registration & Login
```bash
# Navigate to: http://localhost:3000/register
# Create account with:
# - Email: test@example.com
# - Password: SecurePass123!
# - Name: Test User
```

### Test Quote Calculation
```bash
# Navigate to: http://localhost:3000/quote
# Enter profile:
# - Age: 35
# - Handicap: 10
# - Frequency: 30 rounds/year
# See calculated premium
```

### Test Policy Purchase
```bash
# Click "Continue to Purchase"
# Confirm & simulate payment
# See policy number & certificate
```

### Test Claims Submission
```bash
# Navigate to: http://localhost:3000/claims?new=true
# Select policy
# Submit claim with description & amount
# Track claim status
```

### Test Email Notifications
```bash
# Open MailHog: http://localhost:8025
# View all emails sent during actions
# (Registration, policy creation, claim submission, etc.)
```

## 📊 Database Schema

Core tables:
- `users` - User accounts with roles
- `products` - Insurance products
- `product_coverages` - Coverage options per product
- `premium_rules` - Dynamic pricing rules
- `policies` - Customer policies
- `policy_coverages` - Line items per policy
- `claims` - Insurance claims
- `claim_documents` - Uploaded claim documents
- `golf_courses` - Course information

See `database/migrations/versions/001_initial_schema.py` for full schema.

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh-token
```

### Policies
```
POST   /api/v1/policies (create)
GET    /api/v1/policies (list user's)
GET    /api/v1/products (list products)
GET    /api/v1/products/{id}/coverages
```

### Premium Calculation
```
POST   /api/v1/quotes/calculate
```

### Claims
```
POST   /api/v1/claims (submit)
GET    /api/v1/claims (list user's)
PUT    /api/v1/claims/{id}/documents (upload docs)
```

### Documents
```
POST   /api/v1/documents/generate-certificate
GET    /api/v1/documents/{id}
```

## 🛠️ Development

### Local Development (Without Docker)

#### Auth Service
```bash
cd services/auth-service
python -m pip install -r requirements.txt
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Code Structure
```
golfins/
├── frontend/                 # Next.js web app
│   ├── src/
│   │   ├── app/             # Pages & layouts
│   │   ├── components/      # React components
│   │   ├── lib/             # API client, utilities
│   │   ├── store/           # Zustand state
│   │   └── styles/          # Global CSS
│   └── dockerfile
│
├── services/                # Microservices
│   ├── auth-service/
│   ├── policy-service/
│   ├── premium-engine/
│   ├── claims-service/
│   ├── document-service/
│   └── notification-service/
│
├── database/                # Database setup
│   ├── migrations/          # Alembic migrations
│   └── seeds/               # Sample data
│
├── docker-compose.yaml      # Service orchestration
├── nginx.conf               # Reverse proxy config
└── README.md
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Request logging & audit trails
- Environment-based configuration
- API rate limiting (ready)
- Encrypted credentials storage (ready)

## 📈 Performance

- Async/await for all I/O operations
- Redis caching for premium rules
- Database connection pooling
- Optimized queries with indexes
- Docker-based horizontal scaling (ready)

## 🚨 Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose logs auth-service

# Restart services
docker-compose restart

# Full reset
docker-compose down -v
docker-compose up -d
```

### Database connection errors
```bash
# Verify PostgreSQL is running
docker-compose logs postgres

# Check connection string in .env
# DATABASE_URL=postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins
```

### Frontend API errors
```bash
# Check API_URL in frontend/.env
# NEXT_PUBLIC_API_URL=http://localhost/api

# Verify backend services are running
curl http://localhost:8001/health
curl http://localhost:8002/health
```

## 📞 Support

For issues, check:
1. Docker Compose logs: `docker-compose logs [service-name]`
2. Browser console for frontend errors
3. MailHog (localhost:8025) for email delivery status
4. RabbitMQ Admin (localhost:15672) for message queues

## 📄 License

Commercial - Golf Insurance MVP Platform

## 🎯 Next Steps

1. ✅ Deploy to production (Docker/Kubernetes)
2. ✅ Connect real payment processor (Stripe)
3. ✅ Implement B2B golf course integration API
4. ✅ Add admin dashboard
5. ✅ Mobile app development
6. ✅ Advanced fraud detection
7. ✅ Performance optimization & CDN
8. ✅ Multi-language support

---

**Built with ❤️ for golfers everywhere**

MVP Completed: March 31, 2026
=======
# golfins
Bảo hiểm Golf
>>>>>>> c80c1ef2542a1f6b68adb881e6819b6a9018219a
