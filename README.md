# bun-civitai-browser

一个桌面级Web应用，为AI创作者和爱好者提供无缝浏览、下载和管理Civitai模型的能力，注重性能、离线功能和用户体验。

## ✨ 特性

- 🚀 **高性能**：基于Bun和ElysiaJS的现代化技术栈
- 🔍 **模型浏览**：快速响应的Civitai模型浏览界面
- 📥 **可靠下载**：支持进度跟踪和断点续传的模型下载
- 💾 **本地管理**：本地模型管理，保持元数据完整性
- 📱 **离线支持**：支持离线浏览已缓存/下载的模型
- 🔒 **隐私优先**：本地优先架构，保障数据隐私

## 🛠 技术栈

- **运行时**: Bun - 高性能JavaScript运行时
- **后端框架**: ElysiaJS - 类型安全、高性能的Web框架
- **前端**: React 19 + TypeScript + Vite
- **UI框架**: Ant Design v6 + Tailwind CSS v4
- **数据库**: SQLite + Prisma ORM
- **状态管理**: Jotai + TanStack Query
- **下载管理**: @gopeed/rest
- **类型验证**: Arktype

## 📁 项目结构

```
bun-civitai-browser/
├── src/
│   ├── index.ts              # 主服务器入口
│   ├── dev.ts               # 开发服务器配置
│   ├── civitai-api/         # Civitai API类型定义和客户端
│   ├── html/                # 前端React应用
│   └── modules/             # 后端功能模块
│       ├── civitai/         # Civitai API集成
│       ├── local-models/    # 本地模型管理
│       ├── db/              # 数据库服务
│       ├── gopeed/          # 下载管理
│       └── settings/        # 应用配置
├── schema.prisma           # 数据库Schema定义
├── prisma.config.ts        # Prisma配置
└── vite.config.ts          # Vite构建配置
```

## 🚀 快速开始

### 环境要求

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0 (如不使用Bun)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/UniversalProgressions/bun-civitai-browser.git
   cd bun-civitai-browser
   ```

2. **安装依赖**
   ```bash
   bun install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env
   # 编辑.env文件，设置Civitai API密钥等
   ```

4. **初始化数据库**
   ```bash
   bun run prisma:generate
   bun run prisma:migrate
   ```

5. **启动开发服务器**
   ```bash
   # 启动后端服务器 (端口3000)
   bun run dev:server
   
   # 在新终端启动前端开发服务器 (端口5173)
   bun run dev:client
   ```

6. **访问应用**
   - 前端: http://localhost:5173
   - API文档: http://localhost:3000/swagger

## 🔧 主要功能

### 模型下载流程

1. **从Civitai获取模型JSON数据**
2. **选择要下载的ModelVersion**
3. **确定本地存储结构**（使用file-layout.ts模块）
4. **创建Gopeed下载任务**
5. **保存JSON到数据库**（Model.json中modelVersions设为空数组）
6. **下载文件到本地目录**
7. **数据库记录下载状态**

### 文件存储布局

```
{basePath}/{modelType}/{modelId}/{modelId}.api-info.json
{basePath}/{modelType}/{modelId}/{versionId}/files/{fileName}.xxx
{basePath}/{modelType}/{modelId}/{versionId}/{versionId}.api-info.json
{basePath}/{modelType}/{modelId}/{versionId}/media/{imageId}.xxx
```

### Gopeed集成

- **责任划分**：下载并发、队列管理、重试逻辑完全由Gopeed处理
- **状态监控**：应用层提供任务状态查询接口
- **前端集成**：WebUI显示下载进度，用户可手动重试
- **错误恢复**：通过ModelVersion ID可从Civitai重新获取元数据

## 📊 数据库设计

### Schema设计原则

- **去重存储**：Model表中JSON字段的`modelVersions`设为空数组
- **关系完整**：通过外键关联Model和ModelVersion
- **JSON字段**：存储原始API响应，保持数据完整性
- **索引优化**：关键查询字段建立索引

### 数据恢复策略

- **主恢复路径**：通过ModelVersion ID从Civitai重新获取元数据
- **文件系统扫描**：可从本地文件结构重建部分信息
- **已知限制**：SQLite数据库损坏可能导致元数据丢失
- **缓解措施**：文件路径包含足够信息重新获取数据

## 📖 API文档

### 主要端点

- `GET /civitai_api/v1/models` - 浏览Civitai模型
- `POST /civitai_api/v1/download/model-version` - 下载模型版本
- `GET /local-models/models/on-disk` - 查询本地模型
- `GET /settings` - 获取应用设置
- `GET /swagger` - OpenAPI文档（开发模式）

### 开发命令

```bash
# 开发服务器
bun run dev:server      # 启动后端开发服务器 (端口3000)
bun run dev:client      # 启动前端开发服务器 (端口5173)

# 构建
bun run build:client    # 构建前端到public/目录

# 数据库操作
bun run prisma:generate # 生成Prisma客户端类型
bun run prisma:migrate  # 运行数据库迁移
bun run prisma:reset    # 重置数据库（仅开发环境）
```

## 🎯 未来规划

### 短期目标（1-3个月）
- 实现高级搜索和过滤功能
- 添加模型标记和自定义分类
- 改进下载可靠性和恢复机制
- 增强本地模型扫描性能
- 支持批量操作（批量下载、删除等）

### 中期目标（3-6个月）
- 跨平台桌面应用打包
- 高级分析和统计功能（隐私优先的个人使用统计）

### 长期愿景（6个月以上）
- 持续优化核心功能性能和用户体验
- 扩展对更多模型格式的支持
- 增强离线功能和工作流集成

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请：
1. 查阅[内存库文档](memory-bank/)中的详细说明
2. 在GitHub仓库中创建Issue
3. 参考已实现的[示例代码](src/civitai-api/v1/examples/)

---

**版本**: 1.0.50  
**状态**: 积极开发中  
**最后更新**: 2026年2月