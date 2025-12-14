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
  Masonry,
  message,
  Modal,
  notification,
  Pagination,
  Result,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";

const { Paragraph, Text } = Typography;
import {
  CloseCircleOutlined,
  PlusCircleTwoTone,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { DefaultOptionType } from "antd/es/select";
import clipboard from "clipboardy";
import DOMPurify from "dompurify";
import { debounce } from "es-toolkit";
import { atom, useAtom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import {
  getFileType,
  extractFilenameFromUrl,
  replaceUrlParam,
} from "#modules/civitai/service/sharedUtils";

import {
  BaseModelsArray,
  CheckPointTypeArray,
  ModelsRequestPeriodArray,
  ModelsRequestSortArray,
  type ModelTypes,
  ModelTypesArray,
} from "../../modules/civitai/models/baseModels/misc";
import { useEffect, useRef, useState } from "react";
import { edenTreaty } from "../utils";

import {
  Model,
  type ModelsRequestOpts,
} from "../../modules/civitai/models/models_endpoint";
import {
  ExistedModelversions,
  existedModelversions,
  modelId_model,
} from "#modules/civitai/models/modelId_endpoint";
import { useQuery } from "@tanstack/react-query";

enum ModalWidthEnum {
  SearchPanel = 600,
  modelDetailCard = 1000,
}
const defaultPageAndSize = {
  page: 1,
  limit: 20,
};

const modalWidthAtom = atom<ModalWidthEnum>(ModalWidthEnum.SearchPanel);
const modelsAtom = atomWithImmer<Model[]>([]);
const modelsOnPageAtom = atom<Model[]>([]);
const searchOptsAtom = atom<ModelsRequestOpts>({});
const tempSearchOptsAtom = atomWithImmer<ModelsRequestOpts>({});
const nextPageUrlAtom = atom<string>(``);
const nonEffectiveSearchOptsAtom =
  atom<Partial<ModelsRequestOpts>>(defaultPageAndSize);
const isGalleryLoadingAtom = atom<boolean>(false);
const isModalOpenAtom = atom<boolean>(false);
const activeVersionIdAtom = atom<string>(``);
const modalContentAtom = atom<React.JSX.Element>(<div></div>);
const civitaiExistedModelVersionsAtom = atom<ExistedModelversions>([]);

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

function MediaPreview({ url }: { url: string }) {
  const fileType = getFileType(extractFilenameFromUrl(url));
  if (fileType === "video") {
    return <video src={url} autoPlay loop muted></video>;
  } else if (fileType === "image") {
    // use smaller preview image by replace
    // https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/833e5617-47d4-44d8-82c7-d169dc2908eb/original=true/93876235.jpeg
    // to
    // https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/833e5617-47d4-44d8-82c7-d169dc2908eb/original=false/93876235.jpeg
    return <img src={replaceUrlParam(url)} />;
  } else {
    return <img alt={`unknown file type: ${extractFilenameFromUrl(url)}`} />;
  }
}

function SearchPanel() {
  const [searchOpt, setSearchOpt] = useAtom(searchOptsAtom);
  const [form] = Form.useForm<ModelsRequestOpts>();
  const [tagsOptions, setTagsOptions] = useState<Array<DefaultOptionType>>([]);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);

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
        notification.error({ title: "Invalide HTTP QueryString" });
        setTagsOptions([]);
        break;
      default:
        notification.error({ title: "Failed to fetch tags" });
        setTagsOptions([]);
        break;
    }
  }
  const debouncedSearchTags = debounce(asyncSearchTags, 600);
  useEffect(() => {
    form.setFieldsValue(searchOpt);
  });
  return (
    <>
      <Form
        layout="horizontal"
        form={form}
        onSubmitCapture={() => {
          setSearchOpt(form.getFieldsValue());
          setIsModalOpen(false);
        }}
      >
        <Form.Item name="query" label="Query Text">
          <Input
            placeholder="input search text"
            value={form.getFieldValue("query")}
            onChange={(e) => {
              form.setFieldValue("query", e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item name="username" label="Username">
          <Input
            placeholder="input username"
            value={form.getFieldValue("username")}
            onChange={(e) => {
              form.setFieldValue("username", e.target.value);
            }}
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
            value={searchOpt.baseModels}
            onChange={(value) => {
              form.setFieldValue("baseModels", value);
            }}
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
            value={form.getFieldValue("types")}
            onChange={(value) => {
              form.setFieldValue("types", value);
            }}
          />
        </Form.Item>
        <Form.Item name="checkpointType" label="Checkpoint Type">
          <Select
            options={CheckPointTypeArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Checkpoint Type"
            value={form.getFieldValue("checkpointType")}
            onChange={(value) => {
              form.setFieldValue("checkpointType", value);
            }}
          />
        </Form.Item>
        <Form.Item name="period" label="Period">
          <Select
            options={ModelsRequestPeriodArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Period"
            value={form.getFieldValue("period")}
            onChange={(value) => {
              form.setFieldValue("period", value);
            }}
          />
        </Form.Item>
        <Form.Item name="sort" label="Sort">
          <Select
            options={ModelsRequestSortArray.map<DefaultOptionType>((v) => ({
              label: v,
              value: v,
            }))}
            placeholder="Sort"
            value={form.getFieldValue("sort")}
            onChange={(value) => {
              form.setFieldValue("sort", value);
            }}
          />
        </Form.Item>
        <Form.Item name="tag" label="Tags">
          <Select
            mode="multiple"
            placeholder="Tags"
            value={form.getFieldValue("tag")}
            onChange={(value) => {
              form.setFieldValue("tag", value);
            }}
            showSearch={{
              onSearch: (value) => debouncedSearchTags(value),
              autoClearSearchValue: false,
            }}
            options={tagsOptions}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Search
            </Button>
            <Button onClick={() => setSearchOpt({})}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}

function FloatingButtons() {
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalWidth, setModalWidth] = useAtom(modalWidthAtom);
  const [modalContent, setModalContent] = useAtom(modalContentAtom);
  const [tempSearchOpt, setTempSearchOpt] = useAtom(tempSearchOptsAtom);
  const [searchOpt, setSearchOpt] = useAtom(searchOptsAtom);

  return (
    <>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton
          icon={<SearchOutlined />}
          onClick={() => {
            setTempSearchOpt(structuredClone(searchOpt));

            setModalWidth(ModalWidthEnum.SearchPanel);
            setModalContent(<SearchPanel />);
            setIsModalOpen(true);
          }}
        />
        <FloatButton.BackTop visibilityHeight={0} />
      </FloatButton.Group>
    </>
  );
}

function CivitaiPagination() {
  const [nonEffectiveSearchOpts, setNonEffectiveSearchOpts] = useAtom(
    nonEffectiveSearchOptsAtom
  );
  const [modelsOnPage, setModelsOnPage] = useAtom(modelsOnPageAtom);

  const [models, setModels] = useAtom(modelsAtom);
  const [nextPageUrl, setNextPageUrl] = useAtom(nextPageUrlAtom);

  async function loadNextPage() {
    if (nextPageUrl) {
      message.open({
        type: "loading",
        content: "Action in progress..",
        duration: 0,
      });
      // Dismiss manually and asynchronously
      // setTimeout(messageApi.destroy, 2500);
      try {
        const { data, error, headers, response, status } =
          await edenTreaty.civitai.api.v1.models.nextPage.get({
            query: { nextPage: nextPageUrl },
          });
        if (error) {
          throw error;
        } else {
          setModels((state) => {
            state.push(...data.items);
            return state;
          });
          if (data.metadata.nextPage) {
            setNextPageUrl(data.metadata.nextPage);
          } else {
            notification.info({ title: "No more items to load." });
          }
        }
      } catch (error) {
        notification.error({
          title: "Error fetching models",
          description: String(error),
        });
        throw error;
      } finally {
        message.destroy();
      }
    }
  }
  const debounceLoadNextPage = debounce(loadNextPage, 500);
  interface PaginationParams {
    page: number;
    limit: number;
    total: number;
  }

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    try {
      debounceLoadNextPage();
    } catch (error) {
      notification.error({
        title: String(error),
      });
      console.error(error);
    }
  });

  // useEffect(() => debounceLoadNextPage());

  /**
   * Safe version - Determines if the current page is the last page
   * Includes more comprehensive edge case handling
   */
  function isLastPageSafe({ page, limit, total }: PaginationParams): boolean {
    // Parameter validation
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(
        "Page number must be an integer greater than or equal to 1"
      );
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error("Items per page must be an integer greater than 0");
    }

    if (!Number.isInteger(total) || total < 0) {
      throw new Error("Total items must be a non-negative integer");
    }

    // Handle case when there's no data
    if (total === 0) {
      return false;
    }

    // Calculate total number of pages
    const totalPages = Math.ceil(total / limit);

    // console.log(`total page: ${totalPages}, current page: ${page}`);
    return page >= totalPages;
  }

  return (
    <Pagination
      current={nonEffectiveSearchOpts.page ?? 1}
      pageSize={nonEffectiveSearchOpts.limit ?? defaultPageAndSize.limit}
      total={models.length}
      onChange={(page, pageSize) => {
        setNonEffectiveSearchOpts((prev) => ({
          ...prev,
          page,
          limit: pageSize,
        }));
        setModelsOnPage(
          models.slice(
            // Start
            (page - 1) * pageSize,
            // End
            page * pageSize
          )
        );
        if (isLastPageSafe({ page, limit: pageSize, total: models.length })) {
          // If it's the last page, we can fetch the next set of results
          return debounceLoadNextPage(); // can't call such a function at here...
        }
      }}
      showSizeChanger
      showQuickJumper
      showTotal={(total) => `${total} items loaded!`}
    />
  );
}

function ModelCardContent({ data }: { data: Model }) {
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const [existedModelversions, setExistedModelversions] = useAtom(
    civitaiExistedModelVersionsAtom
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

function ModelCard({ item }: { item: Model }) {
  const [modalContent, setModalContent] = useAtom(modalContentAtom);
  const [isCardModalOpen, setIsCardModalOpen] = useAtom(isModalOpenAtom);
  const [modalWidth, setModalWidth] = useAtom(modalWidthAtom);
  function openModelCard(item: Model) {
    setModalWidth(ModalWidthEnum.modelDetailCard);
    setModalContent(<ModelCardContent data={item} />);
    setIsCardModalOpen(true);
  }
  return (
    <>
      <Card
        onClick={() => openModelCard(item)}
        hoverable
        cover={
          item.modelVersions[0]?.images[0]?.url ? (
            <MediaPreview url={item.modelVersions[0].images[0].url} />
          ) : (
            <img title="Have no preview" />
          )
        }
      >
        <Card.Meta description={item.name} />
      </Card>
    </>
  );
}

function GalleryContent() {
  const [modelsOnPage, setModelsOnPage] = useAtom(modelsOnPageAtom);
  return (
    <>
      <Space align="center" orientation="vertical" style={{ width: "100%" }}>
        <Masonry
          className="w-dvw"
          columns={{
            xs: 1,
            sm: 2,
            md: 4,
            lg: 4,
            xl: 6,
            xxl: 8,
          }}
          gutter={{ xs: 8, sm: 12, md: 16 }}
          items={modelsOnPage.map((item, index) => ({
            key: `item-${index}`,
            data: item,
            index,
          }))}
          itemRender={(item) => <ModelCard key={item.key} item={item.data} />}
        />

        <Affix offsetBottom={5}>
          <CivitaiPagination />
        </Affix>
      </Space>
      <GalleryModal />
      <FloatingButtons />
    </>
  );
}

function CivitaiModelsGallery() {
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [searchOptions, setSearchOptions] = useAtom(searchOptsAtom);
  const [nonEffectiveSearchOpts, setNonEffectiveSearchOpts] = useAtom(
    nonEffectiveSearchOptsAtom
  );
  const [modelsOnPage, setModelsOnPage] = useAtom(modelsOnPageAtom);
  const [models, setModels] = useAtom(modelsAtom);
  const [nextPageUrl, setNextPageUrl] = useAtom(nextPageUrlAtom);
  const [isError, setIsError] = useState(false);
  const [errorContent, setErrorContent] = useState(<></>);
  async function fetchModels(searchOptions: ModelsRequestOpts) {
    setIsGalleryLoading(true);
    try {
      const { data, error, headers, response, status } =
        await edenTreaty.civitai.api.v1.models.post(searchOptions);
      if (error) {
        setIsError(true);
        // need to write a more reliable error handling logic
        console.log(`aaaa`);
        switch (error.status) {
          case 409:
            console.error(error.value.arkSummary);
            notification.error({
              title: "Data Validation Error",
              description: error.value.message,
            });
            setErrorContent(
              <Space orientation="vertical" align="center">
                <Result
                  status="error"
                  title={error.value.code}
                  subTitle={error.value.message}
                  extra={[
                    <Button type="primary" key="refresh page">
                      Refresh Page
                    </Button>,
                  ]}
                >
                  <div className="desc">
                    <Paragraph>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                        }}
                      >
                        Ark summary:
                      </Text>
                    </Paragraph>
                    <Paragraph>
                      <CloseCircleOutlined />
                      {error.value.arkSummary}
                    </Paragraph>
                    <Paragraph>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                        }}
                      >
                        Raw data
                      </Text>
                    </Paragraph>
                    <Paragraph>
                      <CloseCircleOutlined />
                      {error.value.resData}
                    </Paragraph>
                  </div>
                </Result>
              </Space>
            );
            break;
          case 422:
            // waiting to apply
            break;
          case 500:
            // waiting to apply
            break;
          default:
            // waiting to apply
            break;
        }
        throw error;
      } else {
        setModels((state) => {
          setModelsOnPage(data.items);
          return data.items;
        });
        // setNextPageUrl(data.metadata.nextPage ?? ``);
        if (data.metadata.nextPage) {
          setNextPageUrl(data.metadata.nextPage);
        } else {
          notification.info({ title: "No more items to load." });
        }
      }
    } catch (error) {
      notification.error({
        title: "Fetching models failed.",
        description: `May you check your network?`,
      });
      throw error;
    } finally {
      setIsGalleryLoading(false);
    }
  }
  const debounceFetchModels = debounce(fetchModels, 500);

  useEffect(() => {
    debounceFetchModels({
      ...searchOptions,
      ...nonEffectiveSearchOpts,
      page: 1,
    });
  }, [searchOptions]);

  return isGalleryLoading ? (
    <div>Loading...</div>
  ) : isError ? (
    <GalleryContent />
  ) : (
    errorContent
  );
}

export default CivitaiModelsGallery;
