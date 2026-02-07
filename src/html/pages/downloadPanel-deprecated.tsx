import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  type DescriptionsProps,
  Flex,
  Image,
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
import { useState } from "react";
import { atom, useAtom } from "jotai";
import { type } from "arktype";
import clipboard from "clipboardy";
import { debounce } from "es-toolkit";
import DOMPurify from "dompurify";
import { type Model } from "#modules/civitai-deprecated/models/models_endpoint.js";
import {
  ExistedModelversions,
  existedModelversions,
  modelId_model,
} from "#modules/civitai-deprecated/models/modelId_endpoint.js";
import { model_types } from "#modules/civitai-deprecated/models/baseModels/misc.js";
import { edenTreaty } from "../utils";
import {
  replaceUrlParam,
  extractFilenameFromUrl,
  modelId2Model,
  removeFileExtension,
} from "#modules/civitai-deprecated/service/sharedUtils.js";

enum LoadingOptionsEnum {
  VersionId = "VersionId",
  VersionHash = "VersionHash",
  ModelId = "ModelId",
  Url = "Url",
}

const activeVersionIdAtom = atom<string>(``);
const existedModelVersionsAtom = atom<ExistedModelversions>([]);
const selectedOptionAtom = atom<LoadingOptionsEnum>(
  LoadingOptionsEnum.VersionId
);
const inputValueAtom = atom<string>(``);
const loadingAtom = atom<boolean>(false);
const modelContentAtom = atom(<></>);

function ModelCardContent({ data }: { data: Model }) {
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const [existedModelversions, setExistedModelversions] = useAtom(
    existedModelVersionsAtom
  );

  async function onDownloadClick(model: Model, versionId: number) {
    setIsDownloadButtonLoading(true);
    try {
      const result = await edenTreaty.civitai.download.modelVersion.post({
        model,
        modelVersionId: versionId,
      });
      notification.success({
        title: "Download started",
      });
    } catch (error) {
      notification.error({
        title: "Download failed",
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
              <Space align="center" orientation="vertical">
                {v.images[0]?.url ? (
                  <Image.PreviewGroup
                    items={v.images.map((i) => replaceUrlParam(i.url))}
                  >
                    <Image
                      width={200}
                      src={replaceUrlParam(v.images[0].url)}
                      alt="No previews"
                    />
                  </Image.PreviewGroup>
                ) : (
                  <img title="Have no preview" />
                )}
                <Button
                  type="primary"
                  block
                  onClick={() => onDownloadClick(data, v.id)}
                  disabled={
                    existedModelversions.find((obj) => obj.versionId === v.id)
                      ?.filesOnDisk.length === v.files.length
                      ? true
                      : false
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
                              {existedModelversions
                                .find((obj) => obj.versionId === v.id)
                                ?.filesOnDisk.includes(file.id) ? (
                                <Tag color="green">onDisk</Tag>
                              ) : undefined}
                              {file.name}
                            </Col>
                            <Col span={6}>
                              <Button
                                onClick={async () => {
                                  // const loraString = `<lora:${
                                  //   modelVersion.files[index].id
                                  // }_${
                                  //   removeFileExtension(
                                  //     modelVersion.files[index].name,
                                  //   )
                                  // }:1>`;
                                  await clipboard.write(file.name);
                                  notification.success({
                                    title: `${file.name} copied to clipboard`,
                                  });
                                }}
                              >
                                Copy Filename
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
                <div
                  className="bg-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(data.description),
                  }}
                />
              ) : undefined,
              // data.description,
            },
            {
              key: 10,
              label: "Model Version Description",
              span: "filled",
              children: v.description ? (
                <div
                  className="bg-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(v.description),
                  }}
                />
              ) : undefined,
              // v.description
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
  const [existedModelversions, setExistedModelversions] = useAtom(
    existedModelVersionsAtom
  );

  async function loadModelInfo() {
    setLoading(true);
    try {
      switch (selectedOption) {
        case LoadingOptionsEnum.VersionId:
          {
            const { data, error, headers, response, status } =
              await edenTreaty.civitai.api.v1.loadModelInfoByVersionId.post({
                modelVersionId: Number.parseInt(inputValue),
              });
            if (error) {
              switch (error.status) {
                case 422:
                  setModelContent(
                    <Alert
                      type="error"
                      title={error.value.message}
                      description={error.value.summary}
                    />
                  );
                  throw error;
                default:
                  setModelContent(<Alert type="error" title={String(error)} />);
                  throw error;
              }
            } else {
              if (data.existedModelversions) {
                setExistedModelversions(data.existedModelversions);
              }
              setModelContent(<ModelCardContent data={data.model} />);
              setActiveVersionId(data.model.modelVersions[0].id.toString());
            }
          }
          break;
        case LoadingOptionsEnum.ModelId:
          {
            const { data, error, headers, response, status } =
              await edenTreaty.civitai.api.v1.loadModelInfoById.post({
                modelId: Number.parseInt(inputValue),
              });
            if (error) {
              switch (error.status) {
                case 422:
                  setModelContent(
                    <Alert
                      type="error"
                      title={error.value.message}
                      description={error.value.summary}
                    />
                  );
                  throw error;
                default:
                  setModelContent(<Alert type="error" title={String(error)} />);
                  throw error;
              }
            } else {
              if (data.existedModelversions) {
                setExistedModelversions(data.existedModelversions);
              }
              setModelContent(<ModelCardContent data={data.model} />);
              setActiveVersionId(data.model.modelVersions[0].id.toString());
            }
          }
          break;
      }
    } catch (error) {
      throw error;
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
