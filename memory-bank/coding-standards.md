# Effect-TS Coding Standards

## Overview

This document defines the coding standards for the bun-civitai-browser project using Effect-TS. All new code must follow these patterns, and existing code should be gradually refactored to comply.

## Core Principles

1. **Type Safety First**: Leverage TypeScript's type system and Effect-TS's type-level guarantees
2. **Functional Programming**: Prefer pure functions, immutable data, and effectful computations
3. **Explicit Dependencies**: All dependencies must be declared and provided via Layers
4. **Explicit Errors**: Every distinct failure mode must have its own error type
5. **Observability**: Use structured logging, metrics, and tracing throughout

## 1. Service Definition Pattern

### Basic Service Structure

```typescript
import { Effect, Schema } from "effect"

// Always define branded IDs
export const ModelId = Schema.UUID.pipe(Schema.brand("@App/ModelId"))
export type ModelId = Schema.Schema.Type<typeof ModelId>

// Define domain errors with Schema.TaggedError
export class ModelNotFoundError extends Schema.TaggedError<ModelNotFoundError>()(
  "ModelNotFoundError",
  {
    modelId: ModelId,
    message: Schema.String,
  },
) {}

// Define service using Effect.Service
export class ModelService extends Effect.Service<ModelService>()("ModelService", {
  accessors: true,
  dependencies: [ModelRepository.Default, CacheService.Default],
  effect: Effect.gen(function* () {
    const repo = yield* ModelRepository
    const cache = yield* CacheService

    // Use Effect.fn for all service methods
    const findById = Effect.fn("ModelService.findById")(function* (id: ModelId) {
      yield* Effect.annotateCurrentSpan("modelId", id)
      
      const cached = yield* cache.get(id)
      if (Option.isSome(cached)) return cached.value

      const model = yield* repo.findById(id)
      yield* cache.set(id, model)
      return model
    })

    const create = Effect.fn("ModelService.create")(function* (data: CreateModelInput) {
      const model = yield* repo.create(data)
      yield* Effect.log("Model created", { modelId: model.id, type: model.type })
      return model
    })

    return { findById, create }
  }),
})
```

### Key Rules
- **Always use `Effect.Service`** for business logic services
- **Never use `Context.Tag`** for business logic (reserved for infrastructure)
- **Declare all dependencies** in the service definition
- **Use `accessors: true`** for convenient accessor generation
- **Wrap all service methods in `Effect.fn`** with descriptive names

## 2. Error Handling

### Error Definition

```typescript
// GOOD: Specific, descriptive errors
export class DownloadFailedError extends Schema.TaggedError<DownloadFailedError>()(
  "DownloadFailedError",
  {
    fileId: FileId,
    reason: Schema.String,
    retryCount: Schema.Number,
    message: Schema.String,
  },
) {}

// BAD: Generic errors (never use)
export class GenericError extends Schema.TaggedError<GenericError>()(
  "GenericError",
  {
    message: Schema.String,  // Too vague!
  },
) {}
```

### Error Handling Patterns

```typescript
// Use catchTag/catchTags for type-safe error handling
yield* downloadFile(fileId).pipe(
  Effect.catchTag("NetworkError", (err) =>
    Effect.fail(new DownloadFailedError({
      fileId,
      reason: "network",
      retryCount: err.retryCount,
      message: `Network error: ${err.message}`,
    }))
  ),
  Effect.catchTag("FileSystemError", (err) =>
    Effect.fail(new DownloadFailedError({
      fileId,
      reason: "filesystem",
      retryCount: 0,
      message: `Filesystem error: ${err.message}`,
    }))
  ),
)

// For multiple error types at once
yield* effect.pipe(
  Effect.catchTags({
    ValidationError: (err) => Effect.fail(new InvalidInputError({ field: err.field, message: err.message })),
    DatabaseError: (err) => Effect.fail(new DatabaseUnavailableError({ operation: err.operation, message: err.message })),
  }),
)
```

### Anti-Patterns (Forbidden)
- ❌ `Effect.catchAll` (loses type information)
- ❌ `Option.getOrThrow` (throws outside Effect)
- ❌ `throw new Error()` inside `Effect.gen`
- ❌ Generic HTTP error classes (`NotFoundError`, `BadRequestError`)

## 3. Schema & Branded Types

### Entity IDs

```typescript
// Always brand entity IDs
export const ModelVersionId = Schema.UUID.pipe(Schema.brand("@App/ModelVersionId"))
export type ModelVersionId = Schema.Schema.Type<typeof ModelVersionId>

export const FileId = Schema.Number.pipe(Schema.brand("@App/FileId"))
export type FileId = Schema.Schema.Type<typeof FileId>

// Use in domain types
export const ModelVersionFile = Schema.Struct({
  id: FileId,
  modelVersionId: ModelVersionId,
  name: Schema.String,
  size: Schema.Number,
  downloadUrl: Schema.String,
})
export type ModelVersionFile = Schema.Schema.Type<typeof ModelVersionFile>
```

### Input Validation

```typescript
export const DownloadRequest = Schema.Struct({
  modelVersionId: ModelVersionId,
  fileIds: Schema.Array(FileId),
  options: Schema.optional(Schema.Struct({
    verifyChecksum: Schema.Boolean,
    concurrentDownloads: Schema.Number.pipe(Schema.between(1, 10)),
  })),
})
export type DownloadRequest = Schema.Schema.Type<typeof DownloadRequest>
```

## 4. Layer Composition

### Service Dependencies

```typescript
// Declare dependencies in service
export class DownloadService extends Effect.Service<DownloadService>()("DownloadService", {
  accessors: true,
  dependencies: [
    ModelService.Default,
    FileService.Default,
    GopeedService.Default,
    SettingsService.Default,
  ],
  effect: Effect.gen(function* () {
    // Dependencies automatically available
    const models = yield* ModelService
    const files = yield* FileService
    const gopeed = yield* GopeedService
    const settings = yield* SettingsService
    // ...
  }),
})
```

### Layer Composition Patterns

```typescript
// Use Layer.mergeAll for flat composition
const ServiceLayer = Layer.mergeAll(
  ModelService.Default,
  DownloadService.Default,
  ScanService.Default,
)

// Use Layer.provideMerge for incremental chaining
const AppLayer = DatabaseLive.pipe(
  Layer.provideMerge(ConfigLive),
  Layer.provideMerge(LoggerLive),
  Layer.provideMerge(CacheLive),
  Layer.provideMerge(ServiceLayer),
)

// Infrastructure layers (not in service dependencies)
const InfrastructureLayer = Layer.mergeAll(
  DatabaseLive,
  RedisLive,
  GopeedClientLive,
)
```

## 5. Effect Atoms (Frontend State)

### Atom Definition

```typescript
import { Atom } from "@effect-atom/atom-react"

// Define atoms outside components
const selectedModelAtom = Atom.make<Option<ModelId>>(Option.none()).pipe(Atom.keepAlive)

// Atom families for entity-specific state
const modelDetailsAtomFamily = Atom.family((modelId: ModelId) =>
  Atom.make<Result<Model, ModelError>>(Result.initial).pipe(Atom.keepAlive)
)
```

### React Integration

```typescript
import { useAtomValue, useAtomSet, Result } from "@effect-atom/atom-react"

function ModelDetails({ modelId }: { modelId: ModelId }) {
  const modelResult = useAtomValue(modelDetailsAtomFamily(modelId))
  
  return Result.builder(modelResult)
    .onInitial(() => <div>Loading model...</div>)
    .onErrorTag("ModelNotFoundError", (err) => (
      <div>Model {err.modelId} not found</div>
    ))
    .onError((error) => <div>Error: {error.message}</div>)
    .onSuccess((model) => (
      <div>
        <h2>{model.name}</h2>
        <p>Type: {model.type}</p>
      </div>
    ))
    .render()
}
```

## 6. Observability

### Structured Logging

```typescript
// Use Effect.log with structured data
yield* Effect.log("Starting download", {
  modelVersionId,
  fileCount: files.length,
  totalSize: files.reduce((sum, f) => sum + f.size, 0),
})

// Log errors with context
yield* Effect.logError("Download failed", {
  modelVersionId,
  fileId,
  error: err._tag,
  retryCount,
})
```

### Metrics

```typescript
const downloadCounter = Metric.counter("downloads_processed")
const downloadDuration = Metric.timer("download_duration")

yield* Metric.increment(downloadCounter)
yield* Metric.trackDuration(downloadDuration, downloadFile(fileId))
```

### Configuration

```typescript
// Use Config for all configuration
const appConfig = Config.all({
  basePath: Config.string("BASE_PATH").pipe(Config.withDefault("./models")),
  civitaiApiKey: Config.redacted("CIVITAI_API_KEY"),
  gopeedHost: Config.string("GOPEED_HOST").pipe(Config.withDefault("http://localhost:9999")),
  maxConcurrentDownloads: Config.integer("MAX_CONCURRENT_DOWNLOADS").pipe(
    Config.withDefault(3),
    Config.validate({ message: "Must be between 1 and 10", validation: (n) => n >= 1 && n <= 10 }),
  ),
})
```

## 7. Testing Patterns

### Service Testing

```typescript
import { TestContext } from "effect"
import { ModelService } from "./ModelService"

describe("ModelService", () => {
  it("should find model by ID", () =>
    Effect.gen(function* () {
      const modelId = ModelId("test-id")
      const testRepo = ModelRepository.of({ findById: () => Effect.succeed(testModel) })
      
      const result = yield* ModelService.findById(modelId).pipe(
        Effect.provide(testRepo),
      )
      
      expect(result.id).toEqual(modelId)
    }).pipe(Effect.runPromise))
})
```

### Layer Testing

```typescript
describe("DownloadService", () => {
  const TestLayer = Layer.mergeAll(
    ModelService.Default,
    DownloadService.Default,
  ).pipe(
    Layer.provide(MockFileServiceLayer),
    Layer.provide(MockGopeedServiceLayer),
  )
  
  it("should download files", () =>
    Effect.gen(function* () {
      const download = yield* DownloadService
      const result = yield* download.start({ modelVersionId, fileIds: [file1Id, file2Id] })
      
      expect(result.completed).toBe(2)
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise,
    ))
})
```

## 8. Migration Guidelines

### Phase 1: New Code
  1. All new services must use `Effect.Service`
  2. All new errors must use `Schema.TaggedError`
  3. All new entity IDs must be branded

### Phase 2: Core Services
  1. Refactor `ModelService` and related services
  2. Refactor `DownloadService` and `ScanService`
  3. Update error handling patterns

### Phase 3: Frontend State
  1. Migrate from current state management to Effect Atoms
  2. Update React components to use Result.builder pattern

### Phase 4: Configuration & Observability
  1. Migrate from direct env access to Config
  2. Add structured logging throughout
  3. Add metrics for key operations

## 9. Code Review Checklist

When reviewing Effect-TS code, ensure:

### Service Definition
- [ ] Uses `Effect.Service` with `accessors: true`
- [ ] Declares all dependencies in service definition
- [ ] Uses `Effect.fn` for service methods
- [ ] Methods have descriptive names in `Effect.fn`

### Error Handling
- [ ] Errors use `Schema.TaggedError`
- [ ] Error types are specific (not generic)
- [ ] Error handling uses `catchTag`/`catchTags`
- [ ] No `Effect.catchAll` or `Option.getOrThrow`

### Types & Schemas
- [ ] Entity IDs are branded with `Schema.brand`
- [ ] Domain types use `Schema.Struct`
- [ ] Input validation uses Schema constraints

### Layer Composition
- [ ] Dependencies declared in services (not at usage sites)
- [ ] Uses `Layer.mergeAll` for flat composition
- [ ] Uses `Layer.provideMerge` for incremental chaining

### Observability
- [ ] Uses `Effect.log` with structured data (not `console.log`)
- [ ] Configuration uses `Config.*` (not `process.env`)
- [ ] Metrics added for key operations

### Frontend
- [ ] Atoms defined outside components
- [ ] Uses `Result.builder` for rendering
- [ ] No `useState` for loading/error states
- [ ] Atoms with side effects have proper cleanup

## 10. Common Pitfalls & Solutions

### Floating Effects
**Problem**: Effect created but not run
**Solution**: Effect Language Server will detect this

### Missing Dependencies
**Problem**: Service requires dependency not declared
**Solution**: Add to service's `dependencies` array

### Deep Layer Nesting
**Problem**: Complex types from deep `Layer.provide` chains
**Solution**: Use `Layer.mergeAll` and `Layer.provideMerge`

### Memory Leaks
**Problem**: Atoms with side effects not cleaned up
**Solution**: Always use `get.addFinalizer()` in atom constructors

---

**Last Updated**: February 2026  
**Version**: 1.0  
**Status**: Active