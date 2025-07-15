# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Restaurant Management System built as a monorepo with:
- **Backend**: NestJS with PostgreSQL, Redis, TypeORM, Socket.IO, and multiple payment gateways
- **Frontend**: React + TypeScript + Vite with Zustand, Tailwind CSS, and i18n support

## Essential Commands

### Development
```bash
# Start full development environment (auto-installs dependencies)
npm run start:dev        # Linux/Mac
npm run start:dev:win    # Windows

# Individual services
cd backend && npm run start:dev   # Backend on :3000
cd frontend && npm run dev        # Frontend on :5173
```

### Testing
```bash
# Run all tests
npm test

# Backend tests (Jest)
cd backend && npm run test
cd backend && npm run test:watch
cd backend && npm run test:e2e

# Frontend tests (Vitest)
cd frontend && npm run test
cd frontend && npm run test:watch
cd frontend && npm run test:coverage
```

### Code Quality
```bash
npm run lint      # Lint all code
npm run format    # Format all code
```

### Database
```bash
cd backend
npm run migration:generate -- -n MigrationName
npm run migration:run
```

### Build & Deploy
```bash
npm run build            # Build both apps
npm run docker:up        # Start with Docker
npm run docker:down      # Stop Docker containers
```

## Architecture

### Backend Module Structure
Each feature module contains:
- `*.controller.ts` - HTTP endpoints
- `*.service.ts` - Business logic
- `*.entity.ts` - Database models
- `dto/*.dto.ts` - Data validation
- `*.module.ts` - Module definition

Key modules: auth, menu, order, kitchen, table, payment, stock, dashboard, notification, tenant, subscription, report

### Frontend Structure
- `/components` - Reusable UI components
- `/pages` - Route pages
- `/store` - Zustand stores (auth, menu, order, etc.)
- `/services` - API communication layer
- `/hooks` - Custom React hooks
- `/i18n` - Internationalization (EN, ES, FR, TR)

### Real-time Features
Socket.IO is used for:
- Order status updates
- Kitchen notifications
- Table status changes
- Dashboard live updates

### Multi-tenant Architecture
- Tenant isolation at database level
- Subscription management with 15-day trial
- Role-based access control per tenant

### Authentication & Roles
- JWT-based authentication
- Roles: Admin, Waiter, Kitchen, Cashier
- Default credentials for development:
  - admin/password
  - waiter/password
  - kitchen/password
  - cashier/password

### Payment Integration
Supports multiple gateways:
- Stripe
- PayPal
- iyzico (Turkish gateway)

### Key Features to Remember
1. **PWA Support** - Service workers, web push notifications
2. **QR Code Tables** - Each table has a unique QR code
3. **Stock Management** - Automatic deduction on orders
4. **Report Templates** - Customizable reporting system
5. **Campaign Management** - Marketing campaigns with time ranges
6. **Invoice Generation** - PDF invoices for orders

### Development Tips
- Frontend proxies API calls to backend on port 3000
- Database synchronizes automatically in development
- WebSocket connections require special handling in components
- Use existing patterns when adding new modules/features
- Check existing components before creating new ones