# Technical Architecture: CivitAI Model Browser

## Backend Architecture

### Elysia Framework Structure

The backend follows Elysia's best practices with modular organization:

```
src/modules/
├── civitai/
│   ├── index/
│   │   ├── index.ts          # Main router with prefix /civitai
│   │   ├── civitai.tsx       # CivitAI API integration
│   │   ├── local.ts          # Local model management
│   │   └── db.ts             # Database operations
│   ├── models/
│   │   ├── models_endpoint.ts     # Model type definitions
│   │   ├── modelId_endpoint.ts    # Individual model types
│   │   ├── creators_endpoint.ts   # Creator types
│   │   └── baseModels/
│   │       └── misc.ts       # Enum and type definitions
│   └── service/
│       ├── localModels.ts    # Local file system operations
│       ├── fileLayout.ts     # File organization logic
│       ├── utils.ts          # Utility functions
│       └── crud/            # CRUD operations for each model
├── db/
│   └── service.ts           # Database connection and setup
└── settings/
    ├── index.ts             # Settings router
    ├── models.ts            # Settings type definitions
    └── service.ts          # Settings management
```

### API Endpoint Design

All endpoints follow RESTful conventions with type-safe validation:

```typescript
// Example endpoint structure
export default new Elysia()
  .get(
    "/models",
    async ({ query }) => {
      // Implementation
    },
    {
      query: models_request_opts,
      response: models_response,
    }
  )
  .post(
    "/models/:modelId",
    async ({ params, body }) => {
      // Implementation
    },
    {
      params: t.Object({ modelId: t.Numeric() }),
      body: model_request_body,
      response: model_response,
    }
  );
```

### Database Layer

Prisma ORM with SQLite provides type-safe database operations:

```typescript
// Generated client usage
import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

// Example CRUD operation
export async function getModelById(id: number) {
  return await prisma.model.findUnique({
    where: { id },
    include: {
      modelVersions: {
        include: {
          files: true,
          images: true,
        },
      },
      creator: true,
      tags: true,
      type: true,
    },
  });
}
```

## Frontend Architecture

### React Component Structure

Components are organized by feature with clear separation of concerns:

```
src/html/
├── components/
│   └── shadowHTML.tsx      # Reusable shadow DOM component
├── pages/
│   ├── localModelsGallery.tsx    # Local models browsing
│   ├── settingsPanel.tsx         # Application settings
│   └── civitaiModelsGallery-deprecated.tsx  # Legacy component
├── layout.tsx             # Main application layout
├── main.tsx              # Application entry point
├── styles.css            # Global styles
└── utils.ts              # Frontend utilities
```

### State Management

Jotai provides atomic state management with TypeScript support:

```typescript
// Example atoms for state management
export const modelsAtom = atom<Array<ModelWithAllRelations>>([]);
export const searchOptionsAtom = atom<ModelsRequestOpts>({});
export const isLoadingAtom = atom(false);

// Derived atoms for computed state
export const filteredModelsAtom = atom((get) =>
  get(modelsAtom).filter((model) =>
    model.name.includes(get(searchOptionsAtom).query || "")
  )
);
```

### API Communication

EdenTreaty ensures type-safe communication between frontend and backend:

```typescript
// Generated client usage
import { edenTreaty } from "./utils";

// Type-safe API calls
const { data, error } =
  await edenTreaty.civitai.local.models.pagination.post(searchOptions);

if (error) {
  // Handle error with full type safety
} else {
  // Use data with full type safety
}
```

## External Service Integration

### CivitAI API Integration

```typescript
// Service for CivitAI API communication
export class CivitAIService {
  private baseUrl = "https://civitai.com/api/v1";
  private token: string;

  async getModelById(modelId: number): Promise<ModelId_ModelId> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.json();
  }

  async searchModels(options: ModelsRequestOpts): Promise<ModelsResponse> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });

    const response = await fetch(`${this.baseUrl}/models?${params}`);
    return response.json();
  }
}
```

### Gopeed API Integration (need for update)

```typescript
// Service for Gopeed API communication using official SDK
import { Rest } from "@gopeed/rest";

export class GopeedService {
  private client: Rest;

  constructor(serverUrl: string = "http://localhost:9999") {
    this.client = new Rest({ serverUrl });
  }

  async createTask(task: GopeedTaskRequest): Promise<GopeedTask> {
    return await this.client.createTask(task);
  }

  async getTaskStatus(taskId: string): Promise<GopeedTaskStatus> {
    return await this.client.getTask(taskId);
  }

  async pauseTask(taskId: string): Promise<void> {
    await this.client.pauseTask(taskId);
  }

  async resumeTask(taskId: string): Promise<void> {
    await this.client.resumeTask(taskId);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.client.deleteTask(taskId);
  }

  async getAllTasks(): Promise<GopeedTask[]> {
    return await this.client.getTasks();
  }

  async getTaskStats(): Promise<GopeedTaskStats> {
    return await this.client.getStats();
  }
}

// Type definitions for Gopeed API
export interface GopeedTaskRequest {
  url: string;
  name?: string;
  path?: string;
  extra?: Record<string, any>;
}

export interface GopeedTask {
  id: string;
  url: string;
  name: string;
  path: string;
  size: number;
  downloaded: number;
  status: "ready" | "running" | "paused" | "done" | "error" | "cancel";
  createdAt: string;
  updatedAt: string;
  extra?: Record<string, any>;
}

export interface GopeedTaskStatus {
  id: string;
  url: string;
  name: string;
  path: string;
  size: number;
  downloaded: number;
  status: "ready" | "running" | "paused" | "done" | "error" | "cancel";
  progress: number;
  speed: number;
  createdAt: string;
  updatedAt: string;
  extra?: Record<string, any>;
}

export interface GopeedTaskStats {
  total: number;
  running: number;
  paused: number;
  done: number;
  error: number;
  cancel: number;
}
```

## Type System

### Comprehensive Type Definitions

The application uses Arktype for runtime type validation:

```typescript
// Example type definitions
export const model = type({
  id: "number.integer",
  name: "string",
  description: "string | null",
  type: model_types,
  nsfw: "boolean",
  nsfwLevel: "number.integer",
  creator: "creator | null",
  stats: {
    downloadCount: "number.integer",
    favoriteCount: "number.integer",
    // ... other stats
  },
  tags: "string[]",
  modelVersions: model_version.array(),
});

// Generated TypeScript types
export type Model = typeof model.infer;
```

### Database Type Integration

Prisma generates TypeScript types that integrate with the API types:

```typescript
// Extended model types with relations
export type ModelWithAllRelations = Model & {
  modelVersions: (ModelVersion & {
    files: ModelVersionFile[];
    images: ModelVersionImage[];
    baseModel: BaseModel;
    baseModelType: BaseModelType | null;
  })[];
  creator: Creator | null;
  type: ModelType;
  tags: Tag[];
};
```

## File System Organization

### Local Model Storage

```
/models/
├── [modelType]/
│   ├── [modelId]_[modelName]/
│   │   ├── [versionId]_[versionName]/
│   │   │   ├── files/
│   │   │   │   ├── [fileId]_[fileName].safetensors
│   │   │   │   └── [fileId]_[fileName].png
│   │   │   └── preview/
│   │   │       └── [imageId]_[imageHash].jpg
│   │   └── model.json
│   └── ...
└── ...
```

### Preview and Media Handling

```typescript
// Service for file operations
export class FileService {
  async generatePreview(modelId: number, versionId: number): Promise<string> {
    // Generate preview image from model files
  }

  async organizeFiles(
    files: ModelVersionFile[],
    basePath: string
  ): Promise<void> {
    // Organize downloaded files into proper directory structure
  }

  async validateModelFile(filePath: string): Promise<boolean> {
    // Validate downloaded model file integrity
  }
}
```

## Error Handling Strategy

### Unified Error Handling

```typescript
// Custom error types
export class CivitAIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

export class GopeedError extends Error {
  constructor(
    message: string,
    public taskId?: string,
    public details?: any
  ) {
    super(message);
  }
}

// Error boundary component
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }
}
```

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields
- Efficient include statements for relations
- Pagination for large result sets
- Connection pooling for SQLite

### Frontend Optimization

- Virtual scrolling for large model lists
- Image lazy loading and compression
- Debounced search inputs
- Memoization for expensive computations

### API Optimization

- Request caching for frequently accessed data
- Rate limiting for external API calls
- Batch operations for bulk updates
- Streaming responses for large datasets
