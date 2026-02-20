# 项目开发标准 - 综合版本

## 概述

本文档整合了项目开发所需的所有标准和最佳实践，包括：
- 架构和设计模式
- 代码质量和语言规范
- 错误处理标准
- 开发工作流
- 当前技术栈参考

**版本**: 1.1  
**更新日期**: 2026年2月19日  
**适用对象**: 所有项目开发者

---

## 一、架构与设计模式

### 1.1 ElysiaJS最佳实践

**核心原则**：
- 所有后端代码必须遵循官方ElysiaJS最佳实践：[ElysiaJS Best Practices Guide](https://elysiajs.com/essential/best-practice.md)
- 使用功能模块化架构，已实现在 `src/modules/`

**实施要求**：
1. **控制器实现**：使用Elysia实例作为控制器，保持HTTP层与业务逻辑分离
2. **验证策略**：外部API使用arktype验证（因Civitai API数据结构不一致）
3. **错误处理**：遵循Elysia错误处理模式，集成统一的错误系统
4. **服务层设计**：业务逻辑封装在服务层，控制器仅处理HTTP交互

**合规检查清单**：
- [ ] 已查阅ElysiaJS最佳实践文档
- [ ] 遵循推荐的文件夹结构模式
- [ ] 正确使用Elysia实例作为控制器
- [ ] 保持HTTP层与业务逻辑的适当分离
- [ ] 按照Elysia模式实现错误处理
- [ ] 添加适当的验证（外部API使用arktype）

### 1.2 现代TypeScript/JavaScript模式

**错误处理（neverthrow模式）**：
- 使用 `neverthrow` 库进行类型安全的错误处理
- 避免使用 `try-catch` 块处理业务错误
- 使用 `Result<T, E>` 类型封装可能失败的操作

**类型验证（arktype模式）**：
- 使用 `arktype` 进行运行时类型验证
- 创建品牌化类型：`type("string & brand<TypeName>")`
- 模式验证优先于手动验证

**函数式编程原则**：
- 优先使用纯函数和不可变数据
- 避免副作用，必要时明确标注
- 使用函数组合简化复杂逻辑

**依赖管理**：
- 使用构造函数参数传递依赖
- 避免全局状态，使用依赖注入模式
- 服务层使用明确的接口定义

### 1.3 项目特定架构

**模块化组织**：
```
src/modules/
├── civitai/          # Civitai API集成
├── db/              # 数据库访问层
├── gopeed/          # 下载服务
├── local-models/    # 本地模型管理
└── settings/        # 应用配置
```

**数据库访问模式**：
- 使用Prisma ORM进行数据访问
- 在 `src/modules/db/crud/` 中定义CRUD操作
- 业务逻辑不直接访问数据库，通过服务层

**配置管理**：
- 环境变量通过 `src/modules/settings/` 管理
- 使用arktype验证配置数据
- 配置读取使用统一的设置服务

**日志记录和监控**：
- 使用结构化日志记录
- 关键操作添加性能监控
- 错误日志包含足够上下文信息

### 1.4 API错误处理架构：ElysiaJS + neverthrow组合

**设计理念**：
本项目采用分层错误处理架构，将 ElysiaJS 作为类型安全的 API 层，neverthrow 作为业务逻辑层的错误处理机制。这种组合设计确保错误类型信息在整个应用栈中不丢失，并能精确传递到前端。

**ElysiaJS 的角色**：
- **API 契约层**：提供类型安全的前后端通信
- **错误转换层**：将 neverthrow 的 `Result<T, E>` 转换为 HTTP 响应
- **统一接口**：保持所有 API 端点的错误响应格式一致

**neverthrow 的角色**：
- **业务错误封装**：使用 `Result<T, E>` 类型封装可能失败的操作
- **错误类型安全**：保持错误的具体类型信息（如 `ModelNotFoundError`, `DatabaseConstraintError`）
- **错误传播**：通过函数调用链传递错误，不丢失上下文信息

**错误传播路径**：
```
业务函数 (Result<T, E>) 
  → 服务层 (Result<T, E>) 
  → 控制器层 (Elysia 错误处理) 
  → HTTP 响应 (JSON 错误格式) 
  → 前端显示 (类型化的错误信息)
```

**设计优势**：
1. **类型安全贯穿全栈**：从数据库操作到前端显示，错误类型保持一致性
2. **错误信息可追溯**：每个错误都包含完整的调用上下文
3. **前端友好**：前端可以精确识别错误类型，提供针对性的用户反馈
4. **问题定位高效**：开发时能快速定位错误根源，减少调试时间
5. **可预见性**：所有可能的错误情况都有明确的类型定义

**代码示例**：
```typescript
// 业务层使用 neverthrow
import { Result, ok, err } from "neverthrow";
import { ModelNotFoundError } from "../errors";

async function findModel(modelId: number): Promise<Result<Model, ModelNotFoundError>> {
  const model = await db.model.findUnique({ where: { id: modelId } });
  
  if (!model) {
    return err(new ModelNotFoundError(
      `Model with ID ${modelId} not found`,
      modelId
    ));
  }
  
  return ok(model);
}

// 控制器层使用 Elysia
import { Elysia } from "elysia";

app.get("/models/:id", async ({ params }) => {
  const result = await findModel(parseInt(params.id));
  
  if (result.isErr()) {
    // Elysia 会自动将错误转换为合适的 HTTP 响应
    throw result.error;
  }
  
  return result.value;
});
```

**错误响应格式**：
```json
{
  "error": {
    "name": "ModelNotFoundError",
    "message": "Model with ID 123 not found",
    "modelId": 123,
    "timestamp": "2026-02-19T16:43:25.123Z"
  }
}
```

**实现要求**：
1. **业务层**：所有可能失败的操作必须返回 `Result<T, E>` 类型
2. **错误类**：每个错误类必须继承自统一的基类，包含足够的上下文信息
3. **API 层**：Elysia 端点必须正确处理 neverthrow 的 Result 类型
4. **前端集成**：前端必须根据错误类型提供相应的用户反馈

---

## 二、代码质量和语言规范

### 2.1 英语语言政策

**核心原则**：
所有代码、文档和通信必须使用英语，确保项目的一致性和全球协作性。

**适用范围**：
- ✅ **源代码**：TypeScript/JavaScript文件
- ✅ **配置文件**：JSON, YAML, TOML等
- ✅ **文档文件**：README, Markdown, API文档
- ✅ **代码注释**：单行注释、多行注释、JSDoc
- ✅ **错误消息**：错误类消息、日志消息
- ✅ **UI字符串**：用户界面文本
- ✅ **提交消息**：Git提交描述

**例外情况**：
- ❗ 模型名称和描述（来自CivitAI的元数据）
- ❗ 文件路径中的非英文字符（引用实际文件系统路径）
- ❗ 外部API返回的本地化内容
- ❗ 用户生成的内容（数据库中的模型标签等）

**命名规范**：
```typescript
// ✅ GOOD: 英语命名
const downloadProgress = 0.5
function calculateTotalSize(files: File[]) { /* ... */ }

// ❌ BAD: 非英语命名
const 下载进度 = 0.5  // 中文
function 计算总大小(文件列表: File[]) { /* ... */ }  // 中文

// ❌ BAD: 混合语言
const download文件列表 = []  // 混合中英文
```

**注释和文档**：
```typescript
// ✅ GOOD: 英语注释
// Downloads model files to the specified directory
async function downloadModel(modelId: string) { /* ... */ }

/**
 * Scans local model files and updates the database
 * @param basePath - Root directory to scan
 * @returns Scan result with statistics
 */
function scanModels(basePath: string) { /* ... */ }

// ❌ BAD: 非英语注释
// 下载模型文件到指定目录  // 中文注释
async function downloadModel(modelId: string) { /* ... */ }
```

**错误消息和日志**：
```typescript
// ✅ GOOD: 英语错误消息
throw new Error("Failed to download file: network timeout")
console.error("Database connection failed:", error)

// ❌ BAD: 非英语错误消息
throw new Error("下载文件失败：网络超时")  // 中文
console.error("数据库连接失败:", error)  // 中文
```

### 2.2 代码风格和格式化

**TypeScript/JavaScript风格**：
- 使用双引号（`"`）而非单引号
- 尾随逗号使用ES5风格
- 2空格缩进，不使用制表符
- 最大行长度120字符

**React组件模式**：
- 函数组件优先于类组件
- 使用TypeScript接口定义props
- 复杂状态管理使用Jotai
- 避免prop drilling，使用Context或状态管理

**文件命名约定**：
- 使用kebab-case：`model-version.ts`
- 组件文件使用PascalCase：`DownloadPanel.tsx`
- 测试文件后缀：`.test.ts` 或 `.spec.ts`
- 类型定义文件：`.d.ts`

**导入/导出规范**：
```typescript
// ✅ GOOD: 分组导入
import { type } from "arktype"
import { Elysia, t } from "elysia"

// ✅ GOOD: 命名导出优先
export class ModelService { /* ... */ }
export function calculateSize() { /* ... */ }

// ❌ BAD: 默认导出（除非必要）
export default ModelService  // 尽量避免
```

**注释规范**：
- 公共API必须有JSDoc注释
- 复杂算法添加解释性注释
- TODO注释必须包含责任人：`// TODO: [名字] 修复此问题`
- 已弃用代码使用 `@deprecated` 标记

---

## 三、错误处理标准

### 3.1 统一错误系统

**核心原则**：
- 所有错误类必须继承自 `AppError`（位于 `src/utils/errors.ts`）
- 使用 `as const` 静态属性模式优化性能
- 每个模块必须有独立的 `errors.ts` 文件
- 错误类必须足够具体，避免通用错误

**错误类结构**：
```typescript
import { ServiceError } from "../../utils/errors";

export class ModelNotFoundError extends ServiceError {
  static readonly NAME = "ModelNotFoundError" as const;
  
  constructor(
    message: string,
    public readonly modelId?: number,
  ) {
    super(message);
    this.name = ModelNotFoundError.NAME;  // 性能优化：静态属性共享
  }
}
```

**性能优化说明**：
- `static readonly NAME = "ErrorName" as const`：类型安全，编译器知道确切值
- `this.name = ErrorClass.NAME`：避免 `constructor.name` 的运行时查找
- 静态属性在类加载时创建一次，所有实例共享，减少内存分配

### 3.2 模块错误文件要求

**每个模块必须有 `errors.ts`**：
```
src/modules/
├── civitai/errors.ts
├── db/errors.ts
├── gopeed/errors.ts
├── local-models/service/errors.ts
└── settings/errors.ts
```

**错误分类**：
1. **服务错误** (`ServiceError`)：业务逻辑错误
2. **验证错误** (`ValidationError`)：数据验证失败
3. **数据库错误** (`DatabaseError`)：数据库操作错误
4. **网络错误** (`NetworkError`)：网络请求错误
5. **文件系统错误** (`FileSystemError`)：文件操作错误
6. **配置错误** (`ConfigurationError`)：配置相关错误
7. **外部服务错误** (`ExternalServiceError`)：第三方服务错误

### 3.3 错误使用模式

**创建错误**：
```typescript
// ✅ GOOD: 使用具体的错误类
throw new ModelNotFoundError(
  `Model with ID ${modelId} not found`,
  modelId
);

// ❌ BAD: 使用通用Error
throw new Error("Model not found");  // 缺乏上下文
```

**错误处理**：
```typescript
import { Result, ok, err } from "neverthrow";
import { ModelNotFoundError } from "../errors";

async function findModel(modelId: number): Promise<Result<Model, ModelNotFoundError>> {
  const model = await db.model.findUnique({ where: { id: modelId } });
  
  if (!model) {
    return err(new ModelNotFoundError(
      `Model with ID ${modelId} not found`,
      modelId
    ));
  }
  
  return ok(model);
}
```

**错误转换**：
```typescript
// 将低级错误转换为领域错误
try {
  await someOperation();
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseConstraintError(
      "Failed to insert record due to constraint violation",
      error.meta?.constraint,
      "model",
      error
    );
  }
  throw error;
}
```

### 3.4 错误记录和监控

**结构化日志**：
```typescript
// ✅ GOOD: 包含错误上下文
console.error("Failed to download model", {
  error: error.name,           // 错误类名
  message: error.message,      // 错误消息
  modelId: modelId,            // 业务上下文
  timestamp: new Date().toISOString(),
});

// ❌ BAD: 简单的字符串日志
console.error("Download failed");  // 缺乏上下文
```

**错误聚合**：
- 相同错误类型聚合统计
- 高频错误预警机制
- 错误根本原因分析


---

## 四、开发工作流

### 4.1 Git和版本控制

**提交消息规范**：
```
<类型>: <简短描述>

<详细描述>

<页脚>
```

**类型**：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建或工具更新

**分支策略**：
- `main`: 生产就绪代码
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 错误修复分支
- `release/*`: 发布分支

**代码审查流程**：
1. 自检：运行测试和lint检查
2. 提交PR：清晰描述变更内容
3. 审查：至少一名审查者批准
4. 合并：通过CI后合并到目标分支

### 4.2 测试和质量保证

**单元测试模式**：
- 每个业务函数必须有单元测试
- 测试覆盖率不低于80%
- 使用描述性的测试名称
- 避免测试中的业务逻辑

**集成测试策略**：
- API端点集成测试
- 数据库操作集成测试
- 外部服务模拟测试
- 端到端工作流测试

**测试工具**：
- 测试框架：Bun内置测试
- 断言库：Bun内置断言
- 模拟库：手动模拟或简单stub
- 覆盖率：Bun coverage

**代码覆盖率要求**：
- 语句覆盖率：≥80%
- 分支覆盖率：≥70%
- 函数覆盖率：≥85%
- 行覆盖率：≥80%

### 4.3 部署和运维

**环境配置**：
- 开发环境：本地开发
- 测试环境：自动化测试
- 生产环境：用户使用

**构建和打包**：
- 使用Bun进行构建
- 类型检查作为构建步骤
- 代码压缩和优化
- 资源文件处理

**监控和日志**：
- 应用性能监控
- 错误追踪和告警
- 用户行为分析
- 系统资源监控

**性能优化**：
- 数据库查询优化
- 缓存策略实施
- 前端资源优化
- 网络请求优化

### 4.4 开发工具

项目提供了一系列开发工具脚本，位于 `tools/` 目录下，用于辅助开发、调试和测试工作。

**工具概述**：
- **scan-integration.ts**: 端到端本地模型扫描测试工具
- **debug-paths.ts**: 文件路径提取逻辑调试工具  
- **validate-json.ts**: JSON文件结构验证工具

**与单元测试的区别**：
- **单元测试**: 隔离、模拟、快速、无副作用，用于验证代码逻辑
- **开发工具**: 实际执行、依赖环境、有副作用、用于验证真实系统功能

**详细文档**：
有关工具的详细功能、使用方法和示例输出，请参阅 [tools/README.md](../tools/README.md)。

---

## 五、附录

### 5.1 技术栈参考

**当前版本**：
- **运行时**: Bun 1.x
- **后端框架**: ElysiaJS 1.x
- **前端框架**: React 18 + Jotai
- **数据库**: Prisma + SQLite
- **验证库**: arktype
- **错误处理**: neverthrow
- **构建工具**: Vite

**重要依赖说明**：
- `elysiajs`: 后端Web框架
- `arktype`: 运行时类型验证
- `neverthrow`: 类型安全错误处理
- `prisma`: ORM和数据访问
- `jotai`: React状态管理

**迁移历史**：
- 2026年2月：从Effect-TS迁移到neverthrow + arktype
- 2025年12月：引入ElysiaJS最佳实践
- 2025年11月：实施英语语言政策

### 5.2 常见问题解答

**Q: 如何处理Effect-TS遗留代码？**
A: 逐步迁移到neverthrow模式，优先迁移核心业务逻辑。

**Q: 新错误系统如何与现有代码兼容？**
A: 新错误类继承自统一基类，可以逐步替换现有错误处理。

**Q: 性能优化真的有必要吗？**
A: 对于高频错误场景，静态属性模式可减少内存分配和属性查找。

**Q: 如何确保团队遵循这些标准？**
A: 代码审查清单、自动化lint检查、定期培训。

**Q: 如何处理非英语的模型名称？**
A: 保持原始元数据，但在代码中使用英语变量名。

### 5.3 代码审查清单

**架构和设计**：
- [ ] 遵循ElysiaJS最佳实践
- [ ] 使用正确的错误处理模式
- [ ] 保持模块化组织
- [ ] 避免全局状态

**代码质量**：
- [ ] 所有标识符使用英语
- [ ] 注释和文档使用英语
- [ ] 错误消息使用英语
- [ ] 遵循代码风格指南

**错误处理**：
- [ ] 错误类使用 `as const` 静态属性
- [ ] 错误类有明确的name属性
- [ ] 错误类继承自适当的基础类
- [ ] 错误消息包含足够上下文

**测试和文档**：
- [ ] 新功能有相应测试
- [ ] 公共API有JSDoc注释
- [ ] 复杂逻辑有解释性注释
- [ ] 提交消息符合规范

---

## 六、前后端数据交互模式

### 6.1 本地模型浏览功能架构

**设计理念**：
本地模型浏览功能采用预计算URL和参数化定位的架构，确保高效的前后端数据交互，同时保持类型安全和错误处理的完整性。

**媒体URL设计模式**：
```typescript
// URL格式：四个参数定位媒体文件
GET /local-models/media?modelId={modelId}&versionId={versionId}&modelType={modelType}&filename={filename}

// 后端路径计算使用 file-layout.ts 中的函数
import { getMediaDir } from "../modules/local-models/service/file-layout";

// 前端生成完整URL避免相对路径问题
const relativeUrl = `/local-models/media?modelId=${modelId}&versionId=${versionId}&modelType=${modelType}&filename=${encodeURIComponent(filename)}`;
const url = typeof window !== "undefined" ? `${window.location.origin}${relativeUrl}` : relativeUrl;
```

**预计算数据策略**：
1. **后端预计算**：`/local-models/models/on-disk` 端点返回数据时预计算所有媒体文件的URL
2. **参数化定位**：媒体请求采用四个参数定位文件：modelId, versionId, modelType, filename
3. **缓存优化**：设置 `Cache-Control: public, max-age=86400`，减少重复请求

**前端缩略图选择逻辑**：
- 使用 model version 中 images 数组的第一个图片作为 thumbnail
- 前端负责选择逻辑，后端只提供完整数据
- 支持多种媒体类型（图片、视频）的自动检测

### 6.2 Gallery组件技术实现

**问题与解决方案**：

#### 问题1：URL解析失败
**原因**：`new URL()` 构造函数需要完整URL，相对路径导致 "Invalid URL" 错误
**解决方案**：
1. 前端组件生成完整URL：`${window.location.origin}${relativeUrl}`
2. Gallery组件增强URL处理：尝试解析相对路径，失败时添加origin
3. 双重保障机制：前端提供完整URL + 后端能处理相对路径

#### 问题2：文件类型检测错误
**原因**：文件名存储在查询参数中（如 `?filename=image123.jpg`），无法从路径名提取
**解决方案**：
1. 从URL查询参数中提取 `filename` 参数
2. 如果查询参数中没有，再从路径名中提取
3. 基于实际文件扩展名判断是图片还是视频
4. 未知文件类型默认使用图片渲染

**代码示例**：
```typescript
// 安全地处理URL - 如果是相对路径，转换为完整URL
let urlToUse = info.image.url;
try {
  new URL(urlToUse);
} catch (e) {
  if (typeof window !== "undefined" && urlToUse.startsWith("/")) {
    urlToUse = `${window.location.origin}${urlToUse}`;
  }
}

// 从查询参数中提取filename
const params = new URLSearchParams(urlobj.search);
const filenameParam = params.get("filename");
if (filenameParam) {
  filename = filenameParam;
} else {
  const pathParts = urlobj.pathname.split("/");
  filename = pathParts[pathParts.length - 1] || "";
}
```

### 6.3 调试日志优化策略

**环境区分设计**：
```typescript
// 开发环境：保留有用的调试信息
if (import.meta.env.DEV) {
  console.warn("Failed to parse URL:", urlToUse, e);
  // 其他开发调试日志
}

// 生产环境：控制台干净整洁
// 仅显示关键错误，不显示开发调试信息
```

**环境变量配置**：
- **开发环境**：运行 `bun run dev:client` → `import.meta.env.DEV = true`
- **生产环境**：运行 `bun run build:client` → `import.meta.env.DEV = false`
- **模式参数**：通过 `--mode development` 或 `--mode production` 指定

**清理策略**：
1. **移除开发调试日志**：删除 `console.log(info)` 等详细调试信息
2. **保留重要警告**：将 `console.warn` 包装在 `if (import.meta.env.DEV)` 条件中
3. **环境区分**：开发环境保留调试信息，生产环境控制台干净

### 6.4 配置无感知服务启动架构

**设计理念**：
服务器可以在没有配置文件的情况下正常启动，配置检查交由前端完成，提供优雅的用户引导体验。

**分层错误处理**：
1. **服务器层**：移除启动时的配置依赖，所有API端点包含适当的配置缺失错误处理
2. **API层**：配置缺失时返回有意义的HTTP状态码和错误消息，保持API向后兼容性
3. **前端层**：自动配置检测，配置缺失时显示清晰的设置向导模态框

**状态管理设计**：
```typescript
// Jotai atom 定义（src/html/atoms.ts）
export const settingsValidAtom = atom<boolean>(false);
export const settingsCheckingAtom = atom<boolean>(false);
export const settingsInitializedAtom = atom<boolean>(false);
export const initialSetupRequiredAtom = atom<boolean>(false);
export const showSetupRequiredAtom = atom<boolean>(false);
export const settingsReadyAtom = atom(
  (get) => get(settingsValidAtom) && get(settingsInitializedAtom)
);
```

**用户工作流程**：
1. **新用户启动**：`bun run dev:server` → 服务器成功启动（无需配置）
2. **前端加载**：访问 `http://localhost:5173` → 前端检查配置状态
3. **设置引导**：配置缺失时显示设置向导 → 引导用户完成配置
4. **功能使用**：配置完成后 → 正常使用所有功能

**技术优势**：
1. **用户体验优化**：清晰的引导而不是错误信息
2. **开发体验改善**：新开发者可以立即启动和探索应用
3. **代码质量提升**：更好的错误处理和状态管理
4. **可维护性增强**：模块化的配置检查组件

## 七、更新和维护

**定期审查**：
- 每季度审查文档有效性
- 根据技术栈变化更新标准
- 收集团队反馈进行改进

**变更流程**：
1. 提出变更建议
2. 团队讨论和批准
3. 更新文档
4. 通知所有开发者
5. 逐步实施变更

**联系信息**：
- 文档维护：开发团队
- 问题反馈：GitHub Issues
- 紧急变更：团队负责人

---

**文档状态**: 正式发布  
**更新日期**: 2026年2月20日  
**替代文档**: `coding-standards.md`, `language-policy.md`, `systemPatterns.md`, `activeContext.md`
