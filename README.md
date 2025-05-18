# Restaurant Management System

A comprehensive restaurant management system designed for small to medium-sized restaurants. This system helps manage orders, tables, menu items, kitchen operations, payments, and inventory.

## 🎯 Target Users

- Small to medium-sized restaurants
- Single branch operations
- Multiple roles: Admin, Waiter, Kitchen Staff, Cashier

## 🧱 Features

- 🔐 **Auth & User Management**
  - Role-based access control (admin, waiter, kitchen, cashier)
  - Secure authentication with JWT
  - User profile management

- 📋 **Menu Management**
  - Product categories organization
  - Menu items with prices and descriptions
  - Stock status tracking
  - Image support for menu items

- 🧾 **Order Management**
  - Table selection
  - Adding/removing items to orders
  - Order status tracking (pending, preparing, ready, served, completed)
  - Order history and search

- 🧑‍🍳 **Kitchen Panel**
  - Real-time view of pending orders
  - Update preparation status
  - Prioritize orders
  - Mark items as ready

- 🪑 **Table Management**
  - Table status tracking (available, occupied, reserved)
  - Table assignment
  - View active orders by table
  - Table capacity management

- 💸 **Payment Processing**
  - Multiple payment methods (cash, credit card, debit card)
  - Bill generation
  - Payment history
  - Refund handling

- 📊 **Dashboard**
  - Sales statistics (daily, weekly, monthly)
  - Order status overview
  - Popular items tracking
  - Low stock alerts

- 📦 **Stock Tracking**
  - Automatic stock reduction on order
  - Manual stock adjustment
  - Low stock alerts
  - Stock history tracking

## ⚙️ Technology Stack

### Backend
- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications
- **PostgreSQL**: Powerful, open-source object-relational database system
- **Redis**: In-memory data structure store used for caching and real-time features
- **TypeORM**: ORM for TypeScript and JavaScript
- **Socket.IO**: Real-time bidirectional event-based communication
- **JWT**: JSON Web Tokens for secure authentication
- **Passport**: Authentication middleware for Node.js

### Frontend
- **React**: A JavaScript library for building user interfaces
- **Vite**: Next generation frontend tooling
- **Zustand**: A small, fast and scalable state-management solution
- **Tailwind CSS**: A utility-first CSS framework
- **React Router**: Declarative routing for React
- **Axios**: Promise based HTTP client
- **Socket.IO Client**: Real-time communication with the server
- **Heroicons**: Beautiful hand-crafted SVG icons

### Deployment
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container Docker applications
- **Nginx**: High-performance HTTP server and reverse proxy

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Docker and Docker Compose (for running PostgreSQL and Redis)
- Git

### Installation

#### Option 1: Using the convenience script (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/restaurant-management-system.git
cd restaurant-management-system
```

2. Install all dependencies and start the development environment:
```bash
npm run install:all
npm run start:dev
```

#### Option 2: Manual setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/restaurant-management-system.git
cd restaurant-management-system
```

2. Start the database services:
```bash
docker-compose up -d postgres redis
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

5. Start the backend server:
```bash
cd ../backend
npm run start:dev
```

6. Start the frontend development server:
```bash
cd ../frontend
npm run dev
```

### Accessing the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- API Documentation: http://localhost:3000/api/docs

## 🔑 Default Users

For testing purposes, the following users are available:

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | `admin` | `password` | Full access to all features |
| Waiter | `waiter` | `password` | Orders, tables, menu |
| Kitchen | `kitchen` | `password` | Kitchen panel, orders |
| Cashier | `cashier` | `password` | Payments, orders |

## 🐳 Docker Deployment

To deploy the application using Docker:

```bash
# Build the Docker images
npm run docker:build

# Start the containers
npm run docker:up

# View logs
npm run docker:logs

# Stop the containers
npm run docker:down
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

## 🛠️ Development

```bash
# Lint the code
npm run lint

# Format the code
npm run format

# Build for production
npm run build
```

## 📁 Project Structure

```
restaurant-management-system/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── menu/            # Menu management module
│   │   ├── order/           # Order management module
│   │   ├── kitchen/         # Kitchen panel module
│   │   ├── table/           # Table management module
│   │   ├── payment/         # Payment processing module
│   │   ├── dashboard/       # Dashboard module
│   │   ├── stock/           # Stock tracking module
│   │   ├── events/          # Socket.IO events
│   │   ├── app.module.ts    # Main application module
│   │   └── main.ts          # Application entry point
│   └── ...
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state management
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Application entry point
│   └── ...
├── docker/                  # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── package.json             # Root package.json with scripts
└── README.md                # Project documentation
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
