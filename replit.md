# Overview

EasyCashFlows is a comprehensive financial management system for Italian SMEs, offering advanced cash flow tracking, analytics, and integration with Italian fiscal requirements like FatturaPA (electronic invoicing). It features a React-based frontend with a modern dashboard, authentication, file upload, and financial movement tracking with predictive analytics. The project's vision is to provide a multi-channel communication system including email, WhatsApp, SMS, and Telegram, with AI integration for intelligent responses and personalized financial insights.

## Recent Release - Release 7 (August 17, 2025)
**Complete Banking API Integration System + Advanced Transaction Verification**
- Implemented comprehensive banking API integration system for Italian banks with PSD2 compliance
- Added dynamic banking API configuration interface with 3-tab system (Provider, Credentials, Settings)
- Created provider-specific configuration forms that adapt to each bank's requirements:
  * UniCredit: Client ID, Client Secret, QWAC Certificate, QSEAL Certificate (✓ Implemented)
  * Intesa Sanpaolo: Client ID, Client Secret, Subscription Key, QWAC Certificate (✓ Implemented)  
  * CBI Globe: CBI Client ID, TPP License, QWAC Certificate, Partner Agreement (🚧 In development)
  * NEXI: Partner ID, API Key, PSD2 Registration, Merchant ID (🚧 Coming soon)
- Enhanced IBAN management with API status indicators (Active/Not configured) and banking configuration access
- Added verification column to movements table with red/green indicators for automatic transaction matching
- Integrated sandbox/production endpoint switching with real-time connection testing
- Built intelligent form fields that adapt to selected banking provider with proper validation
- Added support email links and comprehensive documentation references for each provider
- Implemented automatic synchronization settings with configurable frequency (hourly, daily, weekly)
- Enhanced modal dialogs with proper vertical scrolling and responsive design
- Completed comprehensive research on Italian banking API availability and documentation
- Added real provider configurations with accurate endpoints and requirements:
  * **CBI Globe**: Confirmed as centralized platform covering 317+ BCC banks, BPER Banca, and Banco BPM
  * **Banco BPM Direct**: Available through partnership, requires direct contact for API access
  * **Banco Desio Direct**: Limited public API documentation, partnership-based access required
- Integrated provider-specific field configurations that adapt dynamically to selected bank
- Enhanced UI with "Banche coperte" section showing which banks each provider supports
- Added comprehensive authentication requirements including eIDAS certificates and TPP registration
- System ready for automatic bank transaction verification and movement reconciliation

## Latest Fix - Critical Runtime Errors Resolution (August 17, 2025)
- ✅ **COMPLETED**: Resolved all critical runtime crashes and TypeScript errors
- Fixed customer creation page crash by adding missing CitySelectWithCap import
- Corrected WhatsApp interface TypeScript errors with proper null handling for contact names
- Fixed backend WhatsApp routes to use correct schema fields (removed non-existent fields)
- Implemented proper type checking for AI response handling in WhatsApp component
- Backend endpoints /api/whatsapp/chats and /api/whatsapp/messages now fully functional
- WhatsApp contact list properly displays customers, suppliers, and resources with mobile numbers
- All LSP diagnostics resolved - no remaining compilation errors

## Previous Enhancement - UX Improvements & Mobile Fields Integration (August 17, 2025)
- ✅ **COMPLETED**: Enhanced movement creation form with parent-child field dependencies for better UX
- Implemented conditional field disabling logic:
  * Company (parent) → Core, Resource, Office, IBAN (children) - disabled until company selected
  * Entity Type (parent) → Customer/Supplier selection (children) - disabled until entity type selected
- Added mobile phone fields to all entity creation forms (Resources, Customers, Suppliers)
- Updated database schema with mobile fields for enhanced WhatsApp integration
- Fixed contact search modal in WhatsApp interface to properly display contacts with mobile numbers
- Enhanced form placeholders to guide users through required field selection sequence
- Applied visual styling (opacity, cursor states) to clearly indicate disabled form fields
- Database migration completed: ALTER TABLE operations added mobile columns successfully

## Previous Fix - IBAN Creation Authentication Issue (August 17, 2025)  
- ✅ **RESOLVED**: Fixed IBAN creation error caused by missing authentication
- Identified root cause: Frontend session not authenticated, causing 401 errors on POST /api/ibans
- Tested successfully: IBAN creation works correctly with authenticated session
- Verified API functionality: POST /api/ibans accepts correct payload and creates IBAN records
- Security confirmed: IBAN creation properly requires admin/finance role authentication
- Issue resolution: Users must log in with admin/finance credentials to create/modify IBANs
- Authentication requirements: admin@cashflow.it / admin123 or finance credentials work correctly

# User Preferences

Preferred communication style: Simple, everyday language.

## Strategic Planning Sessions (August 2025)

### Multi-Tenant Analysis
**Feasibility**: Possible but highly complex (70-80% codebase impact)
- Database multi-tenant with tenant_id approach most viable
- Requires complete rework of authentication, database layer, API routes
- **Recommendation**: Complete core features first, consider separate instances for large clients instead
- **User Decision**: Deferred pending business need validation

### Modular System Architecture 
**Feasibility**: High - much more practical than multi-tenant (30-40% impact)
- Feature flags + conditional rendering approach
- Super admin panel for module activation/deactivation
- **Identified Modules**: Core Base, Financial Management, Communications, Banking Integration, AI Assistant, Document Processing, Backup System, Advanced Analytics
- **Business Benefits**: Tiered pricing, customization, performance optimization
- **Implementation**: Gradual rollout starting with feature flags
- **User Interest**: High priority for future development

### Modulo Cassa (POS/Fiscal Module) - Strategic Business Opportunity
**Market Timing**: Perfect - Italy transitioning from physical fiscal registers to cloud APIs (2025-2026)
**API Solutions Identified**: 
- Fiskaly SIGN IT (European leader, RESTful APIs)
- Openapi Electronic Receipt (Italy-focused, €0.009/receipt)

**Complete Ecosystem Requirements**:
1. **Product Management**
   - EAN, SKU, IMEI codes
   - Variants, categories, subcategories (tipologie)
   - Brand, supplier linkage
   - Images, descriptions
   - IVA nature codes
   
2. **Advanced Product Schema**
   - Unit of measure, weight/dimensions
   - MSRP, minimum margins
   - Product status, customs codes
   - Country of origin, certifications
   - Expiration dates, lot numbers
   - Stock thresholds, lead times
   - Warehouse locations
   
3. **Price List Management**
   - Base price lists, supplier costs
   - Promotional pricing, custom client rates
   - Multi-currency support, temporal validity
   
4. **Intelligent Inventory**
   - Real-time stock levels
   - Automatic movements from sales
   - Multi-location support
   - Reorder alerts, lot/expiry tracking

**Database Schema Extensions Required**:
- products, product_variants
- price_lists, price_list_items  
- inventory_locations, inventory_movements
- stock_levels

**Integration with Existing Modules**:
- Financial: Automatic accounting movements
- Suppliers: Integrated reorder management
- AI Assistant: Sales analytics, reorder suggestions
- Communications: Stock alerts via WhatsApp
- Banking: Automatic sales reconciliation

**Development Phases**:
1. Products + Basic price lists
2. Simplified inventory management
3. Fiscal API integration (Fiskaly/Openapi)
4. Advanced analytics and AI insights

**Business Assessment**: Highest ROI potential module for Italian SMEs - addresses complete commercial cycle from purchase to fiscal compliance.

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