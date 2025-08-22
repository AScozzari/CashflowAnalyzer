# Overview
EasyCashFlows is a comprehensive financial management system for Italian SMEs, offering advanced cash flow tracking, analytics, and integration with Italian fiscal requirements like FatturaPA (electronic invoicing). It features a React-based frontend with a modern dashboard, authentication, file upload, and financial movement tracking with predictive analytics. The project's vision is to provide a multi-channel communication system including email, WhatsApp, SMS, and Telegram, with AI integration for intelligent responses and personalized financial insights.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Authentication**: Passport.js with local strategy and session-based authentication
- **File Processing**: Multer for uploads, XML parsing for FatturaPA invoices
- **Security**: Helmet for security headers, CORS configuration

## Database Layer
- **Database**: PostgreSQL via Neon serverless platform
- **ORM**: Drizzle ORM
- **Schema**: Comprehensive financial data model including users, movements, companies, resources, and settings

## File Storage
- **Cloud Storage**: Google Cloud Storage for document and invoice storage
- **File Upload**: Uppy.js integration for drag-and-drop file uploads
- **File Processing**: XML parsing for Italian electronic invoices (FatturaPA format)

## Key Features
- **Financial Movement Tracking**: CRUD operations for transactions with AI analysis.
- **Multi-entity Management**: Support for companies, operational sites, resources, and IBANs.
- **Analytics Dashboard**: Interactive charts and predictive insights.
- **Italian Compliance**: FatturaPA electronic invoice parsing and integration.
- **Role-based Access**: Admin, finance, and user roles with granular permissions.
- **Multi-Cloud Backup System**: Automated backup to Google Cloud Storage, Amazon S3, and Azure Blob Storage.
- **Multi-Channel Notifications**: WhatsApp Business API, Email, SMS, Telegram with webhook management.
- **OpenAI Integration**: AI Assistant with secure API key management and intelligent financial analysis.
- **Enterprise Security**: CSRF protection, rate limiting, encrypted data handling, session management.
- **Professional UI/UX**: Modern responsive design with dark mode and intuitive workflows.
- **Banking API Integration**: Comprehensive system for Italian banks with PSD2 compliance, dynamic configuration, and transaction verification.
- **Multi-Channel Webhook System**: Complete webhook system for all communication channels (WhatsApp, SMS, Email, Messenger) with unified AI handling and business hours logic.
- **Professional Notification System**: Enhanced categorized notification bell system with multi-channel support (Movements, WhatsApp, SMS, Email, Messenger) with actionable URLs and priority levels.

## Design Patterns
- **Component Composition**: Reusable UI components.
- **Custom Hooks**: Centralized business logic.
- **Error Boundaries**: Graceful error handling.
- **Type Safety**: Full TypeScript implementation with shared schema definitions.

# External Dependencies

## Core Infrastructure
- **Neon Database**: PostgreSQL serverless platform.
- **Google Cloud Storage**: Object storage.
- **Replit**: Development and hosting platform.

## Email Services
- **SendGrid**: Transactional email service.

## Development Tools
- **ESBuild**: Fast bundling.
- **PM2**: Process management.
- **Drizzle Kit**: Database migration and schema management.

## Third-party Libraries
- **File Upload**: Uppy.js ecosystem.
- **XML Processing**: xml2js for parsing Italian FatturaPA invoices.
- **Charts**: Chart.js for financial analytics.
- **UI Components**: Radix UI ecosystem.

## Italian Business Integration
- **FatturaPA**: XML invoice format parsing and validation.
- **Financial Compliance**: Italian tax and accounting standards support.
- **Banking APIs**: UniCredit, Intesa Sanpaolo, CBI Globe, NEXI.
- **Communication Platforms**: Twilio, LinkMobility (WhatsApp), Skebby (SMS), Facebook Messenger.
- **AI**: OpenAI.

## Skebby SMS API Integration Details
- **Base URL**: `https://api.skebby.it/API/v1.0/REST/`
- **Authentication**: Two-step process using username/password → user_key + session_key
- **Message Quality Types**:
  - `GP` (High Quality): Premium SMS with guaranteed delivery
  - `TI` (Medium Quality): Standard SMS 
  - `SI` (Low Quality): Basic SMS with lower cost
- **Core Features**:
  - Single SMS sending (`POST /sms`)
  - Bulk SMS to groups
  - Scheduled delivery with datetime
  - Webhook support for delivery receipts
  - Contact management with custom fields
  - SMS templates system
  - Blacklist/Stop SMS management
  - Two-factor authentication SMS
  - TPOA aliases (custom sender names)
  - Subaccount management
  - Real-time delivery status tracking
- **Authentication Headers**: `user_key` and `Session_key` required for all API calls
- **Request Format**: JSON payload for POST requests
- **Response Format**: JSON with `result: "OK"` for success
- **Integration Pattern**: Login → Get credentials → Send SMS with auth headers