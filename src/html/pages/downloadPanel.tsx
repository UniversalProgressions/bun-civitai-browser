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
} from "antd";
import { atom, useAtom } from "jotai";
import clipboard from "clipboardy";
import { debounce } from "es-toolkit";
import DOMPurify from "dompurify";
import { type Model, model } from "#modules/civitai/models/models_endpoint";
import { type ModelId_ModelId } from "#modules/civitai/models/modelId_endpoint";
import { edenTreaty } from "#client/utils";
import {
  extractFilenameFromUrl,
  removeFileExtension,
} from "#modules/civitai/service/sharedUtils";
import { type } from "arktype";

function modelId2Model(data: ModelId_ModelId): Model {
  data.modelVersions.map((mv) => {
    // update images[]
    mv.images.map((i) => {
      // @ts-ignore
      i.id = Number.parseInt(
        removeFileExtension(extractFilenameFromUrl(i.url)),
      );
    });
    mv.files.map((f) => {
      f.scannedAt = f.scannedAt?.toString() ?? null;
    });
    mv.description = mv.description ?? null;
    mv.publishedAt = mv.publishedAt?.toString() ?? null;
  });
  const out = model(data);
  if (out instanceof type.errors) {
    console.error(`convert ModelId to Model error!`);
    out.throw();
    throw out;
  }
  return out;
}

function ModelCardContent({
  data,
}: {
  data: Model;
}) {
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);

  return (
    <>
      <Tabs
        defaultActiveKey="1"
        tabPosition="top"
        onChange={(id) => setActiveVersionId(id)}
        items={data?.modelVersions.map((v) => {
          const leftSide = (
            <>
              <div>
                {v.images[0].url
                  ? (
                    <Image.PreviewGroup
                      items={v.images.map(
                        (i) => i.url,
                      )}
                    >
                      <Image
                        width={200}
                        src={v.images[0].url}
                        alt="No previews"
                      />
                    </Image.PreviewGroup>
                  )
                  : <img title="Have no preview" />}
              </div>
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
              children: v.files.length > 0
                ? (
                  <>
                    <List
                      dataSource={v.files}
                      renderItem={(file) => (
                        <List.Item>
                          <Row>
                            <Col span={18}>{file.name}</Col>
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
                                    message: `${file.name} copied to clipboard`,
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
                )
                : (
                  `have no files`
                ),
            },
            {
              key: 8,
              label: "Tags",
              span: "filled",
              children: (
                <Flex wrap gap="small">
                  {v.trainedWords.map((tagStr, index) => (
                    <div
                      key={index}
                      onClick={async () => {
                        await clipboard.write(tagStr);
                        return notification.success({
                          message: "Copied to clipboard",
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
              ),
            },
            {
              key: 9,
              label: "Model Description",
              span: "filled",
              children: data.description
                ? (
                  <div
                    className="bg-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(data.description),
                    }}
                  />
                )
                : undefined,
              // data.description,
            },
            {
              key: 10,
              label: "Model Version Description",
              span: "filled",
              children: v.description
                ? (
                  <div
                    className="bg-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(v.description),
                    }}
                  />
                )
                : undefined,
              // v.description
            },
          ];
          const rightSide = (
            <>
              <Space direction="vertical">
                <Descriptions
                  title="Model Version Details"
                  layout="vertical"
                  items={descriptionItems}
                >
                </Descriptions>
              </Space>
            </>
          );
          return {
            label: v.name,
            key: v.id.toString(),
            children: (
              <Card>
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
              </Card>
            ),
          };
        })}
      />
    </>
  );
}

enum LoadingOptionsEnum {
  VersionId = "VersionId",
  VersionHash = "VersionHash",
  ModelId = "ModelId",
  Url = "Url",
}

const activeVersionIdAtom = atom<string>(``);
const selectedOptionAtom = atom<LoadingOptionsEnum>(
  LoadingOptionsEnum.VersionId,
);
const inputValueAtom = atom<string>(``);
const loadingAtom = atom<boolean>(false);
const modelContentAtom = atom(<></>);

function InputBar() {
  const [selectedOption, setSelectedOption] = useAtom(selectedOptionAtom); // 当前选中的加载选项
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom); // 当前激活的模型版本ID
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [modelContent, setModelContent] = useAtom(modelContentAtom);

  async function fetchModelVersionById(versionId: number) {
    const { data, error, headers, response, status } = await edenTreaty.civitai
      .api.v1.modelVersionById.post({ modelVersionId: versionId });
    if (error) {
      switch (error.status) {
        case 422:
          setModelContent(
            <Alert
              type="error"
              message={error.value.message}
              description={error.value.summary}
            />,
          );
          throw error;
        default:
          setModelContent(<Alert type="error" message={String(error)} />);
          throw error;
      }
    } else {
      return data;
    }
  }

  async function fetchModelId(modelId: number) {
    const { data, error, headers, response, status } = await edenTreaty.civitai
      .api.v1.modelById.post({ modelId: modelId });
    if (error) {
      switch (error.status) {
        case 422:
          setModelContent(
            <Alert
              type="error"
              message={error.value.message}
              description={error.value.summary}
            />,
          );
          throw error;
        default:
          setModelContent(<Alert type="error" message={String(error)} />);
          throw error;
      }
    } else {
      return data;
    }
  }
  async function loadModelInfo() {
    setLoading(true);
    try {
      switch (selectedOption) {
        case LoadingOptionsEnum.VersionId:
          {
            const mv = await fetchModelVersionById(Number.parseInt(inputValue));
            const mi = await fetchModelId(mv.modelId);
            const model = modelId2Model(mi);
            setModelContent(<ModelCardContent data={model} />);
            setActiveVersionId(mv.id.toString());
          }
          break;
        case LoadingOptionsEnum.ModelId:
          {
            const mi = await fetchModelId(Number.parseInt(inputValue));
            const model = modelId2Model(mi);
            setModelContent(<ModelCardContent data={model} />);
            setActiveVersionId(mi.modelVersions[0].id.toString());
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
          onPressEnter={() => {
            debounceLoadModelInfo();
          }}
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
      <Space direction="vertical" align="center" className="w-full">
        <InputBar />
        <div className="p-2">
          {loading ? <div>loading...</div> : modelContent}
        </div>
      </Space>
    </>
  );
}

export default App;
