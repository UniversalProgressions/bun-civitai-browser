import {
  Affix,
  Button,
  Card,
  Col,
  Descriptions,
  type DescriptionsProps,
  Flex,
  FloatButton,
  Image,
  Input,
  List,
  Modal,
  notification,
  Pagination,
  type PaginationProps,
  Row,
  Select,
  type SelectProps,
  Space,
  Tabs,
} from "antd";
const { Search } = Input;
import { SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import clipboard from "clipboardy";
import DOMPurify from "dompurify";
import { edenTreaty, getFileType } from "../utils";
import { type ModelsRequestOpts } from "../../modules/civitai/models/models_endpoint";
import { type ModelTypes } from "../../modules/civitai/models/baseModels/misc";
import { type ModelWithAllRelations } from "../../modules/civitai/service/crud/modelId";
import { extractFilenameFromUrl } from "#modules/civitai/service/utils";

const isGalleryLoadingAtom = atom(false);
const modelsAtom = atom<Array<ModelWithAllRelations>>([]);
const localSearchOptionsAtom = atom<ModelsRequestOpts>({});
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

function FloatingButtons() {
  const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalContent, setModalContent] = useAtom(modalContentAtom);

  function SearchPanel() {
    const options: SelectProps["options"] = [];
    const onSearch = (value: string) => {};
    return (
      <>
        <Space direction="vertical">
          <Search
            placeholder="input search text"
            onSearch={onSearch}
            enterButton
            value={searchOpt.query}
          />
          <Select
            placeholder="Base model"
            value={searchOpt.baseModels}
          >
          </Select>
          <Select placeholder="Model Type" value={searchOpt.types}></Select>
          <Select
            placeholder="Checkpoint Type"
            value={searchOpt.checkpointType}
          >
          </Select>
          <Select placeholder="Period" value={searchOpt.period}></Select>
          <Select placeholder="Sort" value={searchOpt.sort}></Select>
          <Select placeholder="Tag" value={searchOpt.tag}></Select>
        </Space>
      </>
    );
  }
  return (
    <>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton
          icon={<SearchOutlined />}
          onClick={() => {
            setModalContent(<SearchPanel />);
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

function LocalModelsGallery() {
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [modelsAtomValue, setModelsAtom] = useAtom(modelsAtom);
  const [isCardModalOpen, setIsCardModalOpen] = useAtom(isModalOpenAtom);
  const [cardModalContent, setCardModalContent] = useAtom(modalContentAtom);
  const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [totalCount, setTotalCount] = useAtom(totalAtom);

  async function fetchModels(opts: ModelsRequestOpts) {
    try {
      const { data, error, headers, response, status } = await edenTreaty
        .civitai.local.models.pagination.post(opts);
      if (error) {
        throw error;
      } else {
        setModelsAtom(data.records);
        setTotalCount(data.totalCount ?? 0);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsGalleryLoading(false);
    }
  }

  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);

  async function openModelCard(dbModel: ModelWithAllRelations) {
    const { data, error, headers, response, status } = await edenTreaty.civitai
      .local.models.modelId.post({
        modelId: dbModel.id,
        modelVersionIdNumbers: dbModel.modelVersions.map((v) => v.id),
        type: dbModel.type.name as ModelTypes,
      });
    if (error?.status) {
      switch (error.status) {
        case 422:
          setCardModalContent(<>{JSON.stringify(error.value, null, 2)}</>);
        default:
          setCardModalContent(<div>Unknown Exception</div>);
      }
    } else {
      setCardModalContent(
        <>
          <Tabs
            defaultActiveKey="1"
            tabPosition="top"
            onChange={(id) => setActiveVersionId(id)}
            items={data?.modelVersions.map((v) => {
              const leftSide = (
                <>
                  <div>
                    {dbModel.previewFile
                      ? (
                        <Image.PreviewGroup
                          items={v.images.map((i) =>
                            `${location.origin}/civitai/local/media/preview?previewFile=${
                              extractFilenameFromUrl(i.url)
                            }`
                          )}
                        >
                          <Image
                            width={200}
                            src={`${location.origin}/civitai/local/media/preview?previewFile=${dbModel.previewFile}`}
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
                                        message:
                                          `${file.name} copied to clipboard`,
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
        </>,
      );
    }
    setIsCardModalOpen(true);
  }

  useEffect(() => {
    fetchModels(searchOpt);
  }, [searchOpt]); // [] 表示组件挂载时只执行一次

  const LoadingContent = () => <div>Loading...</div>;

  const GalleryContent = () => (
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
            xxl: 3,
          }}
          dataSource={modelsAtomValue}
          renderItem={(item) => (
            <List.Item>
              <Card
                onClick={() => openModelCard(item)}
                hoverable
                cover={item.previewFile
                  ? <MediaPreview fileName={item.previewFile} />
                  : <img title="Have no preview" />}
              >
                <Card.Meta description={item.name} />
              </Card>
            </List.Item>
          )}
        />

        <Affix offsetBottom={5}>
          <LocalPagination />
        </Affix>
      </Space>
      <Modal
        width={1000}
        onOk={() => setIsCardModalOpen(false)}
        onCancel={() => setIsCardModalOpen(false)}
        closable={false}
        open={isCardModalOpen}
        footer={null}
        centered
        destroyOnHidden={true} // force refetch data by force destory DOM
      >
        {isCardModalOpen ? cardModalContent : <div>loading...</div>}
      </Modal>
      <FloatingButtons />
    </>
  );

  return <>{isGalleryLoading ? <LoadingContent /> : <GalleryContent />}</>;
}

export default LocalModelsGallery;
