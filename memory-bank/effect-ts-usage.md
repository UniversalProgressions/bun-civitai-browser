# Effect-TS 使用情况文档

本文档记录项目中所有使用Effect-TS的地方，以便用neverthrow进行重构。

## 文件使用情况概览

### 已迁移的文件

#### 1. `src/modules/local-models/service/scan-and-rebuild.ts` ❌ **已删除**
**状态**: **已迁移到neverthrow**
- 使用Effect的API：`Effect`, `pipe`
- 功能：扫描模型文件并重建数据库
- 迁移状态：已创建等效的neverthrow函数在`scan-models.ts`中

#### 2. `src/modules/local-models/service/enhanced-scanner.ts` ❌ **已删除**
**状态**: **已迁移到neverthrow**
- 使用Effect的API：`Effect`, `pipe`, `Option`
- 功能：增量扫描、一致性检查、数据库修复
- 迁移状态：已创建等效的neverthrow函数在`scan-models.ts`中
  - `performIncrementalScan()` -> `performIncrementalScan()`
  - `performConsistencyCheck()` -> `performConsistencyCheckWithNeverthrow()`
  - `repairDatabaseRecords()` -> `repairDatabaseRecordsWithNeverthrow()`

#### 3. `src/modules/local-models/service/scan-models.ts` ✅ **已转换**
**状态**: **已转换为neverthrow**
- 已移除所有Effect导入
- 添加了neverthrow导入：`Result`, `ok`, `err`
- 创建了新的错误类型：`ScanError`, `JsonParseError`, `DatabaseError`, `FileNotFoundError`, `DirectoryStructureError`
- 创建了新的neverthrow函数：
  - `scanAllModelFilesWithNeverthrow()`
  - `performIncrementalScan()`
  - `performConsistencyCheckWithNeverthrow()`
  - `repairDatabaseRecordsWithNeverthrow()`

#### 4. `src/modules/local-models/index.ts` ✅ **已部分迁移**
**状态**: **已更新使用neverthrow**
- 使用的Effect API：`Effect.runPromise()`
- 迁移状态：已更新为使用新的neverthrow函数
  - `enhanced-scan` 端点现在使用`performIncrementalScan()`
  - `check-consistency` 端点现在使用`performConsistencyCheckWithNeverthrow()`
  - `repair-database` 端点现在使用`repairDatabaseRecordsWithNeverthrow()`
  - `scan-and-rebuild` 端点仍使用Effect（保留向后兼容性）

### 待迁移的文件

#### 5. `src/modules/settings/schema.ts`
**状态**: **待迁移**
- 使用Effect的API：`Config`, `Schema`
- 功能：定义设置模式和配置
- 用途：品牌化类型定义（BasePath, CivitaiApiToken等）、配置环境变量
- 复杂度：中等（主要使用Schema和Config模块）
- 建议：使用zod或arktype替换

#### 6. `src/modules/settings/errors.ts`
**状态**: **待迁移**
- 使用Effect的API：`Schema`
- 功能：定义错误类型
- 复杂度：低（仅使用Schema定义品牌化错误类型）
- 建议：使用zod或arktype替换

#### 7. `src/modules/local-models/service/file-layout.ts`
**状态**: **待迁移**
- 使用Effect的API：`Effect`, `pipe`
- 功能：文件布局和路径处理
- 复杂度：中等（使用Effect进行异步操作）
- 建议：转换为async/await + neverthrow

#### 8. `src/modules/local-models/service/errors.ts`
**状态**: **待迁移**
- 使用Effect的API：`Schema`
- 功能：定义错误类型
- 复杂度：低（仅使用Schema定义品牌化错误类型）
- 建议：使用zod或arktype替换

#### 9. `src/modules/gopeed/service.ts`
**状态**: **待迁移**
- 使用Effect的API：`Data`, `Context`, `Effect`, `pipe`
- 功能：Gopeed下载服务
- 复杂度：**高**（大量使用Effect生态系统）
  - 使用`Data.Error`定义错误类型
  - 使用`Context.Tag`定义依赖注入
  - 使用`Effect`进行异步操作
  - 使用`pipe`进行函数组合
- 建议：需要逐步重构，可能是最复杂的迁移

#### 10. `src/modules/gopeed/service.test.ts`
**状态**: **待迁移**
- 使用Effect的API：`Data`, `Context`, `Effect`, `pipe`
- 功能：Gopeed服务测试
- 复杂度：中等（依赖gopeed/service.ts）
- 建议：跟随gopeed/service.ts的迁移

#### 11. `src/modules/gopeed/index.ts`
**状态**: **待迁移**
- 使用Effect的API：`Effect`
- 功能：Gopeed API路由
- 复杂度：低（简单Effect使用）
- 建议：转换为async/await + neverthrow

#### 12. `src/modules/gopeed/cron.ts` ✅ **已迁移到@elysia/cron和neverthrow**
**状态**: **已完成迁移**
- 已移除Effect的API：`Effect`, `Schedule`
- 已添加@elysia/cron导入：`cron`
- 已添加neverthrow导入：`Result`, `ok`, `err`
- 创建了新的错误类型：`CronError`, `GopeedApiError`, `DatabaseError`
- 功能：定时任务（每5分钟轮询活动下载任务）
- 复杂度：已降低（使用标准async/await和neverthrow）
- 迁移详情：使用`@elysia/cron`替换`Effect.Schedule`，移除所有Effect依赖

#### 13. `src/modules/local-models/service/enhanced-scanner.test.ts` ❌ **已删除**
**状态**: **已删除**

#### 14. `src/modules/local-models/service/scan-and-rebuild.test.ts` ❌ **已删除**
**状态**: **已删除**

#### 15. `src/modules/local-models/service/file-integrity.ts` ❌ **已删除**
**状态**: **已删除**

## 重构计划执行情况

### 已完成的工作
1. ✅ 在`scan-models.ts`中创建新的neverthrow函数
2. ✅ 更新`index.ts`中的API路由使用neverthrow
3. ✅ 创建错误类型和增强的扫描功能
4. ✅ 确保所有功能都得到保留：
   - 增量扫描功能 ✓
   - 一致性检查功能 ✓
   - 数据库修复功能 ✓
   - 控制台日志输出 ✓
   - API路由错误抛出 ✓
5. ✅ 删除旧文件：
   - `enhanced-scanner.ts`
   - `scan-and-rebuild.ts`
   - `enhanced-scanner.test.ts`
   - `scan-and-rebuild.test.ts`

### 待完成的工作
1. [ ] 清理scan-models.ts中的临时兼容性代码
2. [ ] 从package.json中移除effect依赖（如果不再需要）
3. [ ] 迁移settings模块：
   - `schema.ts` (使用Config和Schema)
   - `errors.ts` (使用Schema)
4. [ ] 迁移local-models模块：
   - `file-layout.ts` (使用Effect和pipe)
   - `file-integrity.ts` (使用Effect)
   - `errors.ts` (使用Schema)
5. [ ] 迁移gopeed模块：
   - `service.ts` (大量使用Effect生态系统)
   - `service.test.ts` (使用Effect)
   - `index.ts` (使用Effect)
   - `cron.ts` (使用Effect和Schedule)

## 错误处理模式对比

### Effect模式
```typescript
import { Effect, pipe } from "effect";

export const performIncrementalScan = (options: ScanOptions = {}): Effect.Effect<ScanResult, never, unknown> => {
  return Effect.gen(function* () {
    // Effect风格的代码
  });
};
```

### Neverthrow模式
```typescript
import { Result, ok, err } from "neverthrow";

export async function performIncrementalScan(
  options: ScanOptions = {},
): Promise<Result<EnhancedScanResult, ScanError>> {
  try {
    // Neverthrow风格的代码
    return ok(result);
  } catch (error) {
    return err(new ScanError(...));
  }
}
```

## 迁移优先级建议

1. **低复杂度优先**：
   - `settings/errors.ts`、`local-models/errors.ts`（仅Schema）
   - `local-models/file-integrity.ts`（简单Effect）
   - `gopeed/index.ts`（简单Effect）

2. **中等复杂度**：
   - `settings/schema.ts`（Config和Schema）
   - `local-models/file-layout.ts`（Effect和pipe）
   - `gopeed/cron.ts`（Effect和Schedule）

3. **高复杂度**：
   - `gopeed/service.ts`（完整的Effect生态系统）
   - `gopeed/service.test.ts`（依赖gopeed/service.ts）

## API端点变化示例

### 旧端点（Effect）
```typescript
.post("/enhanced-scan", async ({ body }) => {
  const options = body || {};
  const result = await Effect.runPromise(performIncrementalScan(options));
  return result;
})
```

### 新端点（Neverthrow）
```typescript
.post("/enhanced-scan", async ({ body }) => {
  const options = body || {};
  const result = await performIncrementalScan(options);
  if (result.isErr()) {
    throw new Error(`Enhanced scan failed: ${result.error.message}`);
  }
  return result.value;
})
```

## 向后兼容性

为了确保平稳过渡，保留了以下兼容性：

1. `scanAllModelFiles` 作为空对象占位符，避免立即破坏性更改
2. `scan-and-rebuild` 端点仍使用旧的Effect函数，但可以逐步迁移
3. 错误消息格式保持一致，便于前端处理

## 推荐后续步骤

1. **运行测试**: 确保已迁移的功能正常工作
2. **逐步迁移**: 按优先级迁移其他模块
3. **清理代码**: 移除临时兼容性代码
4. **更新依赖**: 从package.json中移除effect依赖（当所有模块迁移完成后）
5. **创建新的测试**: 为新的neverthrow函数编写测试
6. **文档更新**: 更新API文档以反映新的错误处理模式
