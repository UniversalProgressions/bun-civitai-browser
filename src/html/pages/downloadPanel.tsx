import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  type DescriptionsProps,
  Flex,
  Input,
  List,
  notification,
  Row,
  Select,
  type SelectProps,
  Space,
  Tabs,
  Tag,
} from "antd";
import type React from "react";
import { useState } from "react";
import { atom, useAtom } from "jotai";
import clipboard from "clipboardy";
import { debounce } from "es-toolkit";
import DOMPurify from "dompurify";
import type { ExistedModelVersions, Model } from "#civitai-api/v1/models";
import { edenTreaty } from "../utils";
import { replaceUrlParam, removeFileExtension } from "#civitai-api/v1/utils";
import Gallery from "../components/gallery";
import ShadowHTML from "../components/shadowHTML";

enum LoadingOptionsEnum {
  VersionId = "VersionId",
  VersionHash = "VersionHash",
  ModelId = "ModelId",
  Url = "Url",
}

const activeVersionIdAtom = atom<string>(``);
const existedModelVersionsAtom = atom<ExistedModelVersions>([]);
const selectedOptionAtom = atom<LoadingOptionsEnum>(
  LoadingOptionsEnum.VersionId,
);
const inputValueAtom = atom<string>(``);
const loadingAtom = atom<boolean>(false);
const modelContentAtom = atom<React.ReactNode>(null);

function ModelCardContent({ data }: { data: Model }) {
  const [_activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const [existedModelVersions, _setExistedModelVersions] = useAtom(
    existedModelVersionsAtom,
  );

  async function onDownloadClick(model: Model, versionId: number) {
    setIsDownloadButtonLoading(true);
    try {
      const { data, error } = await edenTreaty.civitai_api.v1.download[
        "model-version"
      ].post({
        model,
        modelVersionId: versionId,
      });

      if (error) {
        // Elysia returns error in the error field with structure { status, value: { message, ... } }
        const errorMessage =
          error.value?.message || "Failed to start download task";
        notification.error({
          message: "Download failed",
          description: errorMessage,
        });
        console.error("Download API error:", error);
      } else {
        // Check if tasks were actually created
        const hasTasks =
          data &&
          ((data.modelfileTasksId && data.modelfileTasksId.length > 0) ||
            (data.mediaTaskIds && data.mediaTaskIds.length > 0));

        if (hasTasks) {
          notification.success({
            message: "Download started successfully",
            description: `Model: ${model.name}, Version: ${versionId}`,
          });
        } else {
          notification.warning({
            message: "No download tasks created",
            description:
              "All files may already exist on disk or no files to download",
          });
        }
      }
    } catch (error) {
      // Network error or other exceptions
      notification.error({
        message: "Download failed",
        description:
          error instanceof Error ? error.message : JSON.stringify(error),
      });
      console.error("Download error:", error);
    } finally {
      setIsDownloadButtonLoading(false);
    }
  }

  // https://blog.csdn.net/weixin_42579348/article/details/124397538 Antd Tabs longer than window problem.
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", width: "100%" }}>
        <Tabs
          defaultActiveKey="1"
          tabPlacement="top"
          onChange={(id) => setActiveVersionId(id)}
          items={data?.modelVersions.map((v) => {
            const leftSide = (
              <>
                <Space align="center" orientation="vertical" size="middle">
                  {v.images.length > 0 ? (
                    <Gallery
                      items={v.images.map((img) => ({
                        ...img,
                        url: replaceUrlParam(img.url),
                      }))}
                    />
                  ) : (
                    <div
                      style={{
                        width: 200,
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        border: "1px dashed #d9d9d9",
                        borderRadius: "8px",
                      }}
                      title="No preview available"
                    >
                      <span style={{ color: "#999" }}>No preview</span>
                    </div>
                  )}
                  <Button
                    type="primary"
                    block
                    onClick={() => onDownloadClick(data, v.id)}
                    disabled={
                      existedModelVersions.find((obj) => obj.versionId === v.id)
                        ?.filesOnDisk.length === v.files.length
                    }
                    loading={isDownloadButtonLoading}
                  >
                    Download
                  </Button>
                </Space>
              </>
            );
            const descriptionItems: DescriptionsProps["items"] = [
              {
                key: v.id,
                label: "Version ID",
                children: v.id,
              },
              {
                key: v.baseModel,
                label: "Base Model",
                children: v.baseModel,
              },
              {
                key: 3,
                label: "Model Type",
                children: data.type,
              },
              {
                key: 4,
                label: "Publish Date",
                span: "filled",
                children: v.publishedAt?.toString() ?? "Null",
              },

              {
                key: 7,
                label: `Model Files`,
                span: `filled`,
                children:
                  v.files.length > 0 ? (
                    <List
                      dataSource={v.files}
                      renderItem={(file) => (
                        <List.Item>
                          <Row>
                            <Col span={18}>
                              {existedModelVersions
                                .find(
                                  (obj: ExistedModelVersions[number]) =>
                                    obj.versionId === v.id,
                                )
                                ?.filesOnDisk.includes(file.id) ? (
                                <Tag color="green">onDisk</Tag>
                              ) : undefined}
                              {file.name}
                            </Col>
                            <Col span={6}>
                              <Button
                                onClick={async () => {
                                  const loraString = `<lora:${file.id}_${removeFileExtension(file.name)}:1>`;
                                  await clipboard.write(loraString);
                                  notification.success({
                                    title: "Lora string copied to clipboard",
                                    description: loraString,
                                  });
                                }}
                              >
                                Copy Lora String
                              </Button>
                            </Col>
                          </Row>
                        </List.Item>
                      )}
                    />
                  ) : (
                    `have no files`
                  ),
              },
              {
                key: 8,
                label: "Tags",
                span: "filled",
                children: v.trainedWords ? (
                  <Flex wrap gap="small">
                    {v.trainedWords.map((tagStr) => (
                      <Button
                        key={tagStr}
                        onClick={async () => {
                          await clipboard.write(tagStr);
                          return notification.success({
                            title: "Copied to clipboard",
                          });
                        }}
                        className="
                        bg-blue-500 hover:bg-blue-700 text-white 
                          font-bold p-1 rounded transition-all 
                          duration-300 transform hover:scale-105
                          hover:cursor-pointer"
                        size="small"
                        type="text"
                      >
                        {tagStr}
                      </Button>
                    ))}
                  </Flex>
                ) : undefined,
              },
              {
                key: 9,
                label: "Model Description",
                span: "filled",
                children: data.description ? (
                  <ShadowHTML html={DOMPurify.sanitize(data.description)} />
                ) : undefined,
              },
              {
                key: 10,
                label: "Model Version Description",
                span: "filled",
                children: v.description ? (
                  <ShadowHTML html={DOMPurify.sanitize(v.description)} />
                ) : undefined,
              },
            ];
            const rightSide = (
              <>
                <Space orientation="vertical">
                  <Descriptions
                    title="Model Version Details"
                    layout="vertical"
                    items={descriptionItems}
                  ></Descriptions>
                </Space>
              </>
            );
            return {
              label: v.name,
              key: v.id.toString(),
              children: (
                <Card>
                  <Space align="center" orientation="vertical">
                    <div>
                      <a
                        className="clickable-title"
                        target="_blank"
                        href={`https://civitai.com/models/${data.id}?modelVersionId=${v.id}`}
                      >
                        {data.name}
                      </a>
                    </div>
                    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                      <Col sm={8} lg={6}>
                        {leftSide}
                      </Col>
                      <Col sm={16} lg={18}>
                        {rightSide}
                      </Col>
                    </Row>
                  </Space>
                </Card>
              ),
            };
          })}
        />
      </div>
    </div>
  );
}

function InputBar() {
  const [selectedOption, setSelectedOption] = useAtom(selectedOptionAtom); // Currently selected loading option
  const [_activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom); // Currently active model version ID
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [_loading, setLoading] = useAtom(loadingAtom);
  const [_modelContent, setModelContent] = useAtom(modelContentAtom);
  const [_existedModelVersions, _setExistedModelVersions] = useAtom(
    existedModelVersionsAtom,
  );

  const handleApiError = (error: unknown) => {
    // Type guard to check if error has status property
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: unknown }).status === 422
    ) {
      const err = error as { value?: { message?: string; summary?: string } };
      setModelContent(
        <Alert
          type="error"
          title={err.value?.message || "Validation Error"}
          description={err.value?.summary || "Invalid input"}
        />,
      );
    } else {
      setModelContent(
        <Alert
          type="error"
          title="API Error"
          description={error instanceof Error ? error.message : String(error)}
        />,
      );
    }
    throw error;
  };

  const handleApiSuccess = (data: Model) => {
    setModelContent(<ModelCardContent data={data} />);
    setActiveVersionId(data.modelVersions[0].id.toString());
  };

  async function loadModelInfo() {
    // Validate input
    const parsedId = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsedId) && selectedOption !== LoadingOptionsEnum.Url) {
      setModelContent(
        <Alert
          type="error"
          title="Invalid input"
          description="Please enter a valid number"
        />,
      );
      return;
    }

    setLoading(true);
    try {
      switch (selectedOption) {
        case LoadingOptionsEnum.VersionId: {
          const { data, error } = await edenTreaty.civitai_api.v1.download[
            "get-info"
          ]["by-version-id"].post({ id: parsedId });
          if (error) {
            handleApiError(error);
          } else {
            handleApiSuccess(data);
          }
          break;
        }
        case LoadingOptionsEnum.ModelId: {
          const { data, error } = await edenTreaty.civitai_api.v1.download[
            "get-info"
          ]["by-id"].post({ id: parsedId });
          if (error) {
            handleApiError(error);
          } else {
            handleApiSuccess(data);
          }
          break;
        }
        case LoadingOptionsEnum.Url: {
          setModelContent(
            <Alert
              type="warning"
              title="URL option not yet implemented"
              description="This feature is coming soon"
            />,
          );
          break;
        }
        default:
          setModelContent(
            <Alert
              type="error"
              title="Invalid option"
              description={`Unknown option: ${selectedOption}`}
            />,
          );
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }
  const debounceLoadModelInfo = debounce(loadModelInfo, 500);
  const loadingOptions: SelectProps["options"] = [
    {
      value: LoadingOptionsEnum.VersionId,
      label: LoadingOptionsEnum.VersionId,
    },
    {
      value: LoadingOptionsEnum.ModelId,
      label: LoadingOptionsEnum.ModelId,
    },
    {
      value: LoadingOptionsEnum.Url,
      label: LoadingOptionsEnum.Url,
    },
  ];
  return (
    <Space.Compact>
      <Select
        defaultValue={LoadingOptionsEnum.VersionId}
        options={loadingOptions}
        onChange={(value) => setSelectedOption(value as LoadingOptionsEnum)}
      />
      <Input
        defaultValue={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Please input corresponding value according to the option on the left."
        onPressEnter={debounceLoadModelInfo}
      />
    </Space.Compact>
  );
}
function App() {
  const [modelContent, _setModelContent] = useAtom(modelContentAtom);
  const [loading, _setLoading] = useAtom(loadingAtom);
  return (
    <>
      <Space
        orientation="vertical"
        align="center"
        className="w-full max-w-full"
      >
        <InputBar />
      </Space>
      <div className="p-2">
        {loading ? <div>loading...</div> : modelContent}
      </div>
    </>
  );
}

export default App;
