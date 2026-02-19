# 开发工具脚本

本目录包含用于开发和调试的实用工具脚本。

## 本地模型相关工具 (`local-models/`)

### 1. `scan-integration.ts`
**用途**: 执行端到端的本地模型扫描测试

**功能**:
- 检查设置配置是否正确
- 执行完整的扫描流程（非增量模式）
- 显示扫描统计信息（扫描文件数、新增记录数、已存在记录数）
- 输出失败文件列表

**使用方法**:
```bash
bun run tools/local-models/scan-integration.ts
```

### 2. `debug-paths.ts`
**用途**: 调试文件路径提取逻辑

**功能**:
- 扫描指定目录下的模型文件
- 显示文件路径解析过程
- 验证 `extractModelInfo` 函数的正确性
- 输出不匹配文件的原因分析

**使用方法**:
```bash
bun run tools/local-models/debug-paths.ts
```

### 3. `validate-json.ts`
**用途**: 验证本地存储的JSON文件结构

**功能**:
- 检查模型和版本的JSON文件是否存在
- 分析JSON结构是否与schema匹配
- 显示关键字段的类型和值
- 用于诊断JSON解析和验证问题

**注意**: 此工具使用硬编码的示例文件路径，实际使用时可能需要修改

**使用方法**:
```bash
bun run tools/local-models/validate-json.ts
```

## 工具特点

1. **实际执行**: 这些工具直接操作文件系统和数据库，不是模拟测试
2. **诊断功能**: 提供详细的调试输出，便于排查问题
3. **环境依赖**: 需要正确的设置配置和实际文件存在
4. **开发辅助**: 主要用于开发和调试阶段

## 使用建议

1. **扫描前准备**: 确保 `settingsService` 配置正确，特别是 `basePath` 指向正确的模型存储目录
2. **数据安全**: 这些工具可能修改数据库，建议在测试环境中使用
3. **问题排查**: 当扫描或数据库同步出现问题时，使用这些工具进行诊断

## 与单元测试的区别

- **单元测试**: 隔离、模拟、快速、无副作用，用于验证代码逻辑
- **这些工具**: 实际执行、依赖环境、有副作用、用于验证真实系统功能

## 示例输出

### scan-integration.ts 示例:
```
=== Testing Local Models Scan ===
✓ Settings configured:
  Base Path: C:\Users\GF\freespace\AI\civitai_models
  Civitai API Token: Set
  Gopeed API Host: http://127.0.0.1:9999

=== Starting Enhanced Scan ===
✓ Scan completed successfully!

Scan Results:
  Total files scanned: 3
  New records added: 3
  Existing records found: 0
  Scan duration: 241ms (0.24s)
```

### debug-paths.ts 示例:
```
=== Debugging File Paths ===
Base Path: C:\Users\GF\freespace\AI\civitai_models
Pattern: C:/Users/GF/freespace/AI/civitai_models/**/*.{safetensors,ckpt,pt,pth,bin,onnx,gguf}

Found 3 files:

1. C:/Users/GF/freespace/AI/civitai_models/Checkpoint/934764/2483605/files/miaomiaoHarem_v19.safetensors
   Parts (9): C: > Users > GF > freespace > AI > civitai_models > Checkpoint > 934764 > 2483605 > files > miaomiaoHarem_v19.safetensors
   ✓ Matched: modelType="Checkpoint", modelId=934764, versionId=2483605
     fileName="miaomiaoHarem_v19", extension=".safetensors"
```

### validate-json.ts 示例:
```
=== Checking JSON Files ===
Base Path: C:\Users\GF\freespace\AI\civitai_models

=== Checking: LORA/2398126/2696373 ===
Model JSON: C:\Users\GF\freespace\AI\civitai_models\LORA\2398126\model.json
Version JSON: C:\Users\GF\freespace\AI\civitai_models\LORA\2398126\2696373\version.json
Model JSON exists: true
Version JSON exists: true

Version JSON structure:
- availability: Public (type: string)
- images count: 4
  First image:
    id: 1 (type: number)
    url: https://example.com/image1.jpg
    nsfwLevel: None
- index: 0 (type: number)
...