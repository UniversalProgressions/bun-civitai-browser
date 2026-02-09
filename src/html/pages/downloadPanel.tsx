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
import React, { useState } from "react";
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
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const [existedModelVersions, setExistedModelVersions] = useAtom(
    existedModelVersionsAtom,
  );

  async function onDownloadClick(model: Model, versionId: number) {
    setIsDownloadButtonLoading(true);
    try {
      const result = await edenTreaty.civitai_api.v1.download[
        "model-version"
      ].post({
        model,
        modelVersionId: versionId,
      });
      notification.success({
        message: "Download started successfully",
        description: `Model: ${model.name}, Version: ${versionId}`,
      });
    } catch (error) {
      notification.error({
        message: "Download failed",
        description:
          error instanceof Error ? error.message : JSON.stringify(error),
      });
      console.error(error);
    } finally {
      setIsDownloadButtonLoading(false);
    }
  }

  return (
    <>
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
                    existedModelVersions.find(
                      (obj: any) => obj.versionId === v.id,
                    )?.filesOnDisk.length === v.files.length
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
                  <>
                    <List
                      dataSource={v.files}
                      renderItem={(file) => (
                        <List.Item>
                          <Row>
                            <Col span={18}>
                              {existedModelVersions
                                .find((obj: any) => obj.versionId === v.id)
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
                  </>
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
                  {v.trainedWords.map((tagStr, index) => (
                    <div
                      key={index}
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
                    >
                      {tagStr}
                    </div>
                  ))}
                </Flex>
              ) : undefined,
            },
            {
              key: 9,
              label: "Model Description",
              span: "filled",
              children: data.description ? (
                <ShadowHTML
                  html={DOMPurify.sanitize(data.description)}
                  style={`
                    body {
                      margin: 0;
                      padding: 12px;
                      background: #f8f9fa;
                      color: #212529;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      line-height: 1.5;
                      max-width: 100%;
                      box-sizing: border-box;
                      overflow-x: auto;
                      overflow-wrap: break-word;
                      word-break: break-word;
                    }
                    * {
                      box-sizing: border-box;
                    }
                    h1, h2, h3, h4, h5, h6 {
                      margin-top: 1em;
                      margin-bottom: 0.5em;
                      font-weight: 600;
                      line-height: 1.2;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    p {
                      margin: 0 0 1em;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    ul, ol {
                      margin: 0 0 1em;
                      padding-left: 2em;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    li {
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    a {
                      color: #0d6efd;
                      text-decoration: none;
                      overflow-wrap: break-word;
                      word-break: break-all;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                    img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 4px;
                      display: block;
                    }
                    code {
                      background: #e9ecef;
                      padding: 2px 6px;
                      border-radius: 3px;
                      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                      font-size: 0.9em;
                      max-width: 100%;
                      overflow-x: auto;
                      display: inline-block;
                      word-break: break-all;
                    }
                    pre {
                      background: #e9ecef;
                      padding: 12px;
                      border-radius: 6px;
                      overflow: auto;
                      max-width: 100%;
                    }
                    blockquote {
                      border-left: 4px solid #dee2e6;
                      margin: 0 0 1em;
                      padding-left: 1em;
                      color: #6c757d;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    table {
                      max-width: 100%;
                      overflow-x: auto;
                      display: block;
                      border-collapse: collapse;
                    }
                    th, td {
                      padding: 8px;
                      border: 1px solid #dee2e6;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    iframe, video, audio {
                      max-width: 100%;
                      display: block;
                    }
                  `}
                />
              ) : undefined,
            },
            {
              key: 10,
              label: "Model Version Description",
              span: "filled",
              children: v.description ? (
                <ShadowHTML
                  html={DOMPurify.sanitize(v.description)}
                  style={`
                    body {
                      margin: 0;
                      padding: 12px;
                      background: #f8f9fa;
                      color: #212529;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      line-height: 1.5;
                      max-width: 100%;
                      box-sizing: border-box;
                      overflow-x: auto;
                      overflow-wrap: break-word;
                      word-break: break-word;
                    }
                    * {
                      box-sizing: border-box;
                    }
                    h1, h2, h3, h4, h5, h6 {
                      margin-top: 1em;
                      margin-bottom: 0.5em;
                      font-weight: 600;
                      line-height: 1.2;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    p {
                      margin: 0 0 1em;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    ul, ol {
                      margin: 0 0 1em;
                      padding-left: 2em;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    li {
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    a {
                      color: #0d6efd;
                      text-decoration: none;
                      overflow-wrap: break-word;
                      word-break: break-all;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                    img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 4px;
                      display: block;
                    }
                    code {
                      background: #e9ecef;
                      padding: 2px 6px;
                      border-radius: 3px;
                      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                      font-size: 0.9em;
                      max-width: 100%;
                      overflow-x: auto;
                      display: inline-block;
                      word-break: break-all;
                    }
                    pre {
                      background: #e9ecef;
                      padding: 12px;
                      border-radius: 6px;
                      overflow: auto;
                      max-width: 100%;
                    }
                    blockquote {
                      border-left: 4px solid #dee2e6;
                      margin: 0 0 1em;
                      padding-left: 1em;
                      color: #6c757d;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    table {
                      max-width: 100%;
                      overflow-x: auto;
                      display: block;
                      border-collapse: collapse;
                    }
                    th, td {
                      padding: 8px;
                      border: 1px solid #dee2e6;
                      max-width: 100%;
                      overflow-wrap: break-word;
                    }
                    iframe, video, audio {
                      max-width: 100%;
                      display: block;
                    }
                  `}
                />
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
    </>
  );
}

function InputBar() {
  const [selectedOption, setSelectedOption] = useAtom(selectedOptionAtom); // 当前选中的加载选项
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom); // 当前激活的模型版本ID
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [modelContent, setModelContent] = useAtom(modelContentAtom);
  const [existedModelVersions, setExistedModelVersions] = useAtom(
    existedModelVersionsAtom,
  );

  const handleApiError = (error: any) => {
    if (error?.status === 422) {
      setModelContent(
        <Alert
          type="error"
          title={error.value.message}
          description={error.value.summary}
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

  const handleApiSuccess = (data: any) => {
    setModelContent(<ModelCardContent data={data} />);
    setActiveVersionId(data.modelVersions[0].id.toString());
  };

  async function loadModelInfo() {
    // Validate input
    const parsedId = Number.parseInt(inputValue);
    if (isNaN(parsedId) && selectedOption !== LoadingOptionsEnum.Url) {
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
    <>
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
    </>
  );
}
function App() {
  const [modelContent, setModelContent] = useAtom(modelContentAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  return (
    <>
      <Space orientation="vertical" align="center" className="w-full">
        <InputBar />
        <div className="p-2">
          {loading ? <div>loading...</div> : modelContent}
        </div>
      </Space>
    </>
  );
}

export default App;
