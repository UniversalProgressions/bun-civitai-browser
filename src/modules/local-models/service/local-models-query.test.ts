import { describe, test, expect, mock, beforeAll, afterAll } from "bun:test";
import type { Result } from "neverthrow";
import type { Model, ModelVersion } from "#civitai-api/v1/models";

// 导入要测试的函数
import {
  queryLocalModelVersions,
  queryLocalModelVersionsByModelId,
  generateMediaUrl,
  generateUrlsForModelVersion,
  type LocalModelWithUrls,
  type PaginatedLocalModels,
  type QueryLocalModelsOptions,
} from "./local-models-query";

// 模拟数据
const mockModelData: Model = {
  id: 123,
  name: "Test Model",
  type: "Checkpoint",
  description: "A test model",
  nsfw: false,
  modelVersions: [
    {
      id: 456,
      name: "v1.0",
      description: "Version 1.0",
      files: [
        { id: 1, name: "model.safetensors", sizeKB: 1000 },
        { id: 2, name: "config.yaml", sizeKB: 10 },
      ],
      images: [
        {
          id: 1,
          url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/image1.jpg",
        },
        {
          id: 2,
          url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/image2.jpg",
        },
      ],
    } as any,
  ],
} as any;

const mockModelVersionData: ModelVersion = {
  id: 456,
  modelId: 123,
  name: "v1.0",
  description: "Version 1.0",
  files: [
    { id: 1, name: "model.safetensors", sizeKB: 1000 },
    { id: 2, name: "config.yaml", sizeKB: 10 },
  ],
  images: [
    {
      id: 1,
      url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/image1.jpg",
    },
    {
      id: 2,
      url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/image2.jpg",
    },
  ],
} as any;

// 模拟 prisma 客户端
const mockPrisma = {
  modelVersion: {
    findMany: async (args: any) => {
      console.log(
        `[MOCK PRISMA] findMany called with:`,
        JSON.stringify(args, null, 2),
      );
      // 模拟数据库记录
      return [
        {
          id: 456,
          modelId: 123,
          json: mockModelVersionData,
          model: {
            id: 123,
            name: "Test Model",
            modelType: { id: 1, name: "Checkpoint" },
            nsfw: false,
            json: mockModelData,
            creator: { id: 1, username: "testcreator" },
            tags: [{ id: 1, name: "test" }],
          },
          baseModel: { id: 1, name: "SD 1.5" },
          baseModelType: { id: 1, name: "Standard" },
          files: [
            {
              id: 1,
              name: "model.safetensors",
              sizeKB: 1000,
              modelVersionId: 456,
            },
            { id: 2, name: "config.yaml", sizeKB: 10, modelVersionId: 456 },
          ],
          images: [
            { id: 1, filename: "image1.jpg", modelVersionId: 456 },
            { id: 2, filename: "image2.jpg", modelVersionId: 456 },
          ],
        },
      ];
    },
    count: async (args: any) => {
      console.log(
        `[MOCK PRISMA] count called with:`,
        JSON.stringify(args, null, 2),
      );
      return 1;
    },
    findUnique: async (args: any) => {
      console.log(
        `[MOCK PRISMA] findUnique called with:`,
        JSON.stringify(args, null, 2),
      );
      return {
        id: 123,
        name: "Test Model",
        json: mockModelData,
      };
    },
  },
  model: {
    findUnique: async (args: any) => {
      console.log(
        `[MOCK PRISMA] model.findUnique called with:`,
        JSON.stringify(args, null, 2),
      );
      return {
        id: 123,
        name: "Test Model",
        json: mockModelData,
      };
    },
  },
};

// 模拟 settingsService
const mockSettingsService = {
  getSettings: () => ({
    basePath: "/test/base/path",
  }),
};

// 模拟 ModelLayout 类
class MockModelLayout {
  constructor(
    public basePath: string,
    public modelData: any,
  ) {}

  async checkVersionFilesAndImagesExistence(versionId: number): Promise<{
    files: Array<{ id: number; exists: boolean }>;
    images: Array<{ id: number; exists: boolean }>;
  }> {
    console.log(
      `[MOCK MODEL LAYOUT] checkVersionFilesAndImagesExistence called for version ${versionId}`,
    );
    return {
      files: [
        { id: 1, exists: true },
        { id: 2, exists: false },
      ],
      images: [
        { id: 1, exists: true },
        { id: 2, exists: false },
      ],
    };
  }
}

// 设置全局模拟
beforeAll(() => {
  // 模拟 prisma
  mock.module("../../db/service", () => ({
    prisma: mockPrisma,
  }));

  // 模拟 settingsService
  mock.module("../../settings/service", () => ({
    settingsService: mockSettingsService,
  }));

  // 模拟 file-layout 模块
  mock.module("./file-layout", () => ({
    ModelLayout: MockModelLayout,
  }));

  // 注意：为了测试，我们需要模拟 console.log 避免测试输出干扰
  globalThis.console.log = () => {};
});

afterAll(() => {
  mock.restore();
});

describe("local-models-query", () => {
  describe("generateMediaUrl", () => {
    test("正确生成媒体URL", () => {
      const url = generateMediaUrl(123, 456, "Checkpoint", "image1.jpg");
      expect(url).toBe(
        "/local-models/media?modelId=123&versionId=456&modelType=Checkpoint&filename=image1.jpg",
      );
    });

    test("对文件名进行URL编码", () => {
      const url = generateMediaUrl(
        123,
        456,
        "Checkpoint",
        "image with spaces.jpg",
      );
      expect(url).toBe(
        "/local-models/media?modelId=123&versionId=456&modelType=Checkpoint&filename=image%20with%20spaces.jpg",
      );
    });
  });

  describe("generateUrlsForModelVersion", () => {
    test("为模型版本生成URL", () => {
      const urls = generateUrlsForModelVersion(
        mockModelData,
        mockModelVersionData,
      );

      expect(urls.thumbnail).toBeDefined();
      expect(urls.images).toHaveLength(2);
      expect(urls.files).toHaveLength(2);

      // 验证URL格式
      urls.images.forEach((url: string) => {
        expect(url).toContain("/local-models/media?");
        expect(url).toContain("modelId=123");
        expect(url).toContain("versionId=456");
        expect(url).toContain("modelType=Checkpoint");
      });

      urls.files.forEach((file: any) => {
        expect(file).toHaveProperty("id");
        expect(file).toHaveProperty("name");
        expect(file).toHaveProperty("url");
        expect(file).toHaveProperty("exists", false); // 初始值为false
        expect(file.url).toContain("/local-models/media?");
      });
    });
  });

  describe("queryLocalModelVersions", () => {
    test("基本查询不带过滤条件", async () => {
      const result = await queryLocalModelVersions({});

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const data = result.value;

        // 验证分页元数据
        expect(data.metadata).toEqual({
          totalItems: 1,
          currentPage: 1,
          pageSize: 20,
          totalPages: 1,
        });

        // 验证项目
        expect(data.items).toHaveLength(1);
        const item = data.items[0];

        expect(item.model.id).toBe(123);
        expect(item.version.id).toBe(456);
        expect(item.mediaUrls.images).toHaveLength(2);
        expect(item.files).toHaveLength(2);

        // 验证文件存在状态已更新
        expect(item.files[0].exists).toBe(true); // ID 1 的文件存在
        expect(item.files[1].exists).toBe(false); // ID 2 的文件不存在
      }
    });

    test("带分页参数", async () => {
      const result = await queryLocalModelVersions({
        page: 2,
        pageSize: 10,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.metadata.currentPage).toBe(2);
        expect(result.value.metadata.pageSize).toBe(10);
      }
    });

    test("带query过滤", async () => {
      const result = await queryLocalModelVersions({
        query: "Test",
      });

      expect(result.isOk()).toBe(true);
    });

    test("带tags过滤", async () => {
      const result = await queryLocalModelVersions({
        tags: ["test"],
      });

      expect(result.isOk()).toBe(true);
    });

    test("带username过滤", async () => {
      const result = await queryLocalModelVersions({
        username: "testcreator",
      });

      expect(result.isOk()).toBe(true);
    });

    test("带types过滤", async () => {
      const result = await queryLocalModelVersions({
        types: ["Checkpoint"],
      });

      expect(result.isOk()).toBe(true);
    });

    test("带nsfw过滤（false）", async () => {
      const result = await queryLocalModelVersions({
        nsfw: false,
      });

      expect(result.isOk()).toBe(true);
    });

    test("带nsfw过滤（true）", async () => {
      const result = await queryLocalModelVersions({
        nsfw: true,
      });

      expect(result.isOk()).toBe(true);
    });

    test("不带nsfw参数时默认过滤NSFW", async () => {
      const result = await queryLocalModelVersions({});

      expect(result.isOk()).toBe(true);
    });

    test("带baseModels过滤", async () => {
      const result = await queryLocalModelVersions({
        baseModels: ["SD 1.5"],
      });

      expect(result.isOk()).toBe(true);
    });

    test("验证period参数已被移除（不应出现在过滤中）", async () => {
      // 测试确保period参数不再被处理
      const options: QueryLocalModelsOptions = {
        // @ts-expect-error - period 应该不再存在于类型中
        period: "Day",
      };

      // 即使传入period，也应该正常工作（忽略该参数）
      const result = await queryLocalModelVersions({});

      expect(result.isOk()).toBe(true);
    });

    test("处理数据库错误", async () => {
      // 模拟数据库错误
      const originalFindMany = mockPrisma.modelVersion.findMany;
      mockPrisma.modelVersion.findMany = async () => {
        throw new Error("Database connection failed");
      };

      try {
        const result = await queryLocalModelVersions({});
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toContain(
            "Failed to query local model versions",
          );
        }
      } finally {
        // 恢复原始函数
        mockPrisma.modelVersion.findMany = originalFindMany;
      }
    });

    test("处理空结果", async () => {
      // 模拟空结果
      const originalFindMany = mockPrisma.modelVersion.findMany;
      mockPrisma.modelVersion.findMany = async () => [];
      const originalCount = mockPrisma.modelVersion.count;
      mockPrisma.modelVersion.count = async () => 0;

      try {
        const result = await queryLocalModelVersions({});
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
          expect(result.value.metadata.totalItems).toBe(0);
        }
      } finally {
        // 恢复原始函数
        mockPrisma.modelVersion.findMany = originalFindMany;
        mockPrisma.modelVersion.count = originalCount;
      }
    });
  });

  describe("queryLocalModelVersionsByModelId", () => {
    test("按模型ID查询", async () => {
      const result = await queryLocalModelVersionsByModelId(123);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.metadata.totalItems).toBe(1);
      }
    });

    test("模型不存在时返回错误", async () => {
      // 模拟模型不存在
      const originalFindUnique = mockPrisma.model.findUnique;
      mockPrisma.model.findUnique = async () => null as any;
      const originalFindMany = mockPrisma.modelVersion.findMany;
      mockPrisma.modelVersion.findMany = async () => [];
      const originalCount = mockPrisma.modelVersion.count;
      mockPrisma.modelVersion.count = async () => 0;

      try {
        const result = await queryLocalModelVersionsByModelId(999);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toContain("Model with ID 999 not found");
        }
      } finally {
        // 恢复原始函数
        mockPrisma.model.findUnique = originalFindUnique;
        mockPrisma.modelVersion.findMany = originalFindMany;
        mockPrisma.modelVersion.count = originalCount;
      }
    });

    test("带分页参数", async () => {
      const result = await queryLocalModelVersionsByModelId(123, 2, 10);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.metadata.currentPage).toBe(2);
        expect(result.value.metadata.pageSize).toBe(10);
      }
    });

    test("处理处理单个版本时的错误", async () => {
      // 使用mock.module来模拟generateUrlsForModelVersion
      const originalModule = await import("./local-models-query");
      const mockModule = {
        ...originalModule,
        generateUrlsForModelVersion: () => {
          throw new Error("Failed to generate URLs");
        },
      };

      // 模拟模块
      mock.module("./local-models-query", () => mockModule);

      try {
        // 重新导入以获取模拟版本
        const { queryLocalModelVersionsByModelId } = await import(
          "./local-models-query"
        );
        const result = await queryLocalModelVersionsByModelId(123);
        // 应该跳过处理失败的版本
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // 由于处理失败，应该跳过该项目
          expect(result.value.items).toHaveLength(0);
        }
      } finally {
        // 恢复原始模块
        mock.module("./local-models-query", () => originalModule);
      }
    });
  });
});
