# Golf Insurance Platform - Directory Structure

## Project Organization

```
golfins/
│
├── ARCHITECTURE.md                    # System architecture design
├── docker-compose.yaml               # Main orchestration
├── .env.example                      # Environment variables template
├── nginx.conf                        # Reverse proxy configuration
│
├── frontend/                         # Next.js Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── public/
│   │   ├── logo.svg
│   │   └── favicon.ico
│   └── src/
│       ├── app/
│       │   ├── layout.tsx            # Root layout
│       │   ├── page.tsx              # Landing page
│       │   ├── error.tsx
│       │   ├── not-found.tsx
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── forgot-password/page.tsx
│       │   ├── (customer)/
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── policies/page.tsx
│       │   │   ├── policies/[id]/page.tsx
│       │   │   ├── claims/page.tsx
│       │   │   ├── claims/new/page.tsx
│       │   │   ├── claims/[id]/page.tsx
│       │   │   ├── equipment/page.tsx
│       │   │   └── profile/page.tsx
│       │   ├── (admin)/
│       │   │   ├── products/page.tsx
│       │   │   ├── rules/page.tsx
│       │   │   ├── claims-management/page.tsx
│       │   │   ├── users/page.tsx
│       │   │   └── audit-logs/page.tsx
│       │   ├── quote/page.tsx        # Premium calculation page
│       │   └── api/                  # Route handlers
│       │       ├── auth/route.ts
│       │       ├── policies/route.ts
│       │       └── claims/route.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Footer.tsx
│       │   ├── forms/
│       │   │   ├── LoginForm.tsx
│       │   │   ├── PolicyForm.tsx
│       │   │   ├── ClaimForm.tsx
│       │   │   └── EquipmentForm.tsx
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Modal.tsx
│       │   │   └── Table.tsx
│       │   └── features/
│       │       ├── QuoteCalculator.tsx
│       │       ├── PolicyList.tsx
│       │       ├── ClaimTracker.tsx
│       │       └── CertificateViewer.tsx
│       ├── lib/
│       │   ├── api.ts               # API client
│       │   ├── auth.ts              # Auth utilities
│       │   ├── hooks.ts             # Custom React hooks
│       │   └── utils.ts             # Helper functions
│       ├── store/
│       │   ├── authStore.ts         # Zustand/Redux store
│       │   ├── policyStore.ts
│       │   └── claimStore.ts
│       ├── types/
│       │   └── index.ts             # TypeScript types
│       └── styles/
│           └── globals.css
│
├── services/                        # Microservices (Python FastAPI)
│   │
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── api/
│   │   │   │   ├── auth.py          # Auth routes
│   │   │   │   └── users.py         # User management
│   │   │   ├── models/
│   │   │   │   └── user.py          # SQLAlchemy models
│   │   │   ├── schemas/
│   │   │   │   └── user.py          # Pydantic schemas
│   │   │   ├── core/
│   │   │   │   ├── config.py        # Settings
│   │   │   │   ├── security.py      # JWT, password hashing
│   │   │   │   └── database.py      # DB connection
│   │   │   └── services/
│   │   │       └── user_service.py  # Business logic
│   │   └── tests/
│   │       └── test_auth.py
│   │
│   ├── policy-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── policies.py
│   │   │   │   └── certificates.py
│   │   │   ├── models/
│   │   │   │   ├── policy.py
│   │   │   │   └── coverage.py
│   │   │   ├── services/
│   │   │   │   ├── policy_service.py
│   │   │   │   └── certificate_service.py
│   │   │   └── workers/
│   │   │       └── policy_renewal_worker.py
│   │   └── tests/
│   │
│   ├── premium-engine/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── calculator.py
│   │   │   ├── models/
│   │   │   │   ├── premium_rule.py
│   │   │   │   └── calculation.py
│   │   │   ├── engine/
│   │   │   │   ├── calculator.py    # Core engine
│   │   │   │   └── rules.py         # Rule evaluator
│   │   │   └── services/
│   │   │       └── calculation_service.py
│   │   └── tests/
│   │
│   ├── claims-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── claims.py
│   │   │   │   ├── documents.py
│   │   │   │   └── workflow.py
│   │   │   ├── models/
│   │   │   │   ├── claim.py
│   │   │   │   └── document.py
│   │   │   ├── services/
│   │   │   │   ├── claim_service.py
│   │   │   │   ├── workflow_service.py
│   │   │   │   └── fraud_detection.py
│   │   │   └── workers/
│   │   │       └── claim_processor.py
│   │   └── tests/
│   │
│   ├── equipment-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── app/
│   │
│   ├── golf-course-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── app/
│   │
│   ├── notification-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── app/
│   │
│   ├── document-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── app/
│   │
│   └── admin-service/
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── main.py
│       └── app/
│
├── shared/                          # Shared Python code
│   ├── models/
│   ├── schemas/
│   ├── utils/
│   └── __init__.py
│
├── database/
│   ├── migrations/                  # Alembic migrations
│   │   ├── versions/
│   │   ├── env.py
│   │   └── alembic.ini
│   ├── seeds/                       # Sample data
│   │   ├── products.sql
│   │   ├── golf_courses.sql
│   │   └── premium_rules.sql
│   └── schema.sql                   # Full schema
│
├── infra/
│   ├── docker-compose.yaml
│   ├── nginx/
│   │   └── nginx.conf
│   ├── postgres/
│   │   └── Dockerfile
│   ├── redis/
│   │   └── Dockerfile
│   └── rabbitmq/
│       └── Dockerfile
│
├── docs/
│   ├── API.md                       # API documentation
│   ├── DEPLOYMENT.md                # Deployment guide
│   ├── DATABASE.md                  # Database schema docs
│   └── SECURITY.md                  # Security guidelines
│
├── scripts/
│   ├── setup-dev.sh                # Development setup
│   ├── migrate.sh                  # Database migrations
│   ├── seed-data.sh                # Load sample data
│   └── run-services.sh             # Start all services
│
└── README.md                        # Project overview
```

## Key Configuration Files

### .env.example
```
# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/golfins
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# S3/MinIO
S3_ENDPOINT_URL=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=golfins

# SMTP (Send emails)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-key

# Services
AUTH_SERVICE_URL=http://auth-service:8001
POLICY_SERVICE_URL=http://policy-service:8002
PREMIUM_ENGINE_URL=http://premium-engine:8003
CLAIMS_SERVICE_URL=http://claims-service:8004
NOTIFICATION_SERVICE_URL=http://notification-service:8007

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_APP_NAME=Golfins
```

### docker-compose.yaml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: golfins
      POSTGRES_USER: golfins_user
      POSTGRES_PASSWORD: golfins_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U golfins_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: minio server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    build: ./services/auth-service
    ports:
      - "8001:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins
      REDIS_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  policy-service:
    build: ./services/policy-service
    ports:
      - "8002:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins
      REDIS_URL: redis://redis:6379/0
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  premium-engine:
    build: ./services/premium-engine
    ports:
      - "8003:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins
      REDIS_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  claims-service:
    build: ./services/claims-service
    ports:
      - "8004:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins
      REDIS_URL: redis://redis:6379/0
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      S3_ENDPOINT_URL: http://minio:9000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      minio:
        condition: service_healthy

  notification-service:
    build: ./services/notification-service
    ports:
      - "8007:8000"
    environment:
      REDIS_URL: redis://redis:6379/0
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    depends_on:
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  document-service:
    build: ./services/document-service
    ports:
      - "8008:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins
      S3_ENDPOINT_URL: http://minio:9000
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost/api
    depends_on:
      - auth-service
      - policy-service

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - auth-service
      - policy-service
      - premium-engine
      - claims-service
      - notification-service
      - document-service

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  minio_data:
```
