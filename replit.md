# Overview

The CashFlow Management System is a production-ready, full-stack financial tracking application designed for Italian businesses. It enables comprehensive management and tracking of financial flows (income/expenses) and related entities such as companies, business cores, resources, IBANs, operational offices, tags, and movement statuses. Key capabilities include a dashboard with analytics, robust movement management with file and XML invoice uploads, and configurable entities via a settings interface. The system supports multi-role authentication (Admin, Finance, User) and integrates VAT handling. The project's ambition is to provide a comprehensive, intuitive, and secure solution for financial oversight, enhancing business efficiency and compliance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack Query (React Query) for server state management and API caching.
- **UI Components**: Radix UI primitives and shadcn/ui for a consistent design system.
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design, supporting dark/light themes.
- **Forms**: React Hook Form with Zod for validation and type safety.
- **Charts**: Recharts for data visualization.
- **UI/UX Decisions**: Professional dashboard redesign with enhanced responsiveness, gradient stats cards, detailed movement cards, and quick actions. Modals are responsive and support dark themes. Settings page features horizontal navigation and tabbed interfaces. CAP (postal code) fields are standardized and auto-populated based on city selection across all entity forms, utilizing an extensive Italian municipalities database. Movement modal UI/UX is redesigned with dynamic sections based on income/expense selection, including Base Information, Entity Association (customer/supplier, resource/office), and Financial Details (IBAN, status, amounts, VAT, documents).

## Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Handling**: Multer for file uploads (PDF, DOC, images up to 10MB).
- **Error Handling**: Centralized middleware for structured error responses.

## Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling.
- **ORM**: Drizzle ORM with schema definitions for type safety.
- **Schema Structure**: Includes core business entities (cores, companies, resources, ibans, offices, tags, movement statuses) and financial movements with foreign key relationships.
- **Validation**: Drizzle-Zod integration.
- **Migrations**: Drizzle Kit for database migrations and schema management.

## Authentication and Authorization
- **Authentication**: JWT-based with secure password hashing (bcrypt).
- **Role-based Access Control**: Three user roles: Admin (full access), Finance (access to movements and analytics, create/edit entities), and User (limited to viewing movements assigned to their resource).
- **Protected Routes**: All API endpoints secured with authentication middleware.
- **Session Storage**: PostgreSQL session store with connect-pg-simple.
- **Password Recovery**: Email-based password reset system.

## Deployment Architecture
- **Development**: Replit environment with hot reload.
- **Production**: Ubuntu server with automated SSH deployment pipeline.
- **Process Management**: PM2 for production process monitoring and auto-restart.
- **Port Standardization**: Application standardized on port 5000.

# External Dependencies

- **Database**: Neon PostgreSQL serverless database.
- **UI Library**: Radix UI.
- **Date Handling**: date-fns.
- **Validation**: Zod.
- **Email Service**: SendGrid.
- **Version Control**: GitHub.