You are a senior insurance solution architect and full-stack system designer.

Your task is to design and generate a production-ready architecture and implementation plan for a Golf Insurance Web Platform.

The platform must support:

Retail customer online insurance purchase
Embedded insurance integration with golf courses
Policy lifecycle management
Claim workflow automation
Equipment registration
Hole-in-one insurance verification workflow
Admin product configuration system
Dynamic premium calculation engine
Fraud detection-ready claim architecture
Target users:

Golf players
Golf courses
Insurance administrators
Claims adjusters
Underwriters
System architecture requirements:

Frontend:
Use Next.js

Backend:
Use Python FastAPI

Database:
Use PostgreSQL

Cache:
Use Redis

Storage:
Use S3-compatible object storage

Queue:
Use RabbitMQ

Authentication:
OAuth2 / JWT / SSO-ready

Deployment:
Docker-ready microservice architecture

MODULES TO DESIGN

Landing website
Include:

product introduction
coverage description
pricing simulation
FAQ
purchase entry point

Premium calculation engine
Must support:

age-based pricing
handicap-based pricing
frequency-based pricing
course-based pricing
coverage option pricing

Design:

pricing rule configuration tables
rule execution logic
real-time premium API

Online policy purchase workflow
Flow:

select product
enter golfer profile
select coverage
calculate premium
payment
policy issue
certificate generation
email delivery

Generate:

API structure
database schema
workflow logic

Policy certificate generation
Generate:

policy number
QR verification code
downloadable PDF certificate

Equipment insurance module
Allow:

club registration
serial number storage
equipment valuation
document upload

Support:

equipment lookup during claim

Hole-in-one insurance workflow
Design verification workflow:

golf course confirmation
referee confirmation
flight partner confirmation

Support:

event validation logic
claim eligibility automation

Claim management module
Support:

claim submission portal
document upload
adjuster assignment
approval workflow
payment trigger

Design:

state machine workflow

Example:

submitted
reviewing
document_requested
approved
rejected
paid

Embedded insurance module
Allow golf courses to integrate insurance purchase inside tee-time booking workflow

Design:

API integration model
partner authentication model
commission configuration

Admin portal
Must support:

product configuration
coverage configuration
premium rule configuration
policy monitoring
claim monitoring
user monitoring

Design dynamic configuration UI structure

Admin must configure products without developer support

Fraud detection ready architecture
Prepare support for:

duplicate claim detection
location validation
device fingerprinting
pattern detection integration

Design event logging strategy

Golf course integration module
Store:

course info
course verification contacts
location coordinates

Support:

incident location validation

Membership integration
Allow:

member ID sync
handicap sync
club validation

Design integration adapter layer

DATABASE DESIGN REQUIRED

Generate ERD-level schema including:

users
policies
products
coverage_options
premium_rules
claims
claim_documents
equipment_registry
golf_courses
membership_profiles

Include relationships

API DESIGN REQUIRED

Generate REST API structure including:

auth APIs
policy APIs
premium APIs
claim APIs
equipment APIs
admin APIs
partner APIs

SECURITY DESIGN REQUIRED

Include:

role-based access control
audit logging
policy encryption
document protection

OUTPUT FORMAT REQUIRED

Return structured result in:

System architecture diagram explanation
Database schema
API structure
Workflow diagrams
Module breakdown
Deployment architecture
Suggested folder structure
Sample FastAPI service skeleton
Sample Next.js frontend structure
Design everything production-ready and scalable for insurance enterprise usage.