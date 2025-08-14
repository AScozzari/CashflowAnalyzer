# Overview

EasyCashFlows is a comprehensive financial management system designed for Italian small and medium enterprises (SMEs). It provides advanced cash flow tracking, analytics, and integrations with Italian fiscal requirements including FatturaPA (electronic invoicing). The application features a React-based frontend with a modern dashboard, authentication system, file upload capabilities, and comprehensive financial movement tracking with predictive analytics.

## Recent Status Update (2025-08-14)
- **RefreshSig Error Resolved**: Fixed React Hot Module Reload `$RefreshSig$ is not a function` error that occurred on page reload
- **App.tsx Refactored**: Changed from function declaration to arrow function to avoid HMR conflicts
- **Service Workers Removed**: Eliminated all remaining service worker files causing CSP violations
- **Stable React 18**: App now loads and reloads without errors in both development and production
- **Clean Architecture**: Removed all temporary files and maintained single App.tsx with proper HMR compatibility
- **Authentication**: Working with proper 401 handling for non-authenticated users

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript (Clean setup without PWA complexity)
- **Build Tool**: Vite with custom configuration for Replit deployment
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme variables and responsive design
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Deployment**: Works in new tab/window, iframe preview limited by security restrictions

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: Custom session store integrated with database
- **File Processing**: Multer for uploads, XML parsing for FatturaPA invoices
- **Security**: Helmet for security headers, CORS configuration for cross-origin requests

## Database Layer
- **Database**: PostgreSQL via Neon serverless platform
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Comprehensive financial data model including users, movements, companies, resources, and settings
- **Connection**: Connection pooling with WebSocket support for serverless environment

## File Storage
- **Cloud Storage**: Google Cloud Storage for document and invoice storage
- **File Upload**: Uppy.js integration for drag-and-drop file uploads
- **File Processing**: XML parsing for Italian electronic invoices (FatturaPA format)

## Key Features
- **Financial Movement Tracking**: Complete CRUD operations for financial transactions
- **Multi-entity Management**: Support for companies, operational sites, resources (employees), and IBAN accounts
- **Analytics Dashboard**: Interactive charts and financial insights
- **Italian Compliance**: FatturaPA electronic invoice parsing and integration
- **Role-based Access**: User authentication with session management
- **Responsive Design**: Mobile-first PWA with offline capabilities

## Design Patterns
- **Component Composition**: Reusable UI components with consistent props interface
- **Custom Hooks**: Centralized business logic in custom React hooks
- **Error Boundaries**: Graceful error handling throughout the application
- **Type Safety**: Full TypeScript implementation with shared schema definitions

# External Dependencies

## Core Infrastructure
- **Neon Database**: PostgreSQL serverless platform for data persistence
- **Google Cloud Storage**: Object storage for file and document management
- **Replit**: Development and hosting platform with custom deployment configuration

## Email Services
- **SendGrid**: Transactional email service for password resets and notifications
- **Email Templates**: HTML email templates for user communications

## Development Tools
- **ESBuild**: Fast bundling for production builds
- **PM2**: Process management for production deployment (via ecosystem.config.js)
- **Drizzle Kit**: Database migration and schema management

## Third-party Libraries
- **File Upload**: Uppy.js ecosystem for advanced file handling
- **XML Processing**: xml2js for parsing Italian FatturaPA invoices
- **Charts**: Chart.js integration for financial analytics
- **UI Components**: Extensive Radix UI ecosystem for accessible components

## Italian Business Integration
- **FatturaPA**: XML invoice format parsing and validation
- **Financial Compliance**: Italian tax and accounting standards support