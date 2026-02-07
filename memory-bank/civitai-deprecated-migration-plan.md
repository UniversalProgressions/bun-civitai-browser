# Civitai-Deprecated 模块迁移计划

## 1. 概述

本文件详细说明了 `src/modules/civitai-deprecated` 模块的迁移计划。该模块目前作为一个Elysia模块过于臃肿，需要拆分为多个专门化的模块，并使用重构后的 `civitai-api/v1/models` 类型系统。

## 2. 迁移目标

### 2.1 主要目标

1. **模块化重构**：将庞大的 `civitai-deprecated` 模块拆分为多个专注的Elysia模块
2. **类型系统统一**：使用重构后的 `civitai-api/v1/models` 类型替换废弃的 `civitai-deprecated/models` 类型
3. **测试覆盖率**：保持或达到 **80%** 的测试覆盖率
4. **代码质量提升**：改善模块间的依赖关系，降低耦合度

### 2.2 非目标

- 向后兼容性（为了更好的程序结构，接受短期的不兼容）
- 功能增加（专注于重构，不添加新功能）

## 3. 当前状态分析

### 3.1 模块结构

```
src/modules/civitai-deprecated/
├── index/                    # 路由模块
│   ├── index.ts             # 主路由组合器
│   ├── civitai.ts           # Civitai API 代理
│   ├── download.ts          # 下载功能（重点关注）
│   ├── local.ts             # 本地模型管理
│   ├── db.ts               # 数据库操作
│   └── *.test.ts           # 测试文件
├── models/                  # 废弃的类型定义
│   ├── creators_endpoint.ts
│   ├── models_endpoint.ts   # 主要模型类型
│   ├── modelId_endpoint.ts
│   ├── modelVersion_endpoint.ts
│   ├── trpcResponse.ts
│   └── baseModels/
└── service/                 # 业务逻辑
    ├── sharedUtils.ts
    ├── utils.ts
    ├── fileLayout.ts
    └── localModels.ts
```

### 3.2 依赖关系分析

#### 3.2.1 `download.ts` 的关键依赖

```typescript
// 废弃的模型类型
import {
  model,
  type Model,
  type ModelVersion,
} from "#modules/civitai-deprecated/models/models_endpoint.js";

// 其他依赖
import { getSettings } from "#modules/settings/service.js";
import { getRequester } from "../service/utils";
import {
  ModelLayout,
  getMediaDir,
} from "#modules/civitai-deprecated/service/fileLayout.js";
import { upsertOneModelVersion } from "../../db/crud/modelVersion";
import { extractFilenameFromUrl } from "../service/sharedUtils";
```

#### 3.2.2 整体依赖图

```
download.ts
├── models/models_endpoint.ts (废弃)
├── settings/service.js (稳定)
├── service/utils.ts (需要更新)
├── service/fileLayout.ts (需要更新)
├── db/crud/modelVersion.ts (稳定)
└── service/sharedUtils.ts (需要更新)

civitai.ts
├── models/models_endpoint.ts (废弃)
├── models/modelId_endpoint.ts (废弃)
├── models/modelVersion_endpoint.ts (废弃)
└── service/sharedUtils.ts (需要更新)

local.ts
├── models/models_endpoint.ts (废弃)
├── models/modelId_endpoint.ts (废弃)
└── service/localModels.ts (需要更新)
```

### 3.3 模型类型对比

#### 废弃模型系统 (`civitai-deprecated/models/`)

- **结构**：分散在不同端点文件中，有重复定义
- **验证**：使用 arktype 进行运行时验证
- **问题**：
  - 类型定义重复（如 `modelVersion_file` 在多处定义）
  - 缺少共享类型
  - 与 API 响应结构紧密耦合

#### 新模型系统 (`civitai-api/v1/models/`)

- **结构**：模块化，有共享类型
- **组织**：
  - `shared-types.ts`：跨端点共享的类型
  - `models.ts`：/models 端点类型
  - `model-id.ts`：/models/{id} 端点类型
  - `model-version.ts`：/model-versions/{id} 端点类型
  - `creators.ts`：创作者相关类型
- **优点**：
  - DRY 原则：消除重复定义
  - 更好的类型安全性
  - 清晰的端点特定类型

## 4. 迁移策略

### 4.1 基本原则

1. **自底向上迁移**：先迁移基础工具，再迁移业务逻辑
2. **独立模块优先**：依赖少的模块先迁移
3. **类型先行**：先更新类型定义，再更新实现
4. **测试驱动**：每个迁移步骤都应有对应的测试

### 4.2 迁移顺序（推荐）

#### 阶段一：基础工具迁移（优先级：高）

1. **`service/sharedUtils.ts`**
   - 依赖：无外部模型依赖
   - 迁移内容：更新函数签名使用新类型

2. **`service/utils.ts`**
   - 依赖：`getRequester` 工具函数
   - 迁移内容：保持功能，可能不需要类型更新

#### 阶段二：文件布局服务迁移（优先级：高）

3. **`service/fileLayout.ts`**
   - 依赖：废弃的 `Model` 类型
   - 迁移内容：替换为新 `Model` 类型
   - 影响：`download.ts` 和 `local.ts`

#### 阶段三：下载模块迁移（优先级：高）

4. **`index/download.ts`**
   - 依赖：废弃的 `Model` 和 `ModelVersion` 类型
   - 迁移内容：
     - 更新导入使用 `civitai-api/v1/models`
     - 调整类型兼容性
     - 保持 API 接口不变

#### 阶段四：本地模型服务迁移（优先级：中）

5. **`service/localModels.ts`**
   - 依赖：废弃的 `Model` 类型
   - 迁移内容：替换为新类型

6. **`index/local.ts`**
   - 依赖：`service/localModels.ts` 和废弃模型
   - 迁移内容：更新类型导入和使用

#### 阶段五：API代理迁移（优先级：中）

7. **`index/civitai.ts`**
   - 依赖：多个废弃模型类型
   - 迁移内容：全面更新为新类型系统

#### 阶段六：数据库路由迁移（优先级：低）

8. **`index/db.ts`**
   - 依赖：相对独立
   - 迁移内容：检查并更新可能的类型引用

## 5. 新模块设计

### 5.1 建议的新模块结构

```
src/modules/
├── civitai/              # 新 Civitai 模块
│   ├── download/         # 下载功能模块
│   │   ├── index.ts     # 路由定义
│   │   ├── service.ts   # 业务逻辑
│   │   └── types.ts     # 类型定义（可选）
│   ├── local/           # 本地模型管理
│   ├── api/             # API 代理
│   └── db/              # 数据库操作
└── civitai-api/         # 现有的 API 客户端和类型
```

### 5.2 模块职责划分

#### 模块 1: `civitai/download`

- **职责**：模型版本下载管理
- **包含**：
  - Gopeed 客户端集成
  - 下载任务管理
  - 文件验证和错误处理
- **依赖**：
  - `civitai-api/v1/models`（类型）
  - `settings/service`（配置）
  - `db/crud/modelVersion`（数据库操作）

#### 模块 2: `civitai/local`

- **职责**：本地模型扫描和管理
- **包含**：
  - 文件系统扫描
  - 模型元数据提取
  - 本地数据库同步
- **依赖**：
  - `civitai-api/v1/models`（类型）
  - `service/fileLayout`（文件布局）

#### 模块 3: `civitai/api`

- **职责**：Civitai API 代理和缓存
- **包含**：
  - API 端点镜像
  - 响应缓存
  - 请求转发
- **依赖**：
  - `civitai-api/v1/client`（API 客户端）
  - `civitai-api/v1/models`（类型）

#### 模块 4: `civitai/db`

- **职责**：模型相关数据库操作
- **包含**：
  - 模型数据持久化
  - 查询接口
  - 数据同步
- **依赖**：
  - Prisma 客户端
  - `civitai-api/v1/models`（类型）

## 6. 具体迁移步骤

### 6.1 步骤 1：分析类型映射

#### 废弃类型 → 新类型映射表

| 废弃类型                    | 新类型                     | 位置                                     |
| --------------------------- | -------------------------- | ---------------------------------------- |
| `Model`                     | `Model`                    | `civitai-api/v1/models/models.ts`        |
| `ModelVersion`              | `ModelVersion`             | `civitai-api/v1/models/models.ts`        |
| `ModelId_ModelId`           | `ModelById`                | `civitai-api/v1/models/model-id.ts`      |
| `ModelId_ModelVersion`      | `ModelByIdVersion`         | `civitai-api/v1/models/model-id.ts`      |
| `ModelVersion_ModelVersion` | `ModelVersionEndpointData` | `civitai-api/v1/models/model-version.ts` |
| `Creator`                   | `Creator`                  | `civitai-api/v1/models/creators.ts`      |
| `ModelVersionFile`          | `ModelFile`                | `civitai-api/v1/models/shared-types.ts`  |
| `ModelVersionImage`         | `ModelImage`               | `civitai-api/v1/models/shared-types.ts`  |

### 6.2 步骤 2：创建新模块骨架

为每个新模块创建基本结构：

1. `src/modules/civitai/download/index.ts`
2. `src/modules/civitai/download/service.ts`
3. 相应的测试文件

### 6.3 步骤 3：迁移 `sharedUtils.ts`

```typescript
// 修改前
import { ModelId_ModelId } from "#modules/civitai-deprecated/models/modelId_endpoint.js";

// 修改后
import { ModelById } from "#modules/civitai-api/v1/models/model-id.js";
```

### 6.4 步骤 4：迁移 `fileLayout.ts`

更新 `ModelLayout` 类使用新的 `Model` 类型：

```typescript
// 修改前
import { Model } from "../models/models_endpoint";

// 修改后
import { Model } from "#modules/civitai-api/v1/models/models";
```

### 6.5 步骤 5：迁移 `download.ts`

关键修改：

1. 更新导入语句
2. 调整类型注解
3. 验证功能兼容性

### 6.6 步骤 6：更新主路由

```typescript
// 修改前
import CivitAIRouter from "./civitai-deprecated/index/index";

// 修改后
import { router as civitaiRouter } from "./civitai/index";
```

### 6.7 步骤 7：清理废弃代码

1. 删除 `civitai-deprecated` 模块
2. 更新所有引用
3. 运行完整测试套件

## 7. 测试策略

### 7.1 测试覆盖率目标：80%

### 7.2 测试类型

1. **单元测试**：每个服务函数的独立测试
2. **集成测试**：模块间协作测试
3. **API测试**：路由端点的HTTP测试
4. **类型测试**：TypeScript 类型兼容性测试

### 7.3 测试迁移顺序

1. 为每个新模块编写基础测试
2. 迁移过程中保持现有测试运行
3. 每次迁移后运行完整测试套件
4. 逐步替换旧的测试文件

### 7.4 关键测试场景

1. `download.ts`：
   - 模型文件下载URL生成
   - Gopeed任务创建
   - 错误处理（401，408等）
2. `fileLayout.ts`：
   - 文件路径生成正确性
   - 模型版本目录结构
3. `sharedUtils.ts`：
   - URL解析函数
   - 类型转换函数

## 8. 风险与缓解措施

### 8.1 技术风险

| 风险           | 可能性 | 影响 | 缓解措施                  |
| -------------- | ------ | ---- | ------------------------- |
| 类型不兼容     | 高     | 中   | 创建类型适配器，逐步迁移  |
| API接口变更    | 中     | 高   | 保持API接口不变，内部重构 |
| 测试覆盖率下降 | 中     | 中   | 迁移前编写测试，TDD方法   |
| 数据库数据丢失 | 低     | 高   | 备份数据库，使用事务      |

### 8.2 迁移风险

1. **循环依赖**：仔细分析依赖图，按顺序迁移
2. **功能回归**：使用集成测试确保功能完整性
3. **性能下降**：监控关键操作性能，优化热点

### 8.3 回滚计划

如果迁移过程中出现重大问题：

1. 保留 `civitai-deprecated` 的git分支
2. 逐步回滚问题模块
3. 使用特性标志控制新旧版本

## 9. 时间估算

### 9.1 按阶段估算

| 阶段     | 任务             | 预计时间    | 优先级 |
| -------- | ---------------- | ----------- | ------ |
| 阶段一   | 基础工具迁移     | 1-2天       | 高     |
| 阶段二   | 文件布局服务迁移 | 1-2天       | 高     |
| 阶段三   | 下载模块迁移     | 2-3天       | 高     |
| 阶段四   | 本地模型服务迁移 | 2-3天       | 中     |
| 阶段五   | API代理迁移      | 3-4天       | 中     |
| 阶段六   | 清理和测试       | 2-3天       | 高     |
| **总计** |                  | **11-17天** |        |

### 9.2 关键里程碑

1. **M1**：`sharedUtils.ts` 和 `fileLayout.ts` 迁移完成
2. **M2**：`download.ts` 迁移完成并通过测试
3. **M3**：所有模块迁移完成
4. **M4**：废弃代码清理，测试覆盖率达标

## 10. 成功标准

### 10.1 技术成功标准

1. ✅ 所有模块使用 `civitai-api/v1/models` 类型系统
2. ✅ 测试覆盖率 ≥ 80%
3. ✅ 无编译错误和类型错误
4. ✅ API接口向后兼容（功能层面）
5. ✅ 模块间依赖关系清晰

### 10.2 业务成功标准

1. ✅ 下载功能正常工作
2. ✅ 本地模型管理功能正常
3. ✅ Civitai API代理功能正常
4. ✅ 用户界面无功能损失
5. ✅ 性能无明显下降

## 11. 附录

### 11.1 类型兼容性检查清单

- [ ] `Model` 类型字段兼容性
- [ ] `ModelVersion` 类型字段兼容性
- [ ] 文件结构字段映射
- [ ] 图像结构字段映射
- [ ] 统计信息字段映射

### 11.2 工具和命令

```bash
# 运行测试
bun test src/modules/civitai-deprecated/

# 类型检查
bun tsc --noEmit

# 构建检查
bun run build:client

# 开发服务器测试
bun run dev:server
```

### 11.3 参考文档

1. `civitai-api/v1/models/index.ts` - 新类型系统入口
2. `civitai-deprecated/models/` - 废弃类型定义
3. `memory-bank/projectbrief.md` - 项目概述

---

**文档版本**: 1.0  
**创建日期**: 2026-02-07  
**最后更新**: 2026-02-07  
**负责人**: 项目维护者

**下一步行动**：

1. 根据此计划开始阶段一迁移
2. 定期更新进展
3. 遇到问题时调整计划
