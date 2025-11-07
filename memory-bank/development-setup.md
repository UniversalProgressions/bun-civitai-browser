# Development Setup Guide

This guide provides step-by-step instructions for setting up the CivitAI Model Browser development environment.

## Prerequisites

Before starting, ensure you have the following installed:

- **Bun**: Latest stable version (recommended for optimal performance)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions
- **Gopeed**: Download manager application (optional for testing)

### Required Extensions (VS Code)

- **Tailwind CSS IntelliSense**: CSS framework support
- **Prisma**: Database tooling
- **TypeScript**: TypeScript support

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bun-civitai-browser.git
cd bun-civitai-browser
```

### 2. Install Dependencies

Using Bun (recommended):

```bash
bun install
```

### 3. Set Up Database

The application uses SQLite with Prisma ORM. Set up the database:

```bash
# Generate Prisma client
bun run prisma:generate

# Run database migrations
bun run prisma:migrate
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database URL (SQLite)
DATABASE_URL="file:./db.sqlite3"

# CivitAI API Token (optional, for higher rate limits)
CIVITAI_TOKEN="your-civitai-token-here"

# Gopeed Server URL (default: http://localhost:9999)
GOPEED_SERVER_URL="http://localhost:9999"

# HTTP Proxy (optional)
HTTP_PROXY="http://proxy:port"
```

### 5. Verify Installation

Run the following commands to verify everything is set up correctly:

```bash
# Check Prisma schema
bun run prisma:generate

# Run tests (if available)
bun test
```

## Development

### Starting the Development Server

The application has separate development servers for frontend and backend:

#### Backend Development Server

```bash
# Start Elysia backend with hot reload
bun run dev:server
```

The backend will be available at `http://localhost:3000`

#### Frontend Development Server

In a separate terminal:

```bash
# Start Vite frontend with hot reload
bun run dev:client
```

The frontend will be available at `http://localhost:5173`

### Development Workflow

#### 1. Making Changes

- **Backend Changes**: Edit files in `src/modules/`
- **Frontend Changes**: Edit files in `src/html/`
- **Database Changes**: Edit `schema.prisma` and run migrations

#### 2. Database Schema Changes

When modifying the database schema:

```bash
# 1. Update schema.prisma
# Edit the schema file

# 2. Create migration
bun run prisma:migrate

# 3. Generate client
bun run prisma:generate

# 4. Reset database (if needed)
bun run prisma:reset
```

#### 3. Type Safety

The project uses comprehensive type safety:

- **Backend**: Arktype for runtime validation
- **Database**: Prisma generated types
- **Frontend**: TypeScript with EdenTreaty for API types

After making API changes:

```bash
# Restart development servers to pick up type changes
# The EdenTreaty types will be regenerated automatically
```

#### 4. Testing Local Models

To test with local models:

1. **Configure Base Path**:

   ```bash
   # In the application settings, set your models directory
   # e.g., /path/to/your/models
   ```

2. **Place Model Files**:

   ```
   /your/models/
   ├── Checkpoint/
   │   ├── 12345_model-name/
   │   │   ├── 67890_version-name/
   │   │   │   ├── files/
   │   │   │   │   └── model.safetensors
   │   │   │   └── preview/
   │   │   │       └── preview.jpg
   ```

3. **Scan Models**:
   ```bash
   # Use the scan button in the UI or API endpoint
   # HEAD /civitai/local/scanModels
   ```

### Development Tools

#### Prisma Studio

Browse and manage your database:

```bash
npx prisma studio
```

#### API Documentation

The application uses OpenAPI documentation:

```bash
# Access Swagger UI at
http://localhost:3000/swagger
```

#### Database Inspector

Inspect the SQLite database:

```bash
# Using sqlite3 CLI
sqlite3 db.sqlite3

# Or use a GUI tool like DB Browser for SQLite
```

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/modules/civitai/index.test.ts
```

### Writing Tests

#### Backend Tests

Example test structure:

```typescript
// src/modules/civitai/index.test.ts
import { describe, it, expect } from "bun:test";
import { app } from "./index";

describe("CivitAI Module", () => {
  it("should return local models", async () => {
    const response = await app.handle(
      new Request("http://localhost/civitai/local/models/pagination")
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.records)).toBe(true);
  });
});
```

#### Frontend Tests

UI only response for logic operation and invoke server actions via EdenTreaty to avoid complex issue and problem, only responsible for UI describing for better DX.

## Common Development Tasks

### Adding New API Endpoints

1. **Define Types**:

   ```typescript
   // src/modules/civitai/models/new_endpoint.ts
   import { type } from "arktype";

   export const new_request = type({
     // Request schema
   });

   export const new_response = type({
     // Response schema
   });
   ```

2. **Create Endpoint**:

   ```typescript
   // src/modules/civitai/index/new_endpoint.ts
   import { Elysia, t } from "elysia";
   import { new_request, new_response } from "../models/new_endpoint";

   export default new Elysia().get(
     "/new-endpoint",
     async ({ query }) => {
       // Implementation
     },
     {
       query: new_request,
       response: new_response,
     }
   );
   ```

3. **Register Endpoint**:

   ```typescript
   // src/modules/civitai/index/index.ts
   import newEndpoint from "./new_endpoint";

   export default new Elysia({ prefix: "/civitai" }).use(newEndpoint);
   ```

### Adding New Frontend Components

1. **Create Component**:

   ```typescript
   // src/html/components/NewComponent.tsx
   import React from 'react';

   const NewComponent: React.FC = () => {
     return <div>New Component</div>;
   };

   export default NewComponent;
   ```

2. **Use Component**:

   ```typescript
   // src/html/pages/PageUsingComponent.tsx
   import NewComponent from '../components/NewComponent';

   const PageUsingComponent = () => {
     return <NewComponent />;
   };
   ```

## Deployment

### Building for Production

```bash
# Build frontend
bun run build:client

# The backend is ready for production with Bun
# No separate build step needed
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check if database file exists
ls -la db.sqlite3

# Reset database
bun run prisma:reset

# Check database permissions
chmod 644 db.sqlite3
```

#### 2. Type Errors

```bash
# Regenerate types
bun run prisma:generate

# Clear TypeScript cache
rm -rf .tsbuildinfo
npx tsc --noEmit
```

#### 3. Port Conflicts

```bash
# Check what's running on port 3000
lsof -i :3000

# Kill process on port 3000
kill -9 <PID>
```

#### 4. Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules
bun install

# Update packages
bun update
```

### Getting Help

- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check the memory-bank folder
- **API Reference**: Visit `/swagger` when server is running

## Contributing

### Code Style

- Use TypeScript strict mode
- Use Prettier for formatting
- Write meaningful commit messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit pull request

## Performance Optimization

### Development Performance

```bash
# Use Bun for faster package management
bun install

# Enable fast refresh in development
# The development servers are already optimized
```

### Build Performance

```bash
# Optimize frontend build
bun run build:client -- --mode production

# Use Bun for production runtime
bun run src/index.ts
```

This setup guide should get you up and running with the CivitAI Model Browser development environment. For additional questions, refer to the project documentation or open an issue.
