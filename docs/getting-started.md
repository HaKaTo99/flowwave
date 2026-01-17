# Getting Started with FlowWave

This guide will help you set up and run FlowWave on your local machine.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/flowwave.git
cd flowwave
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies for the monorepo including:
- Frontend (React + Vite)
- Backend (Fastify)
- All packages (core-engine, connectors, auth, etc.)

### 3. Setup Database

FlowWave uses SQLite by default (no external database required).

```bash
# Generate Prisma client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Create database and tables
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

### 4. Start Development Server

```bash
npm run dev
```

This starts both:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Your First Workflow

### 1. Open the Designer

Navigate to http://localhost:3000 in your browser.

### 2. Add Nodes

Drag nodes from the sidebar onto the canvas:
- **HTTP Request** - Make API calls
- **Delay** - Pause execution
- **Condition** - Add logic
- **Debug** - Log data

### 3. Connect Nodes

Click and drag from a node's output handle to another node's input handle.

### 4. Configure Nodes

Click a node to open the properties panel on the right. Configure:
- URL for HTTP requests
- Duration for delays
- Conditions for branching

### 5. Save & Run

1. Click **Save** to persist your workflow
2. Click **Run** to execute it
3. Click **History** to view execution results

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=file:./data/flowwave.db

# Server
PORT=3001
HOST=0.0.0.0

# Security (change in production!)
JWT_SECRET=your-secret-key
```

## Next Steps

- [API Documentation](api/README.md)
- [Creating Custom Nodes](development/custom-nodes.md)
- [Deployment Guide](deployment/README.md)

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port in vite.config.ts
```

### Database Issues

```bash
# Reset database
rm packages/database/prisma/dev.db
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

### Dependencies Not Found

```bash
# Clean install
rm -rf node_modules
npm install
```
