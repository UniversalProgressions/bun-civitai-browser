import { describe, it, expect, beforeEach, vi } from "bun:test";
import { createCivitaiClient } from "../index";

// Mock ky
vi.mock("ky", () => {
  const mockKyInstance = {
    get: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        items: [],
        metadata: {
          totalItems: 0,
          currentPage: 1,
          pageSize: 20,
          totalPages: 0,
        },
      }),
    }),
    post: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    }),
    put: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    }),
    delete: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    }),
  };

  // Create a function that returns the mock instance
  const mockKy = vi.fn(() => mockKyInstance);
  // Add extend and create properties to the function
  (mockKy as any).extend = vi.fn(() => mockKyInstance);
  (mockKy as any).create = vi.fn(() => mockKyInstance);

  return {
    default: mockKy,
  };
});

describe("Civitai API Client", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeEach(() => {
    client = createCivitaiClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.test.civitai.com",
    });
  });

  it("should create client with default config", () => {
    const defaultClient = createCivitaiClient();
    expect(defaultClient).toBeDefined();
    expect(defaultClient.getConfig()).toMatchObject({
      baseUrl: "https://civitai.com/api/v1",
      timeout: 30000,
      validateResponses: false,
    });
  });

  it("should create client with custom config", () => {
    expect(client).toBeDefined();
    expect(client.getConfig()).toMatchObject({
      apiKey: "test-api-key",
      baseUrl: "https://api.test.civitai.com",
      timeout: 30000,
      validateResponses: false,
    });
  });

  it("should have all endpoints", () => {
    expect(client.creators).toBeDefined();
    expect(client.models).toBeDefined();
    expect(client.modelVersions).toBeDefined();
    expect(client.tags).toBeDefined();
  });

  it("should update config", () => {
    client.updateConfig({
      timeout: 60000,
      validateResponses: true,
    });

    expect(client.getConfig()).toMatchObject({
      apiKey: "test-api-key",
      baseUrl: "https://api.test.civitai.com",
      timeout: 60000,
      validateResponses: true,
    });
  });
});

describe("Creators Endpoint", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeEach(() => {
    client = createCivitaiClient();
  });

  it("should have list method", () => {
    expect(typeof client.creators.list).toBe("function");
  });
});

describe("Models Endpoint", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeEach(() => {
    client = createCivitaiClient();
  });

  it("should have list method", () => {
    expect(typeof client.models.list).toBe("function");
  });

  it("should have getById method", () => {
    expect(typeof client.models.getById).toBe("function");
  });
});

describe("ModelVersions Endpoint", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeEach(() => {
    client = createCivitaiClient();
  });

  it("should have getById method", () => {
    expect(typeof client.modelVersions.getById).toBe("function");
  });

  it("should have getByHash method", () => {
    expect(typeof client.modelVersions.getByHash).toBe("function");
  });
});

describe("Tags Endpoint", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeEach(() => {
    client = createCivitaiClient();
  });

  it("should have list method", () => {
    expect(typeof client.tags.list).toBe("function");
  });
});
