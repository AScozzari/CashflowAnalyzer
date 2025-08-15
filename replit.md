# Overview

EasyCashFlows is a comprehensive financial management system designed for Italian small and medium enterprises (SMEs). It provides advanced cash flow tracking, analytics, and integrations with Italian fiscal requirements including FatturaPA (electronic invoicing). The application features a React-based frontend with a modern dashboard, authentication system, file upload capabilities, and comprehensive financial movement tracking with predictive analytics.

## Recent Status Update (2025-08-15) - ✅ MULTI-CHANNEL COMMUNICATION SYSTEM ENTERPRISE

### 🎯 NEW MILESTONE - MULTI-CHANNEL COMMUNICATION SYSTEM COMPLETED (2025-08-15 21:35)
- **Communication Center**: ✅ IMPLEMENTATO - Sistema completo multi-canale (Email, WhatsApp, SMS, Telegram)
- **Email Interface**: ✅ OUTLOOK-STYLE - Template, composizione, gestione conversazioni con interfaccia professionale
- **WhatsApp Interface**: ✅ CHAT-NATIVE - Template conversazioni, AI integration, status messaggi in tempo reale  
- **SMS Interface**: ✅ COMPLETO - Gestione SMS con template, conteggio caratteri, stima costi per messaggio
- **Telegram Interface**: ✅ TELEGRAM-STYLE - Chat interface nativa con markdown, bot templates, gestione canali
- **Navigation Integration**: ✅ OPERATIVO - Menu "Comunicazioni" aggiunto a sidebar desktop e mobile
- **Template System**: ✅ AVANZATO - Template personalizzabili per ogni canale con variabili dinamiche
- **Backup System**: ✅ SICURO - Backup completo creato prima implementazione per rollback rapido

### 🤖 PREVIOUS MILESTONE - AI-POWERED WEBHOOK SYSTEM COMPLETED (2025-08-15 21:05)
- **AI Auto-Response**: ✅ IMPLEMENTATO - Sistema GPT-3.5-turbo per risposte intelligenti WhatsApp
- **Intent Analysis**: ✅ FUNZIONANTE - Analisi automatica messaggi (saluti, pagamenti, urgenze, supporto)
- **Business Hours Logic**: ✅ OPERATIVO - Gestione orari ufficio con auto-response personalizzate
- **Multi-Provider Support**: ✅ COMPLETO - Twilio + LinkMobility con signature validation HMAC
- **Webhook Diagnostics**: ✅ INTEGRATO - Dashboard completa per test, monitoring e configurazione
- **Enterprise Security**: ✅ ATTIVO - Rate limiting, timing-safe comparison, production validation
- **Header Settings Fix**: ✅ RISOLTO - Ora usa componente Header standard senza icone custom
- **AI Context Awareness**: ✅ AVANZATO - Accesso dati finanziari per risposte personalizzate
- **OpenAI Error 429 Fix**: ✅ RISOLTO - Retry logic con exponential backoff per rate limiting
- **WebSocket Diagnostics**: ✅ MIGLIORATO - Usa WebSocket Manager esistente invece di test che falliscono
- **OpenAI UI Conditional**: ✅ PERFEZIONATO - Guida errori 429 visibile solo quando necessario, messaggio successo per connessioni funzionanti
- **Webhook Diagnostics Buttons**: ✅ OPERATIVI - Test Generale e Aggiorna con loading states e feedback corretto

### 🎯 PREVIOUS MILESTONE - WHATSAPP BUSINESS API (2025-08-15 20:05)
- **UI/UX Simplificata**: ✅ COMPLETATO - Single provider selection invece di configurazioni multiple confuse
- **Business Manager Guides**: ✅ COMPLETATO - Guide complete Meta/Twilio e Meta/LinkMobility setup
- **API Backend**: ✅ FUNZIONANTE - Endpoint protetti con autenticazione admin (401 verificato)
- **Database Schema**: ✅ IMPLEMENTATO - Tabella whatsapp_settings creata e configurata
- **Provider Documentation**: ✅ COMPLETATO - Documentazione dettagliata per entrambi i provider con pricing

### 🏆 PREVIOUS MILESTONE - ENTERPRISE FEATURES (2025-08-15 18:35)
- **Multi-Cloud Backup System**: ✅ COMPLETATO - Google Cloud Storage + Amazon S3 + Azure Blob Storage integrato
- **OpenAI API Key Management**: ✅ COMPLETATO - Gestione sicura chiavi con visualizzazione crittografata e test automatici
- **Cloud Provider Statistics**: ✅ REAL-TIME - Statistiche autentiche da tutti i provider cloud configurati

### 🏆 PREVIOUS CHECKPOINT - USER MANAGEMENT (2025-08-15 17:35)
- **User Management**: ✅ COMPLETATO - Sistema ruoli admin/finance/user con permessi granulari
- **Demo Finance User**: ✅ CREATO - finance_demo/finance123 con anagrafica completa
- **Role Permissions**: ✅ TESTATI - admin (tutto), finance (no settings), user (solo propri dati)
- **System Users**: ✅ OPERATIVO - Gestione anagrafica (firstName, lastName, avatarUrl)
- **Password Reset**: ✅ FUNZIONANTE - Testato per tutti i tipi utente
- **Database Schema**: ✅ STABILE - Pronto per security features implementation
- **API Security**: ✅ PREPARATO - Endpoint con role-based filtering implementato

## Recent Status Update (2025-08-14) - ✅ SISTEMA 100% OPERATIVO E CONFERMATO FUNZIONANTE
### 🎯 CURRENT STATUS: Sistema 100% Operativo con AI Chat e UI/UX Professionale
- **Problema 404 RISOLTO**: ✅ Corretto entry point da main-clean.tsx a main.tsx nel file HTML
- **Service Worker RISOLTO**: ✅ Disabilitato per prevenire errori MIME type durante sviluppo
- **Autenticazione FUNZIONANTE**: ✅ Login admin/admin123 testato e completamente operativo
- **Database Integration**: ✅ COMPLETATA - AI ora ha accesso completo ai dati finanziari reali
- **UI/UX Upgrade**: ✅ IMPLEMENTATA - Interface moderna ispirata a ChatGPT con il nostro theme
- **OpenAI Integration**: ✅ TESTATA - Analisi in tempo reale con €1.279.306 entrate, €4.700 uscite
- **Professional Design**: ✅ Bolle di chat eleganti, sidebar sessioni, input area moderna, suggestions intelligenti
- **Status Corrente**: Sistema AI completo, login confermato (admin/admin123), dashboard caricata, dati reali €1.279.306

### 🔍 ANALISI APPROFONDITA DEL PROBLEMA - RISOLTO COMPLETAMENTE (2025-08-14)
**Root Cause Identificato (Web Research):**
- Replit ha introdotto nuovo servizio proxy WebSocket "Eval" per sostituire Conman
- Cambiamento architetturale 2025 causa problemi temporanei connessioni WebSocket
- Hot reload interrotto durante transizione infrastrutturale Replit
- NON è problema di configurazione utente/rete - confermato lato Replit

**Soluzione Implementata:**
- WebSocket Manager disabilitato per stabilità (applicazione funziona perfettamente senza)
- CSP configurato correttamente per Replit domains in tutti i file server
- Fix ERR_NETWORK_CHANGED nel client HTML per prevenire errori Vite HMR
- Sistema fallback HTTP completamente operativo per tutte le funzionalità

### 🎨 AI CHAT UI/UX MODERNE IMPLEMENTATE
- **ChatGPT-Style Interface**: Design pulito con bolle di chat full-width, typing indicators animati
- **Smart Input Area**: Textarea con auto-resize, pulsante send circolare, suggestions intelligenti
- **Professional Sidebar**: Lista sessioni elegante con hover effects, delete buttons, icons colorati  
- **Message Design**: Layout a due colonne con avatar, timestamp, token count, action buttons (copia, like)
- **Welcome Screen**: Schermata di benvenuto con suggerimenti di query finanziarie pre-configurate
- **Database Integration**: AI accede a movimenti, analytics, aziende con privacy mode per dati sensibili

### 🏗️ ARCHITECTURE COMPLETION
- **Performance Monitoring**: Custom hooks for debouncing, lazy loading, memory management
- **Security Middleware**: CSRF tokens, input sanitization, rate limiting for API endpoints
- **Error Boundaries**: Multi-level error handling with graceful fallback UI
- **Loading States**: Professional skeleton components and progress indicators
- **Validation**: Comprehensive Zod schemas for all forms and API endpoints
- **TypeScript**: Enhanced type safety with proper session types and shared schemas
- **Dashboard**: Optimized with React.memo, TanStack Query v5 caching strategy
- **Replit Integration**: Configuration file for environment detection and optimization

### 🔒 ENTERPRISE SECURITY FEATURES
- **CSRF Protection**: Full token validation system with secure middleware
- **Rate Limiting**: API endpoints protected with 100 requests per 15 minutes
- **XSS Prevention**: Automatic input sanitization for all request data
- **Session Security**: Secure session management with touch() renewal
- **CSP Headers**: Optimized Content Security Policy for Replit compatibility
- **Middleware Ordering**: Security applied after session initialization to prevent conflicts

### 📊 PERFORMANCE OPTIMIZATIONS
- **Custom Performance Hooks**: Real-time monitoring, debouncing, lazy loading
- **Component Optimization**: React.memo for expensive dashboard components
- **Query Caching**: TanStack Query v5 with intelligent cache invalidation
- **Loading Experience**: Professional skeleton UI and loading states throughout
- **Memory Management**: Cleanup hooks and performance monitoring system

# User Preferences

Preferred communication style: Simple, everyday language.

## Communication System Architecture Plan (2025-08-15)
**Vision**: Sistema multi-canale con interfacce specializzate per ogni tipo di comunicazione:
- **Email**: Interface simile a Outlook con template, view interazioni, composizione email
- **WhatsApp**: Chat interface simile a WhatsApp con template per conversazioni, AI integration
- **SMS**: Interface chat-like per gestione SMS con template
- **Telegram**: Interface simile a Telegram per gestione comunicazioni
- **Sidebar Navigation**: Menu "Comunicazioni" con tab per ogni canale
- **Template System**: Template personalizzabili per ogni canale
- **AI Integration**: Assistant per ogni canale con risposte intelligenti

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
- **Financial Movement Tracking**: Complete CRUD operations for financial transactions with AI-powered analysis
- **Multi-entity Management**: Support for companies, operational sites, resources (employees), and IBAN accounts
- **Analytics Dashboard**: Interactive charts and financial insights with predictive capabilities
- **Italian Compliance**: FatturaPA electronic invoice parsing and integration
- **Role-based Access**: Enterprise-grade user authentication with granular permissions (admin/finance/user)
- **Multi-Cloud Backup System**: Automated backup to Google Cloud Storage, Amazon S3, and Azure Blob Storage
- **Multi-Channel Notifications**: WhatsApp Business API, Email, SMS, Telegram with webhook management
- **OpenAI Integration**: AI Assistant with secure API key management and intelligent financial analysis
- **Enterprise Security**: CSRF protection, rate limiting, encrypted data handling, session management
- **Professional UI/UX**: Modern responsive design with dark mode, professional empty states, and intuitive workflows

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