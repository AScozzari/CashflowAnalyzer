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
- **Dashboard Stability & CSP Resolution**: Completely resolved dashboard crash issues on refresh by implementing proper TanStack Query v5 error handling. Eliminated Content Security Policy violations by removing external Google Fonts and implementing system font stack. Fixed API query loops, improved authentication session management, and created stable dashboard-new.tsx with robust error boundaries. Dashboard now fully stable with no console errors. (August 12, 2025)
- **Neon Database Integration**: Successfully migrated production server from local PostgreSQL to Neon database. Unified database configuration between development (Replit) and production environments. Login system verified working with POST /api/auth/login returning 200 status. Complete elimination of PostgreSQL local configuration complexity. (August 11, 2025)
- **Complete Project Transfer**: User manually copied entire EasyCashFlows project to production server 217.64.206.247. Application ready for final production setup with Neon database configuration and Node.js environment preparation. (August 11, 2025)
- **GitHub Integration Completed**: Successfully configured Git repository https://github.com/AScozzari/CashflowAnalyzer.git with 145 files committed (272.77 KiB). Version control established for deployment pipeline and future development. Production deployment ready via Git clone or optimized archive (218KB). (August 12, 2025)
- **Fix Prov Checkpoint**: Resolved React hook errors with SimpleThemeProvider, fixed database schema mismatches (added file_name column), eliminated CSP violations, and improved PWA stability. Dashboard still has refresh issues that need addressing. Ready for mobile responsiveness and PWA enhancements. (August 12, 2025)
- **Professional Dashboard Redesign**: Completely redesigned dashboard with enhanced responsiveness, professional styling, and comprehensive recent movements display. Features include gradient stats cards with progress indicators, detailed movement cards showing all relevant information (company, supplier, resource, dates, status, VAT info), quick actions widget, and performance metrics. Mobile-first responsive design with hover effects and smooth animations. Dashboard now provides complete financial overview with all useful movement data in professional layout. (August 12, 2025)
- **Responsive Modal & Settings Enhancement**: Fixed all modal responsiveness issues across movements and settings pages. Implemented complete dark theme compatibility for all dialog components. Created intelligent collapsible sidebar for settings with auto-collapse, hover expand, and pin/unpin functionality. Settings sidebar shows only icons when collapsed and expands on hover unless pinned. All hardcoded colors replaced with dynamic theme classes for seamless dark/light mode transitions. (August 12, 2025)
- **Movement Form Enhancement - Fix Release 1**: Completed comprehensive improvements to movement form functionality. Made resource field optional (non-mandatory) as per business requirements. Reorganized IVA fields with logical flow: amount first, then VAT type selection, followed by automatically calculated VAT total. Implemented real-time VAT calculation based on selected percentages (22%, 10%, 4%, Art.74 0%, Exempt 0%). VAT total field now read-only with automatic computation and user-friendly description. Enhanced form validation to exclude resourceId from required fields while maintaining data integrity. (August 12, 2025)
- **Customer Entity Complete Implementation**: Full customer management system with private/business customer types, comprehensive validation, and database integration. Created complete CRUD APIs, TypeScript types, and frontend components with intelligent form logic that adapts fields based on customer type selection. (August 13, 2025)
- **Professional Settings Page Redesign**: Completely redesigned settings page with horizontal navigation replacing sidebar for professional appearance. Implemented tabbed interface with color-coded icons, improved spacing, and responsive design. All entity management components now use consistent layout. (August 13, 2025)
- **CAP Field Standardization**: Systematically repositioned CAP (postal code) field after city field on separate row across ALL entity forms (customers, suppliers, companies, offices, resources) for consistent user experience and logical data flow. (August 13, 2025)
- **Enhanced City Selection**: Expanded Italian municipalities list to include all major cities and provincial capitals for comprehensive geographical coverage. Updated dropdown selection across all entity forms. (August 13, 2025)
- **Dark/Light Theme Modal Fix**: Improved all modal components with proper dark/light theme support including dialogs, alert dialogs, tabs, and select components. Enhanced contrast and readability in both themes. (August 13, 2025)
- **CAP Auto-Population System**: Implemented comprehensive automatic postal code (CAP) population when selecting cities across ALL entity forms. Created shared CitySelectWithCap component with extensive Italian municipalities database (100+ cities including Fiumicino, Civitavecchia, and all provincial capitals). System automatically fills CAP field when user selects a city, improving data entry efficiency and accuracy. Applied to customers, suppliers, companies, offices, and resources management. (August 13, 2025)

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