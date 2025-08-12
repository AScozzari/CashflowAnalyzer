# Overview

CashFlow Management System is a production-ready full-stack financial movement tracking application built with React/TypeScript frontend and Express.js backend. The system enables Italian businesses to manage and track financial flows (income/expenses) with comprehensive entity management including companies (ragioni sociali), business cores, resources (employees), IBANs, operational offices, tags, and movement statuses. The application features a dashboard with analytics, movement management with file uploads, and configurable entities through a settings interface.

## Recent Changes (January 2025)
- **Authentication System**: Implemented complete JWT-based authentication with role-based access control
- **User Management**: Added comprehensive user roles (Admin, Finance, User) with specific permissions
- **Database Migration**: Successfully migrated user authentication tables and created admin user
- **API Security**: Protected all API endpoints with authentication middleware and role validation
- **Frontend Integration**: Complete login/logout interface with protected routes
- **API Testing**: All CRUD operations verified working (GET, POST, PUT, DELETE) for entities and movements
- **Analytics Verification**: Confirmed analytics are correctly connected to current month movements
- **VAT System Implementation**: Added comprehensive VAT handling with taxable amount and VAT type fields
- **XML Invoice Integration**: Added compact XML uploader inside movement modal for automatic data pre-filling
- **Supplier Management**: Integrated supplier selection in movement forms with VAT number matching
- **UI Enhancements**: Improved movement form with professional XML upload button and supplier/VAT info display
- **Table Actions Completion**: All table actions now fully functional across dashboard and movements pages
- **Document Management**: Complete file download system with proper content-type handling and security controls
- **Bug Resolution**: Fixed movement deletion functionality and improved error handling in backend storage layer
- **Password Recovery System**: Complete email-based password reset with SendGrid integration
- **Resource Management**: Fixed crashes in resource modal with array safety checks and improved input visibility
- **Production Deployment**: Professional SSH deployment scripts and server management tools
- **Production Ready**: Successfully deployed on Ubuntu server (217.64.206.247) with nginx reverse proxy, background process management via nohup, and automatic startup configuration
- **Network Configuration**: Application standardized on port 5000 (development and production), nginx reverse proxy configured, fully functional locally but requires SSH tunnel for external access due to ISP/network firewall restrictions
- **Port Standardization**: Complete alignment on port 5000 for both Replit development and production server deployment, eliminating frontend/backend port mismatches
- **Production Deployment COMPLETED**: EasyCashFlows successfully deployed on production server 217.64.206.247. Database migration completed with all 707 rows imported from Replit to local PostgreSQL. **TECHNICAL SOLUTION**: Resolved Vite dependency issue by moving Vite from devDependencies to dependencies, fixing @types/node compatibility (22.17.1), and configuring NODE_ENV=development for Vite integration. Server running on port 5000 with original architecture maintained (Vite + Express), full API functionality, JWT authentication, and database connectivity. All core business logic deployed and operational.
- **Final Production Setup Completed**: Complete deployment pipeline established from Replit to production server. Resolved Node.js installation, package.json ES module compatibility, PostCSS configuration, and tsx execution path issues. Application now fully operational at http://217.64.206.247 with nginx reverse proxy, background process management, and complete feature set including financial movements, XML invoice integration, analytics dashboard, and multi-role authentication system.
- **Production Deployment SUCCESS**: EasyCashFlows successfully deployed and fully operational on production server 217.64.206.247. Resolved database authentication issues, WebSocket conflicts from Replit plugins, bcryptjs authentication implementation, and route configuration conflicts. Final working credentials: admin/admin123. All core functionality verified working: JWT authentication, PostgreSQL database connection, React frontend with Vite, financial movements management, XML invoice processing, analytics dashboard, and complete user role system (Admin/Finance/User). Original Vite architecture maintained as requested.
- **Authentication System Fix**: Resolved JSON parsing errors in login system and 502 Bad Gateway issues. Fixed PostgreSQL module imports for production server, corrected setupAuth middleware exports, and improved error handling in frontend authentication hooks. Production server now fully operational with working login system and complete financial management functionality. (August 11, 2025)
- **Neon Database Integration**: Successfully migrated production server from local PostgreSQL to Neon database. Unified database configuration between development (Replit) and production environments. Login system verified working with POST /api/auth/login returning 200 status. Complete elimination of PostgreSQL local configuration complexity. (August 11, 2025)
- **Complete Project Transfer**: User manually copied entire EasyCashFlows project to production server 217.64.206.247. Application ready for final production setup with Neon database configuration and Node.js environment preparation. (August 11, 2025)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Routing**: Wouter for client-side routing with pages for dashboard, movements, analytics, and settings
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design system
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Forms**: React Hook Form with Zod for validation and type safety
- **Charts**: Recharts for data visualization in dashboard analytics

## Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Handling**: Multer middleware for file uploads with validation (PDF, DOC, images up to 10MB)
- **Development**: Vite middleware integration for development with hot reload
- **Error Handling**: Centralized error handling middleware with structured responses

## Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM with schema definitions in shared directory for type safety
- **Schema Structure**: 
  - Core business entities (cores, companies, resources, ibans, offices, tags, movement statuses)
  - Financial movements with foreign key relationships
  - Validation using Drizzle-Zod integration
- **Migrations**: Drizzle Kit for database migrations and schema management

## Authentication and Authorization
- **JWT-based Authentication**: Complete session management with secure password hashing
- **Role-based Access Control**: Three user roles with specific permissions:
  - **Admin**: Full system access including user management and all CRUD operations
  - **Finance**: Access to movements and analytics, can create/edit entities but cannot delete
  - **User**: Limited to viewing movements assigned to their resource only
- **Protected Routes**: All API endpoints secured with authentication middleware
- **Session Storage**: PostgreSQL session store with connect-pg-simple integration
- **Password Security**: bcrypt hashing with forced password change on first access

## External Dependencies
- **Database**: Neon PostgreSQL serverless database (development) / PostgreSQL (production)
- **Development**: Replit-specific plugins for development environment
- **UI Library**: Extensive Radix UI component ecosystem
- **File Storage**: Local file system storage for uploaded documents
- **Date Handling**: date-fns for Italian locale date formatting
- **Validation**: Zod schema validation throughout the application stack
- **Email Service**: SendGrid for password recovery and notifications
- **Production Server**: Ubuntu server (IP: 217.64.206.247) with PM2 process management

## Deployment Architecture
- **Development**: Replit environment with hot reload and development database
- **Production**: Ubuntu server with automated SSH deployment pipeline
- **Process Management**: PM2 for production process monitoring and auto-restart
- **Deployment Scripts**: Automated deploy.sh for full deployments, quick-deploy.sh for minor updates
- **Server Management**: Professional management scripts with backup, logging and monitoring
- **Repository Sync**: GitHub integration with automatic push/pull workflow