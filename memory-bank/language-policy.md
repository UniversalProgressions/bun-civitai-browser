# English-Only Language Policy

## Overview

All code, documentation, and communication for the bun-civitai-browser project must be in English. This policy ensures consistency, improves collaboration, and maintains professional standards for an open-source project.

## Scope

This policy applies to:

### Codebase
- **Source code** (TypeScript, JavaScript, etc.)
- **Configuration files** (JSON, YAML, TOML, etc.)
- **Build scripts** (package.json, biome.json, vite.config.ts, etc.)
- **Database schemas and migrations**
- **Test files** and test data

### Documentation
- **README.md** and project documentation
- **Code comments** and JSDoc annotations
- **API documentation** and OpenAPI specifications
- **Error messages** and user-facing strings
- **Commit messages** and pull request descriptions

### Exceptions
The following may contain non-English content:
- **Model names** and descriptions from CivitAI (as they are metadata)
- **User-generated content** in database (model tags, etc.)
- **External API responses** that return localized content
- **File paths** containing non-English characters (when referring to actual filesystem paths)

## Enforcement Rules

### 1. Variable and Function Names
```typescript
// ✅ GOOD: English names
const downloadProgress = 0.5
function calculateTotalSize(files: File[]) { /* ... */ }

// ❌ BAD: Non-English names  
const 下载进度 = 0.5  // Chinese
function 计算总大小(文件列表: File[]) { /* ... */ }  // Chinese

// ❌ BAD: Mixed languages
const download文件列表 = []  // Mixed English-Chinese
```

### 2. Comments and Documentation
```typescript
// ✅ GOOD: English comments
// Downloads model files to the specified directory
async function downloadModel(modelId: string) { /* ... */ }

/**
 * Scans local model files and updates the database
 * @param basePath - Root directory to scan
 * @returns Scan result with statistics
 */
function scanModels(basePath: string) { /* ... */ }

// ❌ BAD: Non-English comments
// 下载模型文件到指定目录  // Chinese comment
async function downloadModel(modelId: string) { /* ... */ }
```

### 3. Error Messages and Logs
```typescript
// ✅ GOOD: English error messages
throw new Error("Failed to download file: network timeout")
console.error("Database connection failed:", error)

// ❌ BAD: Non-English error messages  
throw new Error("下载文件失败：网络超时")  // Chinese
console.error("数据库连接失败:", error)  // Chinese

// ✅ GOOD: Structured logging in English
yield* Effect.log("Starting model scan", {
  basePath: settings.basePath,
  pattern: scanPattern,
})

// ❌ BAD: Structured logging in other languages
yield* Effect.log("开始扫描模型", {  // Chinese
  basePath: settings.basePath,
  pattern: scanPattern,
})
```

### 4. UI Strings and User Messages
```typescript
// ✅ GOOD: English UI strings
const downloadButtonText = "Download Model"
const errorMessage = "Failed to connect to CivitAI API"

// ❌ BAD: Non-English UI strings
const downloadButtonText = "下载模型"  // Chinese
const errorMessage = "连接CivitAI API失败"  // Chinese
```

### 5. Documentation Files
```markdown
<!-- ✅ GOOD: English documentation -->
# Model Scanning Feature
This feature scans local directories for downloaded models and updates the database.

<!-- ❌ BAD: Non-English documentation -->
# 模型扫描功能  <!-- Chinese -->
此功能扫描本地目录中的已下载模型并更新数据库。  <!-- Chinese -->
```

## Linting Configuration

### Biome Configuration
Add the following to `biome.json` to enforce English-only naming:

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noBannedTypes": "error"
      },
      "style": {
        "useNamingConvention": [
          "error",
          {
            "strictCamelCase": true,
            "strictPascalCase": true,
            "allowLeadingUnderscore": false,
            "allowTrailingUnderscore": false,
            "requireAscii": true  // Enforces ASCII-only identifiers
          }
        ]
      }
    }
  },
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": false
    },
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "es5"
    }
  }
}
```

### ESLint Configuration (Alternative)
If using ESLint, add these rules:

```json
{
  "rules": {
    "id-match": ["error", "^[a-zA-Z][a-zA-Z0-9]*$", {"properties": true}],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Identifier[name=/[^\\x00-\\x7F]/]",  // Non-ASCII characters
        "message": "Variable names must use ASCII characters only"
      },
      {
        "selector": "JSXText[value=/[^\\x00-\\x7F]/]",  // Non-ASCII in JSX text
        "message": "UI text should be in English (ASCII characters only)"
      }
    ]
  }
}
```

## Migration Guidelines

### Phase 1: New Code (Immediate)
1. All new code must follow English-only policy
2. Configure linter to enforce ASCII-only identifiers
3. Update CI pipeline to fail on non-English code

### Phase 2: Existing Code Audit (Week 1-2)
1. Scan codebase for Chinese comments and translate:
   ```bash
   # Find Chinese characters in source files
   grep -r -P '[\p{Han}]' --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/
   
   # Find Chinese characters in documentation
   grep -r -P '[\p{Han}]' --include="*.md" --include="*.json" ./
   ```

2. Prioritize translation:
   - Public API documentation first
   - Error messages and logs
   - Code comments
   - Internal documentation

### Phase 3: Variable Name Refactoring (Week 3-4)
1. Identify non-English variable/function names
2. Create mapping and refactor:
   - `下载进度` → `downloadProgress`
   - `模型列表` → `modelList`
   - `计算大小` → `calculateSize`

3. Update all references and tests

### Phase 4: UI Strings (Week 5-6)
1. Extract all UI strings to localization files
2. Provide English translations
3. Plan for future internationalization if needed

## Tools and Automation

### Code Scanning Script
Create a script to detect non-English content:

```typescript
// scripts/check-english.ts
import { readdirSync, readFileSync } from "fs"
import { join } from "path"

const NON_ASCII_REGEX = /[^\x00-\x7F]/

function scanDirectory(dir: string): void {
  const files = readdirSync(dir, { withFileTypes: true })
  
  for (const file of files) {
    const fullPath = join(dir, file.name)
    
    if (file.isDirectory()) {
      scanDirectory(fullPath)
    } else if (file.isFile() && /\.(ts|tsx|js|jsx|md|json)$/.test(file.name)) {
      const content = readFileSync(fullPath, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        if (NON_ASCII_REGEX.test(line)) {
          console.warn(`Non-ASCII content found in ${fullPath}:${index + 1}`)
          console.warn(`  ${line.trim()}`)
        }
      })
    }
  }
}

scanDirectory('./src')
```

### Git Pre-commit Hook
Add a pre-commit hook to check for non-English content:

```bash
#!/bin/bash
# .husky/pre-commit

# Check for non-ASCII characters in staged files
non_ascii_files=$(git diff --cached --name-only -G '[^\x00-\x7F]' -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.md')

if [ -n "$non_ascii_files" ]; then
  echo "Error: Non-ASCII characters found in:"
  echo "$non_ascii_files"
  echo "Please ensure all code and documentation is in English."
  exit 1
fi
```

### CI Pipeline Check
Add to GitHub Actions workflow:

```yaml
name: Check English-Only Policy
on: [push, pull_request]
jobs:
  check-english:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for non-English content
        run: |
          if grep -r -P '[\p{Han}]' --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.md" src/; then
            echo "Error: Non-English content found"
            exit 1
          fi
```

## Common Issues and Solutions

### Issue: Model names from CivitAI contain non-English characters
**Solution**: Keep as-is in metadata, but use English variable names:
```typescript
// ✅ GOOD: English variable name, original metadata preserved
const model = {
  id: 123,
  name: "动漫风格模型",  // Original Japanese/Chinese name from API
  englishName: "Anime Style Model",  // Optional English translation
}

// Use English variable names
const animeStyleModel = model
```

### Issue: File paths contain non-English characters
**Solution**: Document the exception, use English variable names:
```typescript
// ✅ GOOD: English variable for non-English path
const userModelsPath = "/Users/用户/模型"  // Path contains Chinese
const modelFiles = await scanDirectory(userModelsPath)
```

### Issue: Database contains non-English content from users
**Solution**: This is external data, keep as-is:
```typescript
// User-generated tags may be in any language
const tags = ["动漫", "anime", "ゲーム", "game"]
// Application code uses English
const filteredTags = tags.filter(tag => tag.includes("game"))
```

## Code Review Checklist

When reviewing code for English-only compliance:

### Naming
- [ ] Variable names use English words only
- [ ] Function names use English words only
- [ ] Class names use English words only
- [ ] Interface/type names use English words only
- [ ] File names use English words only

### Documentation
- [ ] Comments are in English
- [ ] JSDoc annotations are in English
- [ ] README and docs are in English
- [ ] API documentation is in English

### Messages
- [ ] Error messages are in English
- [ ] Log messages are in English
- [ ] UI strings are in English
- [ ] Configuration descriptions are in English

### Exceptions
- [ ] Non-English model names are preserved as metadata
- [ ] File paths with non-English characters are documented
- [ ] User-generated content is handled appropriately

## Benefits of English-Only Policy

1. **Global Collaboration**: Enables contributions from developers worldwide
2. **Consistency**: Ensures uniform codebase style
3. **Tooling Support**: Better IDE support and linting tools
4. **Searchability**: English is the lingua franca of programming
5. **Professionalism**: Maintains industry standards for open-source projects

## Policy Updates

This policy should be reviewed quarterly. Exceptions may be granted for:
- Integration with external systems requiring specific character sets
- Specialized technical terms without direct English equivalents
- Temporary workarounds during migration period

---

**Last Updated**: February 2026  
**Version**: 1.0  
**Status**: Active  
**Responsible**: Project Maintainers