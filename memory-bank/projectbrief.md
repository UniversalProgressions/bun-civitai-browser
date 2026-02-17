# Project Brief: bun-civitai-browser

## 1. Project Vision & Goals

**Vision**: Create an open-source, desktop-grade web application for AI enthusiasts and creators to seamlessly browse, download, and manage AI models from Civitai with a focus on performance, offline capability, and user experience.

**Primary Goals**:
- Provide a fast, responsive interface for browsing Civitai's extensive model library
- Enable reliable model downloads with progress tracking and resume capability
- Offer local model management with metadata preservation
- Support offline browsing of cached/downloaded models
- Maintain data privacy with local-first architecture

## 2. Current Technical Architecture

### Core Technology Stack
- **Runtime**: Bun (v1.x) - High-performance JavaScript/TypeScript runtime
- **Backend Framework**: Elysia.js - Fast, type-safe web framework with OpenAPI support
- **Frontend**: React 19 + TypeScript + Vite build system
- **UI Framework**: Ant Design v6 component library + Tailwind CSS v4 for styling
- **Database**: SQLite with Prisma ORM for local data persistence
- **State Management**: 
  - Jotai for client-side atomic state
  - React Query (TanStack Query) for server state and caching
- **Validation**: Arktype for runtime type validation
- **Download Management**: @gopeed/rest for reliable file downloads

## 3. Application Structure

```
bun-civitai-browser/
├── src/
│   ├── index.ts              # Main Elysia server entry point
│   ├── dev.ts               # Development server configuration
│   ├── html/                # Frontend application
│   │   ├── index.html      # HTML entry point
│   │   ├── main.tsx        # React application entry
│   │   ├── layout.tsx      # Main application layout with tab navigation
│   │   ├── styles.css      # Global styles
│   │   ├── utils.ts        # Frontend utilities
│   │   ├── components/     # Reusable React components
│   │   │   ├── gallery.tsx
│   │   │   └── shadowHTML.tsx
│   │   └── pages/          # Application pages
│   │       ├── civitaiModelsGallery.tsx
│   │       ├── localModelsGallery.tsx
│   │       ├── downloadPanel.tsx
│   │       ├── settingsPanel.tsx
│   │       └── galleryTestPage.tsx
│   └── modules/            # Backend modules
│       ├── civitai/        # Civitai API integration
│       │   ├── index/      # API route definitions
│       │   ├── models/     # Type definitions and API schemas
│       │   └── service/    # Business logic and utilities
│       ├── db/            # Database service layer
│       └── settings/      # Application settings management
├── schema.prisma          # Prisma database schema
├── migrations/           # Database migration files
├── public/              # Built frontend assets (generated)
└── memory-bank/         # Project documentation
```

## 4. Database Schema Overview

The application uses a comprehensive schema to model Civitai's data structure:

### Core Entities
- **Creator**: Model authors with username, profile image, and external links
- **Model**: Primary model entity with name, type, NSFW classification, and metadata
- **ModelType**: Classification categories (Checkpoint, LoRA, TextualInversion, ControlNet, etc.)
- **Tag**: Searchable model tags for categorization and discovery
- **ModelVersion**: Specific versions of models with base model information and publication dates
- **ModelVersionFile**: Downloadable files with size, type, and download URLs
- **ModelVersionImage**: Preview images with dimensions, hashes, and NSFW levels
- **BaseModel** & **BaseModelType**: Foundation models (SD 1.5, SDXL, Flux, Pony, etc.)

### Key Relationships
- Models belong to Creators and have ModelTypes
- Models have multiple ModelVersions
- ModelVersions contain Files and Images
- Models can have multiple Tags for categorization
- BaseModels have hierarchical BaseModelTypes

## 5. Current Feature Set

### Implemented Features
- ✅ **Civitai API Integration**: Full mirroring of Civitai API with local caching
- ✅ **Model Browsing**: Gallery views with pagination and basic filtering
- ✅ **Local Model Management**: Scan, organize, and browse downloaded models
- ✅ **Download Management**: Queue-based downloads with progress tracking
- ✅ **Settings System**: Configurable download paths, API keys, and preferences
- ✅ **OpenAPI Documentation**: Auto-generated API docs at `/swagger`
- ✅ **Responsive UI**: Ant Design components with Tailwind CSS styling
- ✅ **Type Safety**: Full TypeScript coverage with Prisma-generated types
- ✅ **Development Tools**: Hot reload, proxy configuration for seamless development

### Features in Development
- 🔄 **Advanced Search**: Filtering by model type, base model, tags, and NSFW level
- 🔄 **Batch Operations**: Bulk download, delete, and tagging
- 🔄 **Model Comparison**: Side-by-side version comparison
- 🔄 **Automated Updates**: Scheduled metadata synchronization
- 🔄 **Export/Import**: Backup and restore model collections

## 6. Development Workflow

### Available Scripts
```bash
# Development
bun run dev:client      # Start Vite dev server (port 5173)
bun run dev:server      # Start Elysia backend with watch mode (port 3000)

# Building
bun run build:client    # Build frontend to public/ directory

# Database Operations
bun run prisma:generate # Generate Prisma client types
bun run prisma:migrate  # Run database migrations
bun run prisma:reset    # Reset database (development only)
```

### Build Process
1. Frontend assets are built with Vite to the `public/` directory
2. Elysia backend serves static files from `public/` at root path
3. API routes are prefixed:
   - `/civitai/*` - Civitai-related endpoints
   - `/settings/*` - Application settings
4. Development proxy configured for seamless local development
5. TypeScript strict mode ensures type safety throughout

## 7. Refactoring Considerations & Technical Debt

### Architectural Improvements Needed
1. **Module Consolidation**: Simplify the nested module structure in `src/modules/civitai/`
2. **Error Handling Strategy**: Implement consistent error boundaries, logging, and user feedback
3. **State Management Review**: Evaluate and potentially consolidate Jotai and React Query usage patterns
4. **Type Safety Enhancement**: Better leverage Arktype for runtime validation
5. **Testing Strategy**: Expand test coverage beyond current unit tests to include integration and E2E tests

### Current Technical Debt
- **Dual Dev Servers**: Separate development servers for client and server could be unified
- **Type Duplication**: Some type definitions are duplicated across modules
- **Error Handling**: Limited error handling in API routes and frontend components
- **Configuration Management**: Settings scattered across multiple files

### Performance Considerations
- **Database Optimization**: Indexes exist but query patterns need analysis
- **Image Loading**: Gallery performance with many high-resolution images
- **Memory Usage**: Long-running download processes memory management

## 8. Future Roadmap

### Short-term Priorities (Next 3 Months)
- Implement advanced search with comprehensive filters
- Add model tagging and custom categorization
- Improve download reliability with retry logic and resume capability
- Enhance local model scanning performance and accuracy
- Add keyboard shortcuts and accessibility improvements
- Support batch operations (bulk download, delete, etc.)

### Medium-term Goals (3-6 Months)
- Cross-platform desktop application packaging
- Advanced analytics and statistics features (privacy-focused personal usage tracking)

### Long-term Vision (6+ Months)
- Continuous optimization of core functionality performance and user experience
- Extended support for more model formats
- Enhanced offline capabilities and workflow integration

## 9. Success Metrics & Evaluation

### Technical Metrics
- Application startup time < 3 seconds
- Model search response time < 500ms
- Download reliability > 99%
- Test coverage > 80%
- Bundle size < 5MB (gzipped)

### User Experience Metrics
- User retention rate > 40% (weekly active users)
- Task completion rate > 90% for core workflows
- Issue resolution time < 48 hours for critical bugs
- Contributor growth and engagement

**Last Updated**: December 2025  
**Version**: 1.0.50  
**Development Status**: Active Development
