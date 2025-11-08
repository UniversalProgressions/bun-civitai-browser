# System Patterns: CivitAI Model Browser

## System Architecture

Fullstack application with modular backend services and React frontend, using type-safe API communication via Elysia EdenTreaty.

```
Frontend (React) ←→ EdenTreaty (Type-safe API) ←→ Backend (Elysia) ←→ Database (SQLite)
                                     ↓
                                Gopeed API
```

## Key Technical Decisions

### Frontend
- **React**: Component-based UI framework
- **Antd**: UI component library for consistent design
- **Jotai**: Atomic state management for global and local state
- **TailwindCSS**: Utility-first CSS framework for styling

### Backend
- **Bun.js**: Modern JavaScript runtime replacing Node.js for improved performance
- **Elysia.js**: Web server framework with OpenAPI/Swagger documentation and EdenTreaty for fully type-safe frontend-backend communication
- **Arktype**: Runtime data validation and type checking
- **Prisma**: Type-safe ORM for SQLite database operations

## Design Patterns in Use

### API Communication
- **EdenTreaty Pattern**: Type-safe API client generation from Elysia backend routes
- **RESTful API**: Standard HTTP methods for CRUD operations

### State Management
- **Atomic State Pattern**: Using Jotai atoms for granular state management
- **Query Pattern**: React Query for server state synchronization and caching

### Data Flow
- **Repository Pattern**: Service layers abstract database operations via Prisma
- **Dependency Injection**: Modular service composition in backend modules

### UI Architecture
- **Component Composition**: Reusable React components with Antd integration
- **Container-Presenter Pattern**: Separation of logic and presentation in components

## Component Relationships

### Backend Modules
- **CivitAI Module**: Handles external API integration and model data processing
- **DB Module**: Centralized database service with Prisma client
- **Settings Module**: Application configuration management

### Frontend Structure
- **Pages**: Top-level route components (LocalModelsGallery, SettingsPanel)
- **Components**: Reusable UI elements (shadowHTML components)
- **Services**: API clients and utilities for external communication

### Data Flow
1. User actions trigger state updates via Jotai atoms
2. React Query manages API calls through EdenTreaty client
3. Backend services process requests using Prisma for database operations
4. Responses flow back through type-safe API layer to update UI state
