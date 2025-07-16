# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Restaurant Management System built as a monorepo with NestJS backend and React frontend. The system serves small to medium-sized restaurants with role-based access control and real-time features.

## Architecture

- **Monorepo Structure**: Backend and frontend in separate directories with shared root package.json
- **Multi-tenant System**: Tenant isolation with subscription-based features
- **Real-time Communication**: Socket.IO for live updates (orders, kitchen, table status)
- **Role-based Access**: Admin, Waiter, Kitchen, Cashier roles with different permissions
- **Database**: PostgreSQL with TypeORM, Redis for caching/sessions
- **Payment Integration**: Stripe, PayPal, Iyzico gateway support

## Technology Stack

### Backend (NestJS)
- **Framework**: NestJS v10.0.0 with TypeScript
- **Database**: PostgreSQL + TypeORM v0.3.0
- **Cache**: Redis + ioredis
- **Auth**: JWT + Passport (local & JWT strategies)
- **Real-time**: Socket.IO v4.7.0
- **Payments**: Stripe v14.25.0, Iyzipay v2.0.64
- **Testing**: Jest with Supertest

### Frontend (React + Vite)
- **Build Tool**: Vite v6.3.5
- **Framework**: React v19.1.0 + React Router v7.6.0
- **State**: Zustand v5.0.4
- **Styling**: Tailwind CSS v3.4.1
- **UI**: Headless UI v2.2.3, Heroicons v2.2.0
- **HTTP**: Axios v1.9.0
- **i18n**: i18next v25.1.3 (EN, TR, ES, FR, DE)
- **Testing**: Vitest v1.4.0 + Testing Library
- **PWA**: Workbox v7.0.0

## Essential Development Commands

### Quick Start
```bash
# Install all dependencies and start development
npm run install:all
npm run start:dev  # Uses start-dev.sh script (Unix)
npm run start:dev:win  # Uses start-dev.bat (Windows)
```

### Individual Services
```bash
# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend
```

### Docker Operations
```bash
npm run docker:up    # Start all containers
npm run docker:down  # Stop all containers
npm run docker:build # Build images
npm run docker:logs  # View logs
npm run docker:restart # Restart containers
```

### Testing
```bash
# Run all tests
npm test

# Backend tests
npm run test:backend
npm run test:backend:unit
npm run test:backend:e2e

# Frontend tests
npm run test:frontend
npm run test:frontend:unit

# Payment system tests (comprehensive)
npm run test:payment
npm run test:payment:unit
npm run test:payment:e2e

# CI/CD tests
npm run test:ci
```

### Code Quality
```bash
npm run lint    # Lint both projects
npm run format  # Format both projects
npm run build   # Build both projects
```

### Backend Specific
```bash
cd backend

# Development
npm run start:dev     # Watch mode
npm run start:debug   # Debug mode

# Database
npm run migration:run      # Run migrations
npm run migration:generate # Generate migration
npm run typeorm           # TypeORM CLI access

# Testing
npm run test:watch    # Watch mode
npm run test:cov     # Coverage report
npm run test:debug   # Debug tests
```

### Frontend Specific
```bash
cd frontend

# Development
npm run dev        # Vite dev server
npm run preview    # Preview build

# Testing
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:campaign  # Campaign tests
npm run test:notification # Notification tests
npm run test:i18n     # i18n tests
```

## Application Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs

## Test Users

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | admin | password | Full system access |
| Waiter | waiter | password | Orders, tables, menu |
| Kitchen | kitchen | password | Kitchen panel, orders |
| Cashier | cashier | password | Payments, orders |

## Core Business Modules

### Backend Modules (src/)
- **auth/**: JWT authentication, user management, role-based access
- **menu/**: Categories, items, modifiers, pricing
- **order/**: Order lifecycle, item management, status tracking
- **table/**: Table management, QR codes, occupancy
- **payment/**: Multi-gateway payments (Stripe, PayPal, Iyzico)
- **kitchen/**: Real-time order queue, preparation status
- **stock/**: Inventory, suppliers, purchase orders
- **report/**: Analytics, sales reports, scheduled reports
- **customer/**: Customer profiles, loyalty programs
- **campaign/**: Marketing campaigns, customer targeting
- **notification/**: Push, email, in-app notifications
- **subscription/**: Tenant plans, feature access control

### Frontend Structure (src/)
- **components/**: Reusable UI components
- **pages/**: Route-based page components
- **store/**: Zustand state management
- **services/**: API client services
- **utils/**: Utility functions and helpers

## Key Development Patterns

### Database Patterns
- **Multi-tenant**: Tenant isolation via middleware
- **Soft Deletes**: Most entities support soft deletion
- **Audit Trails**: Created/updated timestamps on entities
- **Migrations**: Always run migrations for schema changes

### API Patterns
- **DTO Validation**: class-validator for request validation
- **Guard Authentication**: JWT guards on protected routes
- **Error Handling**: Consistent error responses
- **Rate Limiting**: Throttling on sensitive endpoints

### Frontend Patterns
- **Protected Routes**: Role-based route protection
- **Error Boundaries**: Graceful error handling
- **Loading States**: Consistent loading UX
- **Responsive Design**: Mobile-first approach

### Real-time Features
- **Socket.IO Events**: Order updates, kitchen notifications
- **Event Namespaces**: Tenant-specific event isolation
- **Connection Management**: Auto-reconnection handling

## Testing Strategy

### Backend Testing
- **Unit Tests**: Services, controllers, DTOs
- **E2E Tests**: Full API endpoint testing
- **Integration Tests**: Database operations
- **Payment Tests**: Comprehensive payment flow validation

### Frontend Testing
- **Component Tests**: UI component isolation
- **Integration Tests**: User flow testing
- **Accessibility Tests**: A11y compliance
- **Performance Tests**: Bundle size, render performance

## Environment Requirements

- **Node.js**: v16+
- **PostgreSQL**: v13+ (via Docker)
- **Redis**: v6+ (via Docker)
- **Docker**: Latest stable version

## Common Issues

- **Database Connection**: Ensure PostgreSQL is running via Docker
- **Redis Connection**: Ensure Redis is running via Docker
- **Port Conflicts**: Frontend:5173, Backend:3000, DB:5432, Redis:6379
- **Environment Variables**: Check backend/.env configuration
- **Migration Errors**: Run `npm run migration:run` in backend directory

## Performance Considerations

- **Database Indexing**: Proper indexes on frequently queried columns
- **Redis Caching**: Session storage and frequently accessed data
- **Code Splitting**: Frontend lazy loading for route components
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Image Optimization**: Compressed images for menu items

## Security Notes

- **JWT Tokens**: Short-lived access tokens with refresh mechanism
- **Password Hashing**: BCrypt for user passwords
- **Input Validation**: Strict validation on all user inputs
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Proper cross-origin resource sharing setup