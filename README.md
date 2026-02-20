# bun-civitai-browser

A desktop-grade web application for AI enthusiasts and creators to seamlessly browse, download, and manage AI models from Civitai with a focus on performance, offline capability, and user experience.

## ✨ Features

- 🚀 **High Performance**: Modern technology stack based on Bun and ElysiaJS
- 🔍 **Model Browsing**: Fast, responsive Civitai model browsing interface
- 📥 **Reliable Downloads**: Model downloads with progress tracking and resume capability
- 💾 **Local Management**: Local model management with metadata preservation
- 📱 **Offline Support**: Browse cached/downloaded models offline
- 🔒 **Privacy First**: Local-first architecture for data privacy

## 🛠 Technology Stack

- **Runtime**: Bun - High-performance JavaScript runtime
- **Backend Framework**: ElysiaJS - Type-safe, high-performance web framework
- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Ant Design v6 + Tailwind CSS v4
- **Database**: SQLite + Prisma ORM
- **State Management**: Jotai + TanStack Query
- **Download Management**: @gopeed/rest
- **Type Validation**: Arktype
- **Functional Programming**: Effect-TS for functional programming patterns

## 📁 Project Structure

```
bun-civitai-browser/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── dev.ts               # Development server configuration
│   ├── civitai-api/         # Civitai API type definitions and client
│   ├── html/                # Frontend React application
│   └── modules/             # Backend functional modules
│       ├── civitai/         # Civitai API integration
│       ├── local-models/    # Local model management
│       ├── db/              # Database services
│       ├── gopeed/          # Download management
│       └── settings/        # Application configuration
├── schema.prisma           # Database schema definition
├── prisma.config.ts        # Prisma configuration
└── vite.config.ts          # Vite build configuration
```

## 🚀 Quick Start

### Requirements

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0 (if not using Bun)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/UniversalProgressions/bun-civitai-browser.git
   cd bun-civitai-browser
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env file to set Civitai API key, etc.
   ```

4. **Initialize database**
   ```bash
   bun run prisma:generate
   bun run prisma:migrate
   ```

5. **Start development servers**
   ```bash
   # Start backend server (port 3000)
   bun run dev:server
   
   # In a new terminal, start frontend dev server (port 5173)
   bun run dev:client
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - API Documentation: http://localhost:3000/openapi

## 🔧 Main Features

### Model Download Process

1. **Fetch model JSON data from Civitai**
2. **Select ModelVersion to download**
3. **Determine local storage structure** (using file-layout.ts module)
4. **Create Gopeed download tasks**
5. **Save JSON to database** (modelVersions set to empty array in Model.json)
6. **Download files to local directory**
7. **Record download status in database**

### File Storage Layout

```
{basePath}/{modelType}/{modelId}/{modelId}.api-info.json
{basePath}/{modelType}/{modelId}/{versionId}/files/{fileName}.xxx
{basePath}/{modelType}/{modelId}/{versionId}/{versionId}.api-info.json
{basePath}/{modelType}/{modelId}/{versionId}/media/{imageId}.xxx
```

### Gopeed Integration

- **Responsibility Separation**: Download concurrency, queue management, and retry logic handled entirely by Gopeed
- **Status Monitoring**: Application layer provides task status query interface
- **Frontend Integration**: WebUI displays download progress, users can manually retry
- **Error Recovery**: Metadata can be re-fetched from Civitai using ModelVersion ID

## 📊 Database Design

### Schema Design Principles

- **Deduplicated Storage**: `modelVersions` field in Model table JSON set to empty array
- **Complete Relationships**: Foreign key relationships between Model and ModelVersion
- **JSON Fields**: Store original API responses for data integrity
- **Index Optimization**: Indexes on key query fields

### Data Recovery Strategy

- **Primary Recovery Path**: Re-fetch metadata from Civitai using ModelVersion ID
- **File System Scanning**: Partial information can be rebuilt from local file structure
- **Known Limitations**: SQLite database corruption may cause metadata loss
- **Mitigation**: File paths contain enough information to re-fetch data

## 📖 API Documentation

### Main Endpoints

- `GET /civitai_api/v1/models` - Browse Civitai models
- `POST /civitai_api/v1/download/model-version` - Download model version
- `GET /local-models/models/on-disk` - Query local models
- `GET /settings` - Get application settings
- `GET /openapi` - Elysia OpenAPI documentation (development mode)

### Development Commands

```bash
# Development servers
bun run dev:server      # Start backend dev server (port 3000)
bun run dev:client      # Start frontend dev server (port 5173)

# Build
bun run build:client    # Build frontend to public/ directory

# Database operations
bun run prisma:generate # Generate Prisma client types
bun run prisma:migrate  # Run database migrations
bun run prisma:reset    # Reset database (development only)
```

## 🎯 Development Standards

### Effect-TS Functional Programming

This project follows Effect-TS patterns for functional programming:

- **Services**: Use `Effect.Service` with `accessors: true` for business logic
- **Errors**: Use `Schema.TaggedError` for type-safe, descriptive error handling
- **Layers**: Declare dependencies in services, use `Layer.mergeAll` for composition
- **Atoms**: Use Effect Atoms for frontend state management
- **Configuration**: Use `Config.*` instead of direct `process.env` access
- **Logging**: Use `Effect.log` with structured data instead of `console.log`

### English-Only Policy

All code, documentation, and communication must be in English:
- Variable/function names must use English words only
- Comments and documentation must be in English
- Error messages and logs must be in English
- UI strings and user messages must be in English

See [memory-bank/coding-standards.md](memory-bank/coding-standards.md) and [memory-bank/language-policy.md](memory-bank/language-policy.md) for detailed standards.

## 🎯 Future Roadmap

### Short-term Goals (1-3 months)
- Implement advanced search and filtering
- Add model tagging and custom categorization
- Improve download reliability and recovery mechanisms
- Enhance local model scanning performance
- Support batch operations (bulk download, delete, etc.)

### Medium-term Goals (3-6 months)
- Cross-platform desktop application packaging
- Advanced analytics and statistics features (privacy-focused personal usage tracking)

### Long-term Vision (6+ months)
- Continuous optimization of core functionality performance and user experience
- Extended support for more model formats
- Enhanced offline capabilities and workflow integration

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📞 Support

If you encounter issues:
1. Check the detailed documentation in the [memory-bank/](memory-bank/) directory
2. Create an Issue in the GitHub repository
3. Reference the implemented [example code](src/civitai-api/v1/examples/)

---

**Version**: 1.0.50  
**Status**: Active Development  
**Last Updated**: February 2026
