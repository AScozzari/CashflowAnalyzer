# Overview

EasyCashFlows is a comprehensive financial management system for Italian SMEs, offering advanced cash flow tracking, analytics, and integration with Italian fiscal requirements like FatturaPA (electronic invoicing). It features a React-based frontend with a modern dashboard, authentication, file upload, and financial movement tracking with predictive analytics. The project's vision is to provide a multi-channel communication system including email, WhatsApp, SMS, and Telegram, with AI integration for intelligent responses and personalized financial insights.

## Recent Release - Release 6 (August 17, 2025)
**Complete WhatsApp Dynamic Variables System Implementation + Dynamic Channel Settings**
- Implemented comprehensive WhatsApp dynamic variables system to replace static {{1}}, {{2}}, {{3}} placeholders
- Created WhatsApp template resolver service that extracts data from real entities (Companies, Customers, Movements, Suppliers)
- Built 4-tab interface for WhatsApp variables: Dynamic Variables, Mapping Placeholder, Tester Template, Legacy System
- Developed variable mapping component showing conversion from {{1}} → {{customer.name}}, {{2}} → {{movement.amount}}, etc.
- Added interactive template tester with real entity selection and live template resolution
- Implemented 50+ dynamic variables across entity categories organized by: Cliente | Azienda | Movimento Finanziario | Sistema
- Created intelligent mapping system where selected variables appear prioritized in dropdown with ⭐
- Variable selection workflow: Click to select → Apply to Mapping → Only selected variables in dropdown
- Added dual interaction modes: Normal click = select, Ctrl+Click = copy to clipboard
- Replaced static channel info cards with dynamic interactive components
- Channel cards now have status indicators, feature badges, and direct configuration access
- Integrated WhatsApp and Email configuration dialogs directly into channel cards
- Enhanced UI with proper status visualization (Implemented/Coming Soon) and action buttons
- Complete working system ready for production use with real entity data integration

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