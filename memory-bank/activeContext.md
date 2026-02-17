# 模型文件下载功能 - 实现计划

## 当前状态 (2026-02-17)

### ✅ 已完成的组件

1. **数据库架构** (`schema.prisma`)
   - ModelVersionFile 和 ModelVersionImage 表已包含下载任务跟踪字段
   - gopeedTaskId, gopeedTaskFinished, gopeedTaskDeleted 字段支持任务状态管理

2. **Gopeed 服务层** (`src/modules/gopeed/service.ts`)
   - 完整的下载任务创建和管理服务
   - Effect 模式的错误处理和依赖注入
   - 任务状态枚举 (FAILED, CREATED, FINISHED, CLEANED)
   - 数据库记录更新函数

3. **Civitai 下载集成** (`src/modules/civitai/index.ts`)
   - `POST /civitai_api/v1/download/model-version` 接口
   - 处理模型文件下载 URL 解析
   - 批量创建 Gopeed 下载任务
   - 保存模型元数据 JSON 文件
   - 更新数据库记录

4. **前端下载界面** (`src/html/pages/downloadPanel.tsx`)
   - 模型信息展示和下载按钮
   - 调用后端下载接口

5. **配置系统** - 包含 Gopeed API 主机和令牌配置

### ❌ 缺失的关键组件

1. **Gopeed API 路由器** - `src/modules/gopeed/index.ts` 文件是空的
   - 没有将 Gopeed 服务暴露为 REST API
   - 缺少下载任务管理端点 (获取任务状态、暂停/继续/删除任务)

2. **下载任务管理界面**
   - 查看当前下载任务列表
   - 实时进度显示
   - 任务控制 (暂停/继续/删除)

3. **状态同步机制**
   - 使用 @elysiajs/cron 实现轮询服务
   - 任务状态自动更新

4. **下载队列管理**
   - Effect-based 重试逻辑 (最多3次)
   - 失败重试机制

## 实施计划

### 阶段 1: 创建 Gopeed API 路由器 (核心)
1. 实现 `src/modules/gopeed/index.ts` - Gopeed Elysia 路由器
   - 任务管理端点 (获取、暂停、继续、删除)
   - 集成 Effect 错误处理

### 阶段 2: 集成 Gopeed 服务
1. 修改 `src/modules/civitai/index.ts` 改用 Effect 服务而非直接 @gopeed/rest
2. 将 Gopeed 路由器集成到主应用

### 阶段 3: 实现 @elysiajs/cron 轮询服务
1. 创建轮询服务定期检查下载任务状态
2. 自动更新数据库中的任务状态
3. 使用 Effect 实现重试逻辑 (最多 3 次)

### 阶段 4: 前端下载管理界面
1. 创建下载管理器页面
2. 实现任务状态显示和控制
3. 集成轮询更新

### 阶段 5: 完善重试机制
1. Effect-based 重试逻辑
2. 失败任务自动重试 (最多 3 次)
3. 错误处理和状态跟踪

## 技术决策

1. **轮询机制**: 使用 @elysiajs/cron 实现定期轮询，建议每 30 秒检查一次
2. **重试策略**: 使用 Effect 的 `Effect.retry` 或 `Schedule` 实现 3 次重试
3. **错误处理**: 区分网络错误、认证错误、文件存在错误等
4. **并发控制**: 无需并发下载限制

## 下一步行动

完成计划总结后，切换至 ACT MODE 开始实施阶段 1。