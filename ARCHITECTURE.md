# Golf Insurance Platform - System Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Service Architecture](#service-architecture)
5. [Database Design](#database-design)
6. [API Structure](#api-structure)
7. [Authentication & Authorization](#authentication--authorization)
8. [Workflows](#workflows)
9. [Deployment Architecture](#deployment-architecture)
10. [Security Design](#security-design)

---

## System Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                         │
├──────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Web)  │  Mobile (future)  │ Admin Dashboard   │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────────────┐
        │                                 │
┌───────▼──────┐              ┌──────────▼──────┐
│ API Gateway  │              │  WebSocket      │
│ (Auth/Rate)  │              │  Server         │
└───────┬──────┘              └──────┬──────────┘
        │                            │
        └────────────┬───────────────┘
                     │
    ┌────────────────▼─────────────────┐
    │        Microservices Layer       │
    ├──────────────────────────────────┤
    │ • Auth Service                   │
    │ • Policy Service                 │
    │ • Premium Engine Service         │
    │ • Claims Service                 │
    │ • Equipment Service              │
    │ • Golf Course Service            │
    │ • Notification Service           │
    │ • Document Service               │
    │ • Admin Service                  │
    └────────────────┬─────────────────┘
                     │
    ┌────────────────┼─────────────────┐
    │                │                 │
┌───▼────┐      ┌────▼───┐      ┌─────▼─┐
│PostgreSQL│   │  Redis  │    │RabbitMQ│
│Database  │   │  Cache  │    │Queues  │
└──────────┘   └─────────┘    └────────┘
    │
    └─────────────────┐
                      │
                ┌─────▼─────┐
                │ S3 Storage │
                │ (Documents)│
                └────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: React 18+, Tailwind CSS
- **State Management**: Zustand / Redux Toolkit
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios / TanStack Query
- **Charts/Graphs**: Recharts, Chart.js
- **PDF Generation**: html2pdf, puppeteer
- **QR Code**: qrcode.react

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.x
- **Async**: AsyncIO + uvicorn
- **Validation**: Pydantic v2
- **Auth**: python-jose + passlib + python-multipart
- **Cache**: redis + aioredis
- **Queue**: RabbitMQ + aio-pika
- **API Docs**: OpenAPI/Swagger
- **Testing**: pytest + pytest-asyncio

### Database
- **Primary**: PostgreSQL 15+
- **Migrations**: Alembic
- **Connection Pool**: asyncpg

### Infrastructure
- **Container**: Docker + Docker Compose
- **Orchestration**: (Kubernetes ready)
- **Message Queue**: RabbitMQ 3.12+
- **Cache**: Redis 7+
- **Object Storage**: MinIO (S3-compatible)

---

## Service Architecture

### Core Services

#### 1. Auth Service
- OAuth2 + JWT token management
- User registration & login
- Role-based access control (RBAC)
- Session management
- MFA support (ready)

#### 2. Policy Service
- Policy lifecycle management (creation, active, renewal, cancellation)
- Policy issuance workflow
- Certificate generation
- Policy search & retrieval
- Renewal automation

#### 3. Premium Calculation Engine
- Rule-based premium calculation
- Age, handicap, frequency, course pricing
- Coverage option pricing
- Real-time quote generation
- Rule versioning & audit trail

#### 4. Claims Service
- Claim submission & tracking
- Document management
- Workflow state machine
- Adjuster assignment
- Payment trigger

#### 5. Equipment Registry Service
- Equipment CRUD operations
- Serial number tracking
- Valuation management
- Document attachment
- Equipment lookup during claims

#### 6. Golf Course Integration Service
- Course information management
- Integration API for embedded purchases
- Partner authentication
- Commission configuration
- Incident location validation

#### 7. Notification Service
- Email delivery (SendGrid/similar)
- SMS notifications (Twilio/similar)
- Push notifications
- Template management
- Event-driven triggers

#### 8. Document Service
- PDF certificate generation
- QR code embedding
- Document storage & retrieval
- S3 integration
- Audit trail

#### 9. Admin Service
- Product configuration
- Coverage configuration
- Premium rule configuration
- User management
- Monitoring & reporting

---

## Database Design

### Entity Relationship Diagram (ERD)

#### Core Tables

```
USERS
├── id (PK)
├── email (UNIQUE)
├── phone
├── password_hash
├── first_name
├── last_name
├── date_of_birth
├── role (enum: customer, admin, adjuster, underwriter, partner)
├── status (enum: active, inactive, suspended)
├── created_at
├── updated_at
└── deleted_at

GOLF_COURSES
├── id (PK)
├── name
├── location_city
├── state/province
├── country
├── latitude
├── longitude
├── phone
├── email
├── handicap_index
├── num_holes
├── par_score
├── established_year
├── website
├── status (active/inactive)
├── created_at
├── updated_at

GOLF_COURSE_CONTACTS
├── id (PK)
├── golf_course_id (FK)
├── contact_type (enum: pro_shop, management, verification)
├── name
├── email
├── phone
├── is_primary
├── created_at

PRODUCTS
├── id (PK)
├── name
├── description
├── status (draft, active, archived)
├── product_type (enum: round, annual, hole_in_one, equipment)
├── version
├── effective_date
├── end_date
├── created_by (FK -> users)
├── created_at
├── updated_at

COVERAGE_OPTIONS
├── id (PK)
├── product_id (FK)
├── name
├── description
├── base_premium
├── coverage_limit
├── deductible
├── active
├── sort_order
├── created_at
├── updated_at

PREMIUM_RULES
├── id (PK)
├── product_id (FK)
├── name
├── description
├── rule_type (enum: age, handicap, frequency, course, coverage)
├── min_value
├── max_value
├── adjustment_type (percent/fixed)
├── adjustment_value
├── operator (>, >=, <, <=, ==, in)
├── priority
├── version
├── is_active
├── created_by (FK -> users)
├── effective_date
├── end_date
├── created_at
├── updated_at

USERS_PROFILES (Golfer Details)
├── id (PK)
├── user_id (FK)
├── age
├── handicap
├── playing_frequency (rounds per year)
├── skill_level (beginner, intermediate, advanced)
├── primary_course_id (FK -> golf_courses)
├── total_years_playing
├── created_at
├── updated_at

POLICIES
├── id (PK)
├── policy_number (UNIQUE - generated)
├── user_id (FK)
├── product_id (FK)
├── status (draft, active, renewal_pending, cancelled, expired)
├── premium_amount
├── calculated_by (json - rules applied)
├── start_date
├── end_date
├── renewal_date
├── golf_course_id (FK - optional, for embedded)
├── partner_id (FK - optional, for B2B)
├── certificate_generated
├── certificate_path
├── qr_code_token
├── payment_status (pending, completed, failed)
├── payment_date
├── transaction_id
├── created_at
├── updated_at
└── deleted_at

POLICY_COVERAGES (Line Items)
├── id (PK)
├── policy_id (FK)
├── coverage_option_id (FK)
├── premium_amount
├── coverage_limit
├── deductible
├── added_at

CLAIMS
├── id (PK)
├── claim_number (UNIQUE - generated)
├── policy_id (FK)
├── user_id (FK)
├── claim_type (enum: round_play, equipment, hole_in_one)
├── status (submitted, reviewing, document_requested, approved, rejected, paid)
├── claim_amount_requested
├── claim_amount_approved
├── incident_date
├── incident_description
├── golf_course_id (FK)
├── incident_latitude
├── incident_longitude
├── case_notes (text)
├── assigned_adjuster_id (FK -> users)
├── approved_by (FK -> users)
├── rejection_reason
├── payment_date
├── payment_amount
├── payment_method
├── created_at
├── updated_at

CLAIM_DOCUMENTS
├── id (PK)
├── claim_id (FK)
├── document_type (enum: receipt, photo, scorecard, witness_statement, police_report, etc)
├── file_name
├── file_path (S3 path)
├── file_size
├── mime_type
├── uploaded_by_id (FK -> users)
├── verification_status (pending, verified, rejected)
├── verified_by_id (FK -> users)
├── uploaded_at
├── created_at

CLAIM_EVENTS
├── id (PK)
├── claim_id (FK)
├── event_type (enum: submitted, reviewed, approved, paid, etc)
├── created_by (FK -> users)
├── details (json)
├── created_at

EQUIPMENT_REGISTRY
├── id (PK)
├── user_id (FK)
├── equipment_type (enum: driver, putter, iron_set, hybrid, wood, etc)
├── brand
├── model
├── serial_number (UNIQUE)
├── purchase_date
├── purchase_value
├── current_value
├── condition (excellent, good, fair, poor)
├── photos_path (S3 path)
├── verified_at
├── created_at
├── updated_at

HOLE_IN_ONE_CLAIMS
├── id (PK)
├── claim_id (FK)
├── hole_number
├── witnesses
├── golf_course_confirmation_status (pending, confirmed, rejected)
├── course_contact_confirmation_id (FK -> golf_course_contacts)
├── pro_signature_required
├── proof_of_handicap_required
├── proof_of_score_required
├── verification_token
├── created_at
├── updated_at

MEMBERSHIP_PROFILES
├── id (PK)
├── user_id (FK)
├── golf_club_id (FK -> golf_courses)
├── member_id (external ID)
├── handicap (synced)
├── membership_type (full, social, trial)
├── join_date
├── status (active, inactive, suspended)
├── last_sync_date
├── created_at
├── updated_at

PREMIUM_CALCULATION_LOG
├── id (PK)
├── policy_id (FK)
├── base_premium
├── rules_applied (json array of rule IDs + adjustments)
├── final_premium
├── calculation_method
├── calculated_at

AUDIT_LOG
├── id (PK)
├── entity_type (enum: policy, claim, user, product, etc)
├── entity_id
├── action (create, update, delete, approve, reject)
├── actor_id (FK -> users)
├── changes (json diff)
├── ip_address
├── user_agent
├── created_at

NOTIFICATIONS
├── id (PK)
├── recipient_id (FK -> users)
├── notification_type (enum: claim_update, policy_issued, payment_received)
├── title
├── message
├── reference_id (policy_id/claim_id)
├── reference_type
├── is_read
├── delivery_channel (email, sms, push)
├── delivery_status (pending, sent, failed)
├── created_at
├── read_at

PARTNER_INTEGRATIONS
├── id (PK)
├── golf_course_id (FK)
├── partner_name
├── api_key (encrypted)
├── webhook_url
├── commission_rate (decimal)
├── status (active, inactive)
├── last_sync_at
├── created_at
├── updated_at

DEVICES (Fraud Detection)
├── id (PK)
├── user_id (FK)
├── device_fingerprint (hash)
├── device_type (web, mobile, tablet)
├── browser
├── os
├── ip_address
├── last_used_at
├── created_at

FRAUD_EVENTS
├── id (PK)
├── entity_type (claim, policy, user)
├── entity_id
├── fraud_flag_type (duplicate_claim, location_mismatch, device_anomaly)
├── risk_score
├── details (json)
├── action_taken (none, flagged_for_review, bounced)
├── reviewed_by_id (FK -> users)
├── created_at
```

### Key Relationships

```
User → Policies (1:N)
User → Claims (1:N)
Policy → Claims (1:N)
Policy → PolicyCoverages (1:N)
Product → CoverageOptions (1:N)
Product → PremiumRules (1:N)
GolfCourse → GolfCourseContacts (1:N)
GolfCourse → Policies (1:N)
GolfCourse → Claims (1:N)
User → EquipmentRegistry (1:N)
Claim → ClaimDocuments (1:N)
Claim → ClaimEvents (1:N)
Claim → HoleInOneDetails (1:1 - if type is hole_in_one)
User → MembershipProfiles (1:N)
User → Notifications (1:N)
Claim → FraudEvents (1:N)
```

---

## API Structure

### Authentication Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

### Policy Endpoints

```
GET    /api/v1/policies
POST   /api/v1/policies
GET    /api/v1/policies/{policy_id}
PUT    /api/v1/policies/{policy_id}
DELETE /api/v1/policies/{policy_id}
GET    /api/v1/policies/{policy_id}/certificate
POST   /api/v1/policies/{policy_id}/renew
GET    /api/v1/policies/status/{status}
```

### Premium Calculation Endpoints

```
POST   /api/v1/quotes/calculate
GET    /api/v1/products
GET    /api/v1/products/{product_id}
GET    /api/v1/products/{product_id}/coverages
GET    /api/v1/premium-rules (admin only)
POST   /api/v1/premium-rules (admin only)
PUT    /api/v1/premium-rules/{rule_id} (admin only)
```

### Claims Endpoints

```
GET    /api/v1/claims
POST   /api/v1/claims
GET    /api/v1/claims/{claim_id}
PUT    /api/v1/claims/{claim_id}
POST   /api/v1/claims/{claim_id}/documents
GET    /api/v1/claims/{claim_id}/documents
PUT    /api/v1/claims/{claim_id}/documents/{doc_id}
POST   /api/v1/claims/{claim_id}/submit
POST   /api/v1/claims/{claim_id}/approve
POST   /api/v1/claims/{claim_id}/reject
POST   /api/v1/claims/{claim_id}/assign-adjuster
```

### Equipment Endpoints

```
GET    /api/v1/equipment
POST   /api/v1/equipment
GET    /api/v1/equipment/{equipment_id}
PUT    /api/v1/equipment/{equipment_id}
DELETE /api/v1/equipment/{equipment_id}
POST   /api/v1/equipment/{equipment_id}/documents
```

### Golf Course Integration (Partner API)

```
POST   /api/v1/partners/auth
GET    /api/v1/partners/{partner_id}/products
POST   /api/v1/partners/{partner_id}/quotes
POST   /api/v1/partners/{partner_id}/policies
GET    /api/v1/partners/{partner_id}/sales-report
```

### Admin Endpoints

```
GET    /api/v1/admin/products (auth)
POST   /api/v1/admin/products (auth)
PUT    /api/v1/admin/products/{product_id} (auth)
GET    /api/v1/admin/coverages (auth)
POST   /api/v1/admin/coverages (auth)
PUT    /api/v1/admin/coverages/{coverage_id} (auth)
GET    /api/v1/admin/rules (auth)
POST   /api/v1/admin/rules (auth)
PUT    /api/v1/admin/rules/{rule_id} (auth)
GET    /api/v1/admin/audit-log (auth)
GET    /api/v1/admin/fraud-events (auth)
GET    /api/v1/admin/reports/claims
GET    /api/v1/admin/reports/premium
```

### Golf Course Endpoints

```
GET    /api/v1/golf-courses
GET    /api/v1/golf-courses/{course_id}
GET    /api/v1/golf-courses/search
GET    /api/v1/golf-courses/{course_id}/contacts
POST   /api/v1/golf-courses (admin only)
```

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": ["customer", "admin"],
  "permissions": ["read:policies", "create:claims"],
  "iat": 1234567890,
  "exp": 1234571490,
  "jti": "token_id"
}
```

### Role-Based Access Control (RBAC)

```
Roles:
- customer: Can view own policies, create claims, register equipment
- admin: Full access to products, rules, users, claims
- adjuster: Can review claims, request documents, approve/reject
- underwriter: Can approve high-value claims
- partner: Limited to own golf course sales and reporting

Permissions are hierarchical and encoded in token
```

---

## Workflows

### Policy Purchase Workflow

```
1. Customer arrives at homepage
   ↓
2. Select product → Select coverage options
   ↓
3. Enter golfer profile (age, handicap, frequency)
   ↓
4. Premium Engine calculates price
   ↓
5. Customer reviews & selects payment method
   ↓
6. Payment processed
   ↓
7. Policy stored in database
   ↓
8. Certificate generated (PDF with QR code)
   ↓
9. Email sent with policy details & certificate
   ↓
10. Customer can download/view in portal
```

### Claim Submission Workflow

```
1. Customer initiates claim
   ↓
2. Selects claim type (round_play, equipment, hole_in_one)
   ↓
3. Provides incident details & golf course location
   ↓
4. Uploads supporting documents
   ↓
5. Submits claim → Status: "submitted"
   ↓
6. System validates fraud flags (duplicate, location, device)
   ↓
7. Claim assigned to adjuster → Status: "reviewing"
   ↓
8. Adjuster reviews & may request additional documents
   ↓
9. If more docs needed → Status: "document_requested"
   ↓
10. Customer uploads docs
    ↓
11. Adjuster approves/rejects
    ↓
12. If approved → Status: "approved", payment triggered
    ↓
13. Payment processed → Status: "paid"
    ↓
14. Customer notified via email/SMS
```

### Hole-in-One Verification Workflow

```
1. Customer submits hole-in-one claim
   ↓
2. System identifies golf course pro shop contact
   ↓
3. Verification email sent to pro shop
   ↓
4. Pro shop confirms incident details
   ↓
5. Flight partner confirmation email sent
   ↓
6. Verification token validated
   ↓
7. If all verified → Claim eligible for payment
   ↓
8. Adjuster approves → Payment processed
```

### Embedded Integration Workflow (Golf Course)

```
1. Golfer books tee time on golf course website
   ↓
2. Golf course prompts: "Add insurance?"
   ↓
3. Customer clicks "Yes" → Embedded iframe/modal opens
   ↓
4. QuickQuote API called with golfer profile data
   ↓
5. Premium calculated in real-time
   ↓
6. Customer adds insurance to cart
   ↓
7. Golf course handles cart + insurance checkout
   ↓
8. Golf course sends booking data + insurance purchase to Golfins API
   ↓
9. Policy created + certificate emailed
   ↓
10. Golf course receives commission notification
```

---

## Deployment Architecture

### Docker Microservices Structure

```
golfins/
├── frontend/                          # Next.js app
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── policy-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── premium-engine/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── claims-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── equipment-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── golf-course-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── notification-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── document-service/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── admin-service/
│       ├── Dockerfile
│       └── requirements.txt
│
├── gateway/                           # API Gateway (optional, can use nginx)
│   └── nginx.conf
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── docker-compose.yaml               # Orchestration
├── nginx.conf                        # Reverse proxy
└── .env                             # Environment variables
```

### Docker Compose Services

```yaml
services:
  postgres:          # Database
  redis:            # Cache
  rabbitmq:         # Message queue
  minio:            # S3-compatible storage

  auth-service:     # Port 8001
  policy-service:   # Port 8002
  premium-engine:   # Port 8003
  claims-service:   # Port 8004
  equipment-service: # Port 8005
  golf-course-service: # Port 8006
  notification-service: # Port 8007
  document-service: # Port 8008
  admin-service:    # Port 8009

  frontend:         # Port 3000
  nginx:           # Port 80/443

  # Optional monitoring
  prometheus:
  grafana:
```

---

## Security Design

### Data Protection

1. **Encryption**
   - Passwords: bcrypt with salt
   - Sensitive data at rest: AES-256
   - API keys: Encrypted in database
   - TLS/SSL in transit (HTTPS)

2. **Access Control**
   - Role-based permissions matrix
   - Resource-level access checks
   - Audit logging for all sensitive actions
   - Session management with timeout

3. **API Security**
   - Rate limiting per IP/user
   - CORS policy enforcement
   - Input validation & sanitization
   - SQL injection prevention (parameterized queries)
   - XSS protection (CSP headers)

4. **Document Protection**
   - File upload validation (type, size)
   - Virus scanning on upload
   - Encrypted storage
   - Time-limited download URLs
   - Audit trail of access

5. **Fraud Detection**
   - Device fingerprinting
   - Duplicate claim detection (claim number pattern, user ID)
   - Location validation (incident location vs user location)
   - Pattern analysis (claim frequency, amount anomalies)
   - Suspicious activity logging

6. **Compliance**
   - GDPR: Data retention policies, right to be forgotten
   - PCI DSS: Payment data handling
   - Insurance industry standards
   - Regular security audits
   - Penetration testing

---

## Monitoring & Observability

### Metrics
- API response times
- Service error rates
- Database query performance
- Queue processing times
- PDF generation times

### Logging
- Structured JSON logs
- Centralized log aggregation (ELK)
- Audit trail for all sensitive operations
- Error tracking with context

### Alerting
- Service downtime
- High error rates
- Slow queries
- Queue depth
- Document processing failures

---

## Development Priorities

### Phase 1: Core Infrastructure
1. Database setup & migrations
2. Auth service
3. Policy service basics
4. Premium calculation engine
5. Frontend homepage & auth

### Phase 2: Policy & Claims
1. Complete policy purchase workflow
2. Certificate generation
3. Claims management interface
4. Document upload

### Phase 3: Advanced Features
1. Hole-in-one verification
2. Equipment registry
3. Membership integration
4. Fraud detection system

### Phase 4: B2B & Admin
1. Golf course embedding API
2. Admin portal
3. Partner management
4. Advanced reporting

---

## Next Steps

1. Generate database migration files
2. Create service skeletons (FastAPI)
3. Create frontend components
4. Set up Docker infrastructure
5. Implement authentication
6. Build API endpoints
7. Create workflow engines
8. Add monitoring & logging
