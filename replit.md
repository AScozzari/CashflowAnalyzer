# Overview
EasyCashFlows is a comprehensive financial management system for Italian SMEs. It provides advanced cash flow tracking, analytics, and integration with Italian fiscal requirements like FatturaPA (electronic invoicing). The system features a React-based frontend, robust backend, and multi-channel communication capabilities including email, WhatsApp, SMS, and Telegram, with AI integration for intelligent responses and personalized financial insights. Its core purpose is to provide a comprehensive, multi-channel financial management solution with a focus on Italian market compliance and intelligent automation.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript.
- **UI/Styling**: Radix UI components with shadcn/ui design system and Tailwind CSS.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **Routing**: Wouter.

## Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript.
- **Authentication**: Passport.js with local strategy and session-based authentication.
- **Security**: Helmet for security headers, CORS configuration, CSRF protection, rate limiting, encrypted data handling.

## Database Layer
- **Database**: PostgreSQL (Neon serverless platform).
- **ORM**: Drizzle ORM with a custom safe deployment system to ensure robust, timeout-free production deployments.
- **Schema**: Comprehensive financial data model including users, movements, companies, resources, and settings.

## File Storage & Processing
- **Cloud Storage**: Google Cloud Storage for documents and invoices.
- **File Upload**: Uppy.js for drag-and-drop.
- **File Processing**: XML parsing for Italian electronic invoices (FatturaPA format).

## Key Features
- **Financial Movement Tracking**: CRUD operations for transactions with AI analysis.
- **Multi-entity Management**: Support for companies, operational sites, resources, and IBANs.
- **Analytics Dashboard**: Interactive charts and predictive insights.
- **Italian Compliance**: FatturaPA electronic invoice parsing and integration, including bidirectional invoice-movement sync.
- **Role-based Access**: Admin, finance, and user roles.
- **Multi-Cloud Backup System**: Automated backup to Google Cloud Storage, Amazon S3, and Azure Blob Storage.
- **Multi-Channel Notifications**: WhatsApp Business API, Email, SMS, Telegram with webhook management.
- **OpenAI Integration**: AI Assistant for intelligent financial analysis.
- **Banking API Integration**: Comprehensive system for Italian banks with PSD2 compliance.
- **Professional UI/UX**: Modern responsive design with dark mode.
- **Product Catalog Management**: Complete system for managing product listings, pricing, and inventory with Italian business requirements.

## Design Patterns
- **Component Composition**: Reusable UI components.
- **Custom Hooks**: Centralized business logic.
- **Error Boundaries**: Graceful error handling.
- **Type Safety**: Full TypeScript implementation with shared schema definitions.

# External Dependencies

## Core Infrastructure
- **Neon Database**: PostgreSQL serverless platform.
- **Google Cloud Storage**: Object storage.

## Communication Services
- **SendGrid**: Transactional email service.
- **Twilio**: WhatsApp Business API.
- **Skebby**: SMS API.
- **Facebook Messenger**: Messaging platform.

## Electronic Invoicing Providers
- **Fatture in Cloud**: API integration for invoice management and FatturaPA compliance.
- **ACube**: Government-certified electronic invoicing service with SDI integration.
- **Multi-Provider Architecture**: Dual provider system for failover and load balancing.

## Banking APIs
- **UniCredit**
- **Intesa Sanpaolo**
- **CBI Globe**
- **NEXI**

## Third-party Libraries
- **Uppy.js**: File upload ecosystem.
- **xml2js**: Parsing Italian FatturaPA invoices.
- **Chart.js**: Financial analytics charts.
- **Radix UI**: UI components.
- **OpenAI**: AI integration.