import { describe, test, expect } from "bun:test";
import type {
  ModelVersionCore,
  ModelVersionAny,
  ModelCore,
  ModelAny,
} from "../model-version-abstract";
import {
  isModelsVersion,
  isModelByIdVersion,
  isModelVersionEndpoint,
  isModelsEndpointModel,
  isModelByIdEndpointModel,
  toModelVersionCore,
  toModelCore,
  getModelId,
  getIndex,
  getAvailability,
  getPublishedAt,
  findModelVersion,
  findModelVersionTyped,
  findModel,
  findModelTyped,
  getImageId,
  ensureImageIds,
} from "../model-version-abstract";
import { extractIdFromImageUrl } from "../../utils";

// Mock data for testing
const mockModelsVersion = {
  id: 100,
  name: "Test Version",
  baseModel: "SD 1.5",
  baseModelType: null,
  publishedAt: "2024-01-01T00:00:00.000Z",
  availability: "Public" as const,
  index: 0,
  nsfwLevel: 1,
  description: "Test version from models endpoint",
  files: [
    {
      id: 1,
      sizeKB: 1024,
      name: "model.safetensors",
      type: "Model",
      metadata: { format: "SafeTensor" },
      scannedAt: undefined,
      hashes: {},
      downloadUrl: "https://example.com/model.safetensors",
    },
  ],
  images: [
    {
      id: 1,
      url: "https://example.com/image.jpg",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "abc123",
      type: "image",
    },
  ],
  stats: {
    downloadCount: 100,
    thumbsUpCount: 50,
  },
  trainedWords: ["test", "example"],
};

const mockModelByIdVersion = {
  id: 200,
  name: "Test Version 2",
  baseModel: "SDXL",
  baseModelType: null,
  publishedAt: "2024-02-01T00:00:00.000Z",
  availability: "EarlyAccess" as const,
  index: 1,
  nsfwLevel: 2,
  description: "Test version from model-id endpoint",
  files: [
    {
      id: 2,
      sizeKB: 2048,
      name: "model2.safetensors",
      type: "Model",
      metadata: { format: "SafeTensor" },
      scannedAt: undefined,
      hashes: {},
      downloadUrl: "https://example.com/model2.safetensors",
    },
  ],
  images: [
    {
      id: 2,
      url: "https://example.com/image2.jpg",
      nsfwLevel: 2,
      width: 768,
      height: 768,
      hash: "def456",
      type: "image",
    },
  ],
  stats: {
    downloadCount: 200,
    thumbsUpCount: 100,
  },
};

const mockModelVersionEndpoint = {
  id: 300,
  modelId: 999,
  name: "Test Version 3",
  baseModel: "SD 2.1",
  baseModelType: "Stable Diffusion 2.1",
  publishedAt: "2024-03-01T00:00:00.000Z",
  nsfwLevel: 3,
  description: "Test version from model-version endpoint",
  files: [
    {
      id: 3,
      sizeKB: 4096,
      name: "model3.safetensors",
      type: "Model",
      metadata: { format: "SafeTensor" },
      scannedAt: undefined,
      hashes: {},
      downloadUrl: "https://example.com/model3.safetensors",
    },
  ],
  images: [
    {
      id: 3,
      url: "https://example.com/image3.jpg",
      nsfwLevel: 3,
      width: 1024,
      height: 1024,
      hash: "ghi789",
      type: "image",
    },
  ],
  stats: {
    downloadCount: 300,
    ratingCount: 150,
    rating: 4.5,
    thumbsUpCount: 200,
  },
  trainedWords: ["detailed", "high quality"],
};

// Mock data for Model testing
const mockModelsEndpointModel = {
  id: 1000,
  name: "Test Model from models endpoint",
  description: "A test model from the models endpoint",
  type: "Checkpoint" as const,
  poi: false,
  nsfw: false,
  nsfwLevel: 1,
  creator: {
    username: "testcreator",
    image: "https://example.com/avatar.jpg",
  },
  stats: {
    downloadCount: 1000,
    favoriteCount: 500,
    thumbsUpCount: 800,
    thumbsDownCount: 50,
    commentCount: 100,
    ratingCount: 200,
    rating: 4.8,
    tippedAmountCount: 100,
  },
  tags: ["test", "ai", "art"],
  modelVersions: [mockModelsVersion],
};

const mockModelByIdEndpointModel = {
  id: 2000,
  name: "Test Model from model-id endpoint",
  description: "A test model from the model-id endpoint",
  type: "LORA" as const,
  poi: true,
  nsfw: true,
  nsfwLevel: 3,
  creator: {
    username: "anothercreator",
    image: "https://example.com/avatar2.jpg",
  },
  stats: {
    downloadCount: 2000,
    favoriteCount: 1000,
    thumbsUpCount: 1800,
    thumbsDownCount: 100,
    commentCount: 200,
    ratingCount: 400,
    rating: 4.9,
    tippedAmountCount: 200,
  },
  tags: ["lora", "style", "anime"],
  modelVersions: [mockModelByIdVersion],
};

describe("ModelVersionAbstract", () => {
  describe("Type Guards", () => {
    test("isModelsVersion correctly identifies models endpoint version", () => {
      expect(isModelsVersion(mockModelsVersion)).toBe(true);
      expect(isModelsVersion(mockModelByIdVersion)).toBe(true); // Also has index and availability
      expect(isModelsVersion(mockModelVersionEndpoint)).toBe(false);
    });

    test("isModelByIdVersion correctly identifies model-id endpoint version", () => {
      expect(isModelByIdVersion(mockModelByIdVersion)).toBe(true);
      expect(isModelByIdVersion(mockModelsVersion)).toBe(true); // Also has index and availability
      expect(isModelByIdVersion(mockModelVersionEndpoint)).toBe(false);
    });

    test("isModelVersionEndpoint correctly identifies model-version endpoint version", () => {
      expect(isModelVersionEndpoint(mockModelVersionEndpoint)).toBe(true);
      expect(isModelVersionEndpoint(mockModelsVersion)).toBe(false);
      expect(isModelVersionEndpoint(mockModelByIdVersion)).toBe(false);
    });
  });

  describe("toModelVersionCore", () => {
    test("extracts core fields from models endpoint version", () => {
      const core = toModelVersionCore(mockModelsVersion);

      expect(core).toEqual({
        id: 100,
        name: "Test Version",
        baseModel: "SD 1.5",
        baseModelType: null,
        nsfwLevel: 1,
        description: "Test version from models endpoint",
        files: mockModelsVersion.files,
        images: mockModelsVersion.images,
      });

      expect(core).toBeInstanceOf(Object);
      expect(core.id).toBe(100);
      expect(core.name).toBe("Test Version");
      expect(core.files).toHaveLength(1);
      expect(core.images).toHaveLength(1);
    });

    test("extracts core fields from model-id endpoint version", () => {
      const core = toModelVersionCore(mockModelByIdVersion);

      expect(core.id).toBe(200);
      expect(core.name).toBe("Test Version 2");
      expect(core.baseModel).toBe("SDXL");
      expect(core.files).toHaveLength(1);
      expect(core.images).toHaveLength(1);
    });

    test("extracts core fields from model-version endpoint version", () => {
      const core = toModelVersionCore(mockModelVersionEndpoint);

      expect(core.id).toBe(300);
      expect(core.name).toBe("Test Version 3");
      expect(core.baseModel).toBe("SD 2.1");
      expect(core.baseModelType).toBe("Stable Diffusion 2.1");
      expect(core.files).toHaveLength(1);
      expect(core.images).toHaveLength(1);
    });
  });

  describe("Utility Functions", () => {
    test("getModelId returns modelId for model-version endpoint", () => {
      expect(getModelId(mockModelVersionEndpoint)).toBe(999);
      expect(getModelId(mockModelsVersion)).toBeUndefined();
      expect(getModelId(mockModelByIdVersion)).toBeUndefined();
    });

    test("getIndex returns index for models and model-id endpoints", () => {
      expect(getIndex(mockModelsVersion)).toBe(0);
      expect(getIndex(mockModelByIdVersion)).toBe(1);
      expect(getIndex(mockModelVersionEndpoint)).toBeUndefined();
    });

    test("getAvailability returns availability for models and model-id endpoints", () => {
      expect(getAvailability(mockModelsVersion)).toBe("Public");
      expect(getAvailability(mockModelByIdVersion)).toBe("EarlyAccess");
      expect(getAvailability(mockModelVersionEndpoint)).toBeUndefined();
    });

    test("getPublishedAt handles different nullability across endpoints", () => {
      expect(getPublishedAt(mockModelsVersion)).toBe(
        "2024-01-01T00:00:00.000Z",
      );
      expect(getPublishedAt(mockModelByIdVersion)).toBe(
        "2024-02-01T00:00:00.000Z",
      );
      expect(getPublishedAt(mockModelVersionEndpoint)).toBe(
        "2024-03-01T00:00:00.000Z",
      );
    });
  });

  describe("findModelVersion", () => {
    const versions = [
      mockModelsVersion,
      mockModelByIdVersion,
      mockModelVersionEndpoint,
    ];

    test("finds version by ID", () => {
      const found = findModelVersion(versions, 100);
      expect(found).toBe(mockModelsVersion);

      const found2 = findModelVersion(versions, 300);
      expect(found2).toBe(mockModelVersionEndpoint);
    });

    test("returns undefined for non-existent ID", () => {
      const found = findModelVersion(versions, 999);
      expect(found).toBeUndefined();
    });

    test("findModelVersionTyped works with typed arrays", () => {
      const modelsVersions = [mockModelsVersion, mockModelByIdVersion];
      const found = findModelVersionTyped(modelsVersions, 100);
      expect(found).toBe(mockModelsVersion);

      // TypeScript should infer the correct type
      // Use non-null assertion since we know it's not undefined
      const foundNonNull = found!;
      // Should have index and availability
      expect((foundNonNull as any).index).toBeDefined();
      expect((foundNonNull as any).availability).toBeDefined();
    });
  });

  describe("Type Compatibility", () => {
    test("ModelVersionAny accepts all endpoint types", () => {
      const versions: ModelVersionAny[] = [
        mockModelsVersion,
        mockModelByIdVersion,
        mockModelVersionEndpoint,
      ];

      expect(versions).toHaveLength(3);
      // Use non-null assertion since we know the array has elements
      expect(versions[0]!.id).toBe(100);
      expect(versions[1]!.id).toBe(200);
      expect(versions[2]!.id).toBe(300);
    });

    test("ModelVersionCore contains only common fields", () => {
      const core: ModelVersionCore = {
        id: 1,
        name: "Test",
        baseModel: "SD 1.5",
        baseModelType: null,
        nsfwLevel: 1,
        description: "Test",
        files: [],
        images: [],
      };

      expect(core).toHaveProperty("id");
      expect(core).toHaveProperty("name");
      expect(core).toHaveProperty("baseModel");
      expect(core).toHaveProperty("baseModelType");
      expect(core).toHaveProperty("nsfwLevel");
      expect(core).toHaveProperty("description");
      expect(core).toHaveProperty("files");
      expect(core).toHaveProperty("images");

      // Should NOT have endpoint-specific fields
      expect(core).not.toHaveProperty("index");
      expect(core).not.toHaveProperty("availability");
      expect(core).not.toHaveProperty("modelId");
      expect(core).not.toHaveProperty("publishedAt");
    });
  });
});

describe("extractIdFromImageUrl", () => {
  test("extracts ID from valid Civitai URL", () => {
    const url =
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg";
    const result = extractIdFromImageUrl(url);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(1743606);
  });

  test("extracts ID from URL with query parameters", () => {
    const url =
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/6039981.jpeg?token=abc123";
    const result = extractIdFromImageUrl(url);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(6039981);
  });

  test("extracts ID from URL without file extension", () => {
    const url =
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/123456";
    const result = extractIdFromImageUrl(url);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(123456);
  });

  test("returns error for invalid URL", () => {
    const url = "not-a-valid-url";
    const result = extractIdFromImageUrl(url);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Invalid URL");
    }
  });

  test("returns error for URL without filename", () => {
    const url = "https://example.com/";
    const result = extractIdFromImageUrl(url);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("URL path is empty");
    }
  });

  test("returns error for non-numeric filename", () => {
    const url = "https://example.com/image.jpg";
    const result = extractIdFromImageUrl(url);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Cannot parse ID from filename");
    }
  });
});

describe("Image ID Extraction", () => {
  test("getImageId returns existing ID when present", () => {
    const imageWithId = {
      id: 12345,
      url: "https://example.com/image.jpg",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "abc123",
      type: "image",
    };

    const result = getImageId(imageWithId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(12345);
  });

  test("getImageId extracts ID from URL when id is null", () => {
    const imageWithoutId = {
      id: null,
      url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "def456",
      type: "image",
    };

    const result = getImageId(imageWithoutId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(1743606);
  });

  test("getImageId extracts ID from URL with query parameters", () => {
    const imageWithoutId = {
      id: null,
      url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/6039981.jpeg?token=abc123",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "ghi789",
      type: "image",
    };

    const result = getImageId(imageWithoutId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(6039981);
  });

  test("getImageId extracts ID from URL without file extension", () => {
    const imageWithoutId = {
      id: null,
      url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/123456",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "jkl012",
      type: "image",
    };

    const result = getImageId(imageWithoutId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(0)).toBe(123456);
  });

  test("getImageId returns error for invalid URL", () => {
    const imageWithInvalidUrl = {
      id: null,
      url: "not-a-valid-url",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "mno345",
      type: "image",
    };

    const result = getImageId(imageWithInvalidUrl);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Invalid URL");
    }
  });

  test("getImageId returns error for URL without filename", () => {
    const imageWithoutFilename = {
      id: null,
      url: "https://example.com/",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "pqr678",
      type: "image",
    };

    const result = getImageId(imageWithoutFilename);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("URL path is empty");
    }
  });

  test("getImageId returns error for non-numeric filename", () => {
    const imageWithNonNumericFilename = {
      id: null,
      url: "https://example.com/image.jpg",
      nsfwLevel: 1,
      width: 512,
      height: 512,
      hash: "stu901",
      type: "image",
    };

    const result = getImageId(imageWithNonNumericFilename);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Cannot parse ID from filename");
    }
  });

  test("ensureImageIds processes array of images with mixed IDs", () => {
    const images = [
      {
        id: 111,
        url: "https://example.com/image1.jpg",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "aaa111",
        type: "image",
      },
      {
        id: null,
        url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/222222.jpeg",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "bbb222",
        type: "image",
      },
      {
        id: 333,
        url: "https://example.com/image3.jpg",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "ccc333",
        type: "image",
      },
      {
        id: null,
        url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/444444.png",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "ddd444",
        type: "image",
      },
    ];

    const result = ensureImageIds(images);
    expect(result.isOk()).toBe(true);

    if (result.isOk()) {
      const processedImages = result.value;
      expect(processedImages).toHaveLength(4);

      // Check IDs
      expect(processedImages[0]?.id).toBe(111);
      expect(processedImages[1]?.id).toBe(222222);
      expect(processedImages[2]?.id).toBe(333);
      expect(processedImages[3]?.id).toBe(444444);

      // Check that other properties are preserved
      expect(processedImages[0]?.url).toBe("https://example.com/image1.jpg");
      expect(processedImages[1]?.url).toBe(
        "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/222222.jpeg",
      );
      expect(processedImages[0]?.hash).toBe("aaa111");
      expect(processedImages[1]?.hash).toBe("bbb222");
    }
  });

  test("ensureImageIds returns error if any image fails ID extraction", () => {
    const images = [
      {
        id: 111,
        url: "https://example.com/image1.jpg",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "aaa111",
        type: "image",
      },
      {
        id: null,
        url: "not-a-valid-url",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "bbb222",
        type: "image",
      },
      {
        id: 333,
        url: "https://example.com/image3.jpg",
        nsfwLevel: 1,
        width: 512,
        height: 512,
        hash: "ccc333",
        type: "image",
      },
    ];

    const result = ensureImageIds(images);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Invalid URL");
    }
  });
});

describe("ModelAbstract", () => {
  describe("Type Guards", () => {
    test("isModelsEndpointModel correctly identifies models endpoint model", () => {
      expect(isModelsEndpointModel(mockModelsEndpointModel)).toBe(true);
      // Note: isModelsEndpointModel and isModelByIdEndpointModel both return true
      // for models with versions that have index and availability fields
      // This is because ModelsVersion and ModelByIdVersion have the same structure
      expect(isModelsEndpointModel(mockModelByIdEndpointModel)).toBe(true);
    });

    test("isModelByIdEndpointModel correctly identifies model-id endpoint model", () => {
      expect(isModelByIdEndpointModel(mockModelByIdEndpointModel)).toBe(true);
      // Both functions return true for the same reason
      expect(isModelByIdEndpointModel(mockModelsEndpointModel)).toBe(true);
    });
  });

  describe("toModelCore", () => {
    test("extracts core fields from models endpoint model", () => {
      const core = toModelCore(mockModelsEndpointModel);

      expect(core).toEqual({
        id: 1000,
        name: "Test Model from models endpoint",
        description: "A test model from the models endpoint",
        type: "Checkpoint",
        poi: false,
        nsfw: false,
        nsfwLevel: 1,
        creator: mockModelsEndpointModel.creator,
        stats: mockModelsEndpointModel.stats,
        tags: ["test", "ai", "art"],
        modelVersions: [mockModelsVersion],
      });

      expect(core).toBeInstanceOf(Object);
      expect(core.id).toBe(1000);
      expect(core.name).toBe("Test Model from models endpoint");
      expect(core.type).toBe("Checkpoint");
      expect(core.tags).toHaveLength(3);
      expect(core.modelVersions).toHaveLength(1);
    });

    test("extracts core fields from model-id endpoint model", () => {
      const core = toModelCore(mockModelByIdEndpointModel);

      expect(core.id).toBe(2000);
      expect(core.name).toBe("Test Model from model-id endpoint");
      expect(core.type).toBe("LORA");
      expect(core.poi).toBe(true);
      expect(core.nsfw).toBe(true);
      expect(core.nsfwLevel).toBe(3);
      expect(core.tags).toHaveLength(3);
      expect(core.modelVersions).toHaveLength(1);
    });
  });

  describe("findModel", () => {
    const models = [mockModelsEndpointModel, mockModelByIdEndpointModel];

    test("finds model by ID in array", () => {
      const found = findModel(models, 1000);
      expect(found).toBe(mockModelsEndpointModel);

      const found2 = findModel(models, 2000);
      expect(found2).toBe(mockModelByIdEndpointModel);
    });

    test("returns undefined for non-existent ID", () => {
      const found = findModel(models, 9999);
      expect(found).toBeUndefined();
    });

    test("findModelTyped works with typed arrays", () => {
      const modelsArray = [mockModelsEndpointModel];
      const found = findModelTyped(modelsArray, 1000);
      expect(found).toBe(mockModelsEndpointModel);

      // TypeScript should infer the correct type
      // Use non-null assertion since we know it's not undefined
      const foundNonNull = found!;
      // Should have the correct type
      expect(foundNonNull.type).toBe("Checkpoint");
      expect(foundNonNull.modelVersions[0]?.index).toBeDefined();
    });
  });

  describe("Type Compatibility", () => {
    test("ModelAny accepts all endpoint types", () => {
      const models: ModelAny[] = [
        mockModelsEndpointModel,
        mockModelByIdEndpointModel,
      ];

      expect(models).toHaveLength(2);
      // Use non-null assertion since we know the array has elements
      expect(models[0]!.id).toBe(1000);
      expect(models[1]!.id).toBe(2000);
      expect(models[0]!.type).toBe("Checkpoint");
      expect(models[1]!.type).toBe("LORA");
    });

    test("ModelCore contains only common fields", () => {
      const core: ModelCore = {
        id: 1,
        name: "Test Model",
        description: "Test description",
        type: "Checkpoint",
        poi: false,
        nsfw: false,
        nsfwLevel: 1,
        creator: {
          username: "test",
          image: "https://example.com/avatar.jpg",
        },
        stats: {
          downloadCount: 100,
          favoriteCount: 50,
          thumbsUpCount: 80,
          thumbsDownCount: 5,
          commentCount: 10,
          ratingCount: 20,
          rating: 4.5,
          tippedAmountCount: 10,
        },
        tags: ["test", "ai"],
        modelVersions: [],
      };

      expect(core).toHaveProperty("id");
      expect(core).toHaveProperty("name");
      expect(core).toHaveProperty("description");
      expect(core).toHaveProperty("type");
      expect(core).toHaveProperty("poi");
      expect(core).toHaveProperty("nsfw");
      expect(core).toHaveProperty("nsfwLevel");
      expect(core).toHaveProperty("creator");
      expect(core).toHaveProperty("stats");
      expect(core).toHaveProperty("tags");
      expect(core).toHaveProperty("modelVersions");

      // ModelCore should not have any endpoint-specific fields
      // since both endpoints share the same Model structure
    });
  });
});
