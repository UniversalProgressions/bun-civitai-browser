import {
  Affix,
  Button,
  Card,
  Col,
  Descriptions,
  type DescriptionsProps,
  Flex,
  FloatButton,
  Form,
  Image,
  Input,
  List,
  Modal,
  notification,
  Pagination,
  type PaginationProps,
  Row,
  Select,
  Space,
  Tabs,
} from "antd";
import { SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { atom, PrimitiveAtom, useAtom } from "jotai";
import {} from "jotai";
import { useEffect, useState } from "react";
import { debounce } from "es-toolkit";
import clipboard from "clipboardy";
import DOMPurify from "dompurify";
import { edenTreaty, getFileType } from "../utils";
import {
  Model,
  type ModelsRequestOpts,
} from "../../modules/civitai/models/models_endpoint";
import {
  BaseModelsArray,
  CheckPointTypeArray,
  ModelsRequestPeriodArray,
  ModelsRequestSortArray,
  type ModelTypes,
  ModelTypesArray,
} from "../../modules/civitai/models/baseModels/misc";
import { type ModelWithAllRelations } from "../../modules/civitai/service/crud/modelId";
import { extractFilenameFromUrl } from "#modules/civitai/service/sharedUtils";
import { DefaultOptionType } from "antd/es/select";
import ShadowHTML from "../components/shadowHTML";
import { atomWithImmer } from "jotai-immer";

export enum ModalWidthEnum {
  SearchPanel = 600,
  modelDetailCard = 1000,
}
const modalWidthAtom = atom<ModalWidthEnum>(ModalWidthEnum.SearchPanel);
const isGalleryLoadingAtom = atom(false);
const modelsAtom = atom<Array<ModelWithAllRelations>>([]);
const localSearchOptionsAtom = atom<ModelsRequestOpts>({});
const tempLocalSearchOptsAtom = atomWithImmer<ModelsRequestOpts>({});

const totalAtom = atom(0);
const isModalOpenAtom = atom(false);
const modalContentAtom = atom(<></>);
const activeVersionIdAtom = atom<string>(``);

function MediaPreview({ fileName }: { fileName: string }) {
  const fileType = getFileType(fileName);
  const srcPath =
    `${location.origin}/civitai/local/media/preview?previewFile=${fileName}`;
  if (fileType === "video") {
    return <video src={srcPath} autoPlay loop muted></video>;
  } else if (fileType === "image") {
    return <img src={srcPath} />;
  } else {
    return <img alt={`unknown file type: ${fileName}`} />;
  }
}

function GalleryModal() {
  const [modalContent, setModalContent] = useAtom(modalContentAtom);
  const [modalWidth, setModalWidth] = useAtom(modalWidthAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  return (
    <>
      <Modal
        width={modalWidth}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        closable={false}
        open={isModalOpen}
        footer={null}
        centered
        destroyOnHidden={true} // force refetch data by force destory DOM
      >
        {isModalOpen ? modalContent : <div>loading...</div>}
      </Modal>
    </>
  );
}

function LocalPagination() {
  const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [total, setTotal] = useAtom(totalAtom);
  const onChange: PaginationProps["onChange"] = (page, pageSize) => {
    setSearchOpt((prev) => ({ ...prev, page, limit: pageSize }));
  };
  return (
    <Pagination
      pageSize={searchOpt.limit ?? 20}
      current={searchOpt.page ?? 1}
      total={total}
      onChange={onChange}
      showSizeChanger
      showQuickJumper
      showTotal={(total) => `Total ${total} items`}
    />
  );
}

function SearchPanel() {
  const [tempSearchOpt, setTempSearchOpt] = useAtom(tempLocalSearchOptsAtom);
  const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [tagsOptions, setTagsOptions] = useState<Array<DefaultOptionType>>([]);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);

  function resetSearchOpt() {
    setTempSearchOpt((prev) => (structuredClone(searchOpt)));
  }

  async function asyncSearchTags(keyword: string) {
    function toOptionsArray(params: Array<string>): Array<DefaultOptionType> {
      return params.map((tag) => ({
        label: tag,
        value: tag,
      }));
    }
    const response = await edenTreaty.civitai.db.tags.get({
      query: { tagKeyword: keyword },
    });
    switch (response.status) {
      case 200:
        setTagsOptions(toOptionsArray(response.data!));
        break;
      case 422:
        notification.error({ message: "Invalide HTTP QueryString" });
        setTagsOptions([]);
        break;
      default:
        notification.error({ message: "Failed to fetch tags" });
        setTagsOptions([]);
        break;
    }
  }
  const debouncedSearchTags = debounce(asyncSearchTags, 600);

  return (
    <>
      <Form layout="horizontal">
        <Form.Item name="query" label="Query Text">
          <Input
            placeholder="input search text"
            onChange={(e) =>
              setTempSearchOpt((prev) => {
                prev.query = e.target.value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="username" label="Username">
          <Input
            placeholder="input username"
            onChange={(e) =>
              setTempSearchOpt((prev) => {
                prev.username = e.target.value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="baseModels" label="Base Model Select">
          <Select
            mode="multiple"
            options={BaseModelsArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Base model"
            value={tempSearchOpt.baseModels}
            onChange={(value) =>
              setTempSearchOpt((prev) => {
                prev.baseModels = value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="types" label="Model Type">
          <Select
            mode="multiple"
            options={ModelTypesArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Model Type"
            value={tempSearchOpt.types}
            onChange={(value) =>
              setTempSearchOpt((prev) => {
                prev.types = value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="checkpointType" label="Checkpoint Type">
          <Select
            options={CheckPointTypeArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Checkpoint Type"
            value={tempSearchOpt.checkpointType}
            onChange={(value) =>
              setTempSearchOpt((prev) => {
                prev.checkpointType = value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="period" label="Period">
          <Select
            options={ModelsRequestPeriodArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Period"
            value={tempSearchOpt.period}
            onChange={(value) =>
              setTempSearchOpt((prev) => {
                prev.period = value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="sort" label="Sort">
          <Select
            options={ModelsRequestSortArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Sort"
            value={tempSearchOpt.sort}
            onChange={(value) =>
              setTempSearchOpt((prev) => {
                prev.sort = value;
                return prev;
              })}
          />
        </Form.Item>
        <Form.Item name="tag" label="Tags">
          <Select
            mode="multiple"
            placeholder="Tags"
            value={tempSearchOpt.tag}
            onChange={(value) =>
              setTempSearchOpt((prev) => {
                prev.tag = value;
                return prev;
              })}
            onSearch={(value) => debouncedSearchTags(value)}
            options={tagsOptions}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setIsModalOpen(false);
                setSearchOpt(structuredClone(tempSearchOpt));
              }}
            >
              Search
            </Button>
            <Button onClick={resetSearchOpt}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}

function FloatingButtons() {
  const [tempSearchOpt, setTempSearchOpt] = useAtom(tempLocalSearchOptsAtom);
  const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalWidth, setModalWidth] = useAtom(modalWidthAtom);
  const [modalContent, setModalContent] = useAtom(modalContentAtom);

  return (
    <>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton
          icon={<SearchOutlined />}
          onClick={() => {
            setTempSearchOpt(structuredClone(searchOpt));

            setModalWidth(ModalWidthEnum.SearchPanel);
            setModalContent(
              <SearchPanel />,
            );
            setIsModalOpen(true);
          }}
        />
        <FloatButton
          icon={<SyncOutlined />}
          onClick={async () => {
            notification.info({ message: "Scaning..." });
            await edenTreaty.civitai.local.scanModels.head();
            notification.success({ message: "Finished~" });
          }}
        />
        <FloatButton.BackTop visibilityHeight={0} />
      </FloatButton.Group>
    </>
  );
}

function ModelCardContent({
  data,
  dbModel,
}: {
  data: Model;
  dbModel: ModelWithAllRelations;
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
                {v.images[0]?.url
                  ? (
                    <Image.PreviewGroup
                      items={v.images.map(
                        (i) =>
                          `${location.origin}/civitai/local/media/preview?previewFile=${
                            extractFilenameFromUrl(
                              i.url,
                            )
                          }`,
                      )}
                    >
                      <Image
                        width={200}
                        src={v.images[0].url
                          ? `${location.origin}/civitai/local/media/preview?previewFile=${
                            extractFilenameFromUrl(v.images[0].url)
                          }`
                          : undefined}
                        alt="Have no previews"
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
                v.trainedWords
                  ? (
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
                  )
                  : undefined
              ),
            },
            {
              key: 9,
              label: "Model Description",
              span: "filled",
              children: data.description
                ? (
                  // <div
                  //   className="bg-gray-300"
                  //   dangerouslySetInnerHTML={{
                  //     __html: DOMPurify.sanitize(data.description),
                  //   }}
                  // />
                  <ShadowHTML html={DOMPurify.sanitize(data.description)} />
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
                  // <div
                  //   className="bg-gray-300"
                  //   dangerouslySetInnerHTML={{
                  //     __html: DOMPurify.sanitize(v.description),
                  //   }}
                  // />
                  <ShadowHTML html={DOMPurify.sanitize(v.description)} />
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
                    href={`https://civitai.com/models/${dbModel.id}?modelVersionId=${v.id}`}
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

function ModelCard({ item }: { item: ModelWithAllRelations }) {
  const [modalContent, setModalContent] = useAtom(modalContentAtom);
  const [isCardModalOpen, setIsCardModalOpen] = useAtom(isModalOpenAtom);
  const [modalWidth, setModalWidth] = useAtom(modalWidthAtom);
  async function openModelCard(dbModel: ModelWithAllRelations) {
    setModalWidth(ModalWidthEnum.modelDetailCard);
    const { data, error, headers, response, status } = await edenTreaty.civitai
      .local.models.modelId.post({
        modelId: dbModel.id,
        modelVersionIdNumbers: dbModel.modelVersions.map((v) => v.id),
        type: dbModel.type.name as ModelTypes,
      });
    if (error?.status) {
      switch (error.status) {
        case 422:
          setModalContent(<>{JSON.stringify(error.value, null, 2)}</>);
        default:
          setModalContent(<div>Unknown Exception</div>);
      }
    } else {
      setModalContent(<ModelCardContent data={data!} dbModel={dbModel} />);
    }
    setIsCardModalOpen(true);
  }
  return (
    <>
      <Card
        onClick={() => openModelCard(item)}
        hoverable
        cover={item.previewFile
          ? <MediaPreview fileName={item.previewFile} />
          : <img title="Have no preview" />}
      >
        <Card.Meta description={item.name} />
      </Card>
    </>
  );
}

function GalleryContent() {
  const [modelsAtomValue, setModelsAtom] = useAtom(modelsAtom);

  return (
    <>
      <Space align="center" direction="vertical" className="w-full px-2">
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 4,
            lg: 4,
            xl: 6,
            xxl: 8,
          }}
          dataSource={modelsAtomValue}
          renderItem={(item) => (
            <List.Item>
              <ModelCard item={item} />
            </List.Item>
          )}
        />
      </Space>
      <GalleryModal />
    </>
  );
}

function LocalModelsGallery() {
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [models, setModels] = useAtom(modelsAtom);
  const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [totalCount, setTotalCount] = useAtom(totalAtom);

  async function fetchModels(opts: ModelsRequestOpts) {
    setIsGalleryLoading(true);
    try {
      const { data, error, headers, response, status } = await edenTreaty
        .civitai.local.models.pagination.post(opts);
      if (error) {
        throw error;
      } else {
        setModels(data.records);
        setTotalCount(data.totalCount ?? 0);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsGalleryLoading(false);
    }
  }

  useEffect(() => {
    fetchModels(searchOpt);
  }, [searchOpt]); // [] 表示组件挂载时只执行一次

  return (
    <>
      <Space direction="vertical" align="center">
        {isGalleryLoading ? <div>Loading...</div> : <GalleryContent />}

        <Affix offsetBottom={5}>
          <LocalPagination />
        </Affix>
        <FloatingButtons />
      </Space>
    </>
  );
}

export default LocalModelsGallery;
