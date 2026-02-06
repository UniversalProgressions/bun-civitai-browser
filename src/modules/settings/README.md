# Settings Management Module

A type-safe settings management module for CivitAI Manager that combines [Conf](https://github.com/sindresorhus/conf) for persistence and [ArkType](https://arktype.io/) for runtime type safety.

## Features

- **Type-safe validation**: Full TypeScript integration with runtime validation
- **Persistence**: Automatic saving to user's config directory
- **Partial updates**: Update only specific settings fields
- **Strict validation**: Rejects unknown fields by default
- **Singleton pattern**: Easy access throughout the application
- **Comprehensive testing**: 100% test coverage

## Installation

The module is already included in the project. Dependencies:
- `conf`: For configuration persistence
- `arktype`: For type-safe validation

## Usage

### Basic Usage

```typescript
import { settingsService, type Settings } from "./settings";

// Check if settings are valid
const isValid = settingsService.isValid();

// Get current settings (throws if invalid)
try {
  const settings = settingsService.getSettings();
  console.log(`Models folder: ${settings.basePath}`);
} catch (error) {
  console.error("Settings are not configured:", error.message);
}

// Update settings
const updated = settingsService.updateSettings({
  basePath: "/path/to/models",
  civitai_api_token: "your_token_here",
  gopeed_api_host: "http://localhost:8080"
});

// Validate external data
const externalData = { /* ... */ };
const validated = settingsService.validateSettings(externalData);
```

### Settings Schema

The settings schema defines the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `basePath` | `string` | ✅ | Path to models folder (previously `models_folder`) |
| `civitai_api_token` | `string` | ✅ | CivitAI API token for authentication |
| `gopeed_api_host` | `string` | ✅ | GoPeer API host address |
| `http_proxy` | `string` | ❌ | HTTP proxy configuration (optional) |
| `gopeed_api_token` | `string` | ❌ | GoPeer API token (optional, required if GoPeer has auth) |

### TypeScript Integration

The module provides full TypeScript type safety:

```typescript
import { type Settings } from "./settings";

// TypeScript knows the exact shape of Settings
const settings: Settings = {
  basePath: "/path/to/models",
  civitai_api_token: "token",
  gopeed_api_host: "http://localhost:8080"
  // Optional fields can be omitted
};

// Type errors for missing required fields
const invalid: Settings = {
  basePath: "/path"  // Error: missing civitai_api_token and gopeed_api_host
};
```

### Advanced Usage

#### Partial Updates

```typescript
// Update only specific fields
settingsService.updateSettings({
  basePath: "/new/path"
  // Other fields remain unchanged
});
```

#### Validation Only

```typescript
// Validate without saving
try {
  const validated = settingsService.validateSettings(someData);
  console.log("Data is valid:", validated);
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

#### Configuration File Location

```typescript
// Get the path to the config file (for debugging)
const configPath = settingsService.getConfigPath();
console.log(`Config file: ${configPath}`);
```

#### Resetting Settings

```typescript
// Clear all settings
settingsService.resetSettings();
```

## Architecture

### Components

1. **model.ts** - Defines the settings schema using ArkType
   - `settingsSchema`: ArkType schema for validation
   - `Settings`: TypeScript type inferred from the schema

2. **service.ts** - Core service implementation
   - `SettingsService`: Main class with all business logic
   - `settingsService`: Singleton instance
   - `getSettings()`: Compatibility export

3. **index.ts** - Public API exports

### Design Decisions

1. **Lazy Validation**: Settings are validated on access, not on storage
2. **Strict Mode**: Unknown fields are rejected by default (`onUndeclaredKey: "reject"`)
3. **No Defaults**: Required fields must be provided by the user
4. **Singleton Pattern**: One instance manages all settings

## Testing

Run the tests with:

```bash
cd apps/civitai-manager
bun test src/modules/settings/settings.test.ts
```

The test suite covers:
- Schema validation
- Service operations
- TypeScript type safety
- Error handling
- Edge cases

## Example

See `example.ts` for a complete usage demonstration:

```bash
bun src/modules/settings/example.ts
```

## Migration from Previous Version

If you were using a different settings system:

1. Field `models_folder` has been renamed to `basePath` for consistency
2. All settings are now type-safe with runtime validation
3. Unknown fields are rejected (previously they might have been ignored)

## Configuration Storage

Settings are stored in the user's config directory:
- **Windows**: `%APPDATA%\civitai-manager-nodejs\Config\civitai-manager.json`
- **macOS**: `~/Library/Preferences/civitai-manager-nodejs/config.json`
- **Linux**: `~/.config/civitai-manager-nodejs/config.json`

## Error Messages

The module provides clear error messages:

```
Settings validation failed: basePath must be a string (was missing)
civitai_api_token must be a string (was missing)
gopeed_api_host must be a string (was missing)
```

Extra fields are rejected with:
```
Settings validation failed: extraField must be removed
```

## Integration with Existing Code

For backward compatibility, the module exports a `getSettings()` function that matches the previous API:

```typescript
import { getSettings } from "./settings";

// Old code continues to work
const settings = getSettings();
```

## Performance Considerations

- Validation is fast (ArkType is optimized for performance)
- Disk I/O is minimal (Conf uses efficient JSON storage)
- Memory usage is low (singleton pattern)

## Security

- API tokens are stored in plain text (consider encryption for production)
- File permissions follow OS defaults
- No network calls are made by this module
