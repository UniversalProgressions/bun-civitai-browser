# Project Brief: CivitAI Model Browser

## Overview

This is a fullstack application for downloading, managing, and browsing models downloaded from CivitAI. The application focuses on local model management and browsing capabilities, with download task submission integrated with Gopeed for actual file downloading.

## Architecture

### Technology Stack

- **Runtime**: Bun.js
- **Backend**: Elysia framework
- **Database**: Prisma ORM with SQLite
- **Frontend**: React with TypeScript
- **UI Components**: Ant Design (Antd)
- **State Management**: Jotai
- **Styling**: TailwindCSS
- **Communication**: Elysia's EdenTreaty for type-safe communication
- **Download Service**: Gopeed API integration

### Project Structure

```
src/
├── modules/           # Backend modules
│   ├── civitai/      # CivitAI-related functionality
│   ├── db/           # Database service
│   └── settings/     # Application settings
├── html/             # Frontend React application
│   ├── components/   # Reusable components
│   ├── pages/        # Page components
│   └── utils.ts      # Frontend utilities
├── index.ts          # Main backend entry point
└── dev.ts            # Development server
```

## Core Features

### 1. Local Model Management

- Scan and index downloaded models from local storage
- Organize models by type, creator, tags, and metadata
- Search and filter capabilities for local models
- Model preview with images and descriptions

### 2. Download Task Submission

- Interface to submit CivitAI model IDs or URLs
- Fetch model information from CivitAI API
- Select specific files and versions for download
- Create download tasks in Gopeed via API

### 3. Download Status Tracking

- Monitor download progress through Gopeed API
- Task management (pause, resume, cancel)
- Download history and statistics
- Notifications for download status changes

### 4. Settings Management

- Configure local model storage path
- CivitAI API token management
- Gopeed server configuration
- Proxy settings for API access

## Database Schema

The application uses Prisma with SQLite, featuring models for:

- **Model**: Main model information
- **ModelVersion**: Different versions of models
- **ModelVersionFile**: Individual files within versions
- **ModelVersionImage**: Preview images
- **Creator**: Model creators
- **ModelType**: Model categories
- **Tag**: Model tags
- **BaseModel**: Base model types
- **BaseModelType**: Base model subtypes

## API Integration

- **CivitAI API**: Fetch model metadata, versions, and file information
- **Gopeed API**: Create and manage download tasks, track progress

## User Interface

- **Local Models Gallery**: Browse and manage downloaded models
- **Download Panel**: Submit new download tasks
- **Settings Panel**: Configure application settings
- **Modal Dialogs**: Model details, search filters, task management

## Key Design Principles

- **Type Safety**: Full end-to-end TypeScript with EdenTreaty
- **Modular Architecture**: Clear separation between backend and frontend
- **External Service Integration**: Leverage Gopeed for robust downloading
- **User Experience**: Intuitive interface with comprehensive search and filtering
- **Performance**: Efficient local model scanning and indexing

## Development Workflow

- Development server with hot reload for both frontend and backend
- Prisma migrations for database schema management
- Type-safe API communication between frontend and backend
- Comprehensive testing framework setup
