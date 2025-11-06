import {
  Affix,
  FloatButton,
  List,
  notification,
  Pagination,
  Space,
} from "antd";
import { SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { atom, useAtom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import { useEffect, useState } from "react";
import { edenTreaty } from "../utils";
import {
  Model,
  type ModelsRequestOpts,
} from "../../modules/civitai/models/models_endpoint";
import {
  SearchPanel,
  GalleryModal,
  ModalWidthEnum,
} from "./localModelsGallery";

const modalWidthAtom = atom<ModalWidthEnum>(ModalWidthEnum.SearchPanel);
const modelsAtom = atomWithImmer<Model[]>([]);
const searchOptsAtom = atom<ModelsRequestOpts>({});
const nextPageUrlAtom = atom<string>(``);
const nonEffectiveSearchOptsAtom = atom<Partial<ModelsRequestOpts>>({
  page: 1,
  limit: 20,
});
const isGalleryLoadingAtom = atom<boolean>(false);
const isModalOpenAtom = atom<boolean>(false);
const modalContentAtom = atom<React.JSX.Element>(<div></div>);

function FloatingButtons() {
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalWidth, setModalWidth] = useAtom(modalWidthAtom);
  const [modalContent, setModalContent] = useAtom(modalContentAtom);

  return (
    <>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton
          icon={<SearchOutlined />}
          onClick={() => {
            setModalWidth(ModalWidthEnum.SearchPanel);
            setModalContent(<SearchPanel searchOptsAtom={searchOptsAtom} />);
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

function CivitaiPagination() {
  const [searchOptions, setSearchOptions] = useAtom(searchOptsAtom);
  const [nextPageUrl, setNextPageUrl] = useAtom(nextPageUrlAtom);
  const [nonEffectiveSearchOpts, setNonEffectiveSearchOpts] = useAtom(
    nonEffectiveSearchOptsAtom
  );
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [models, setModels] = useAtom(modelsAtom);

  async function loadNextPage() {
    if (nextPageUrl) {
      setIsGalleryLoading(true);
      try {
        const { data, error, headers, response, status } =
          await edenTreaty.civitai.api.v1.models.get({
            query: { ...searchOptions, ...nonEffectiveSearchOpts, page: 1 },
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
            notification.info({ message: "No more items to load." });
          }
        }
      } catch (error) {
        notification.error({
          message: "Error fetching models",
          description: String(error),
        });
        throw error;
      } finally {
        setIsGalleryLoading(false);
      }
    }
  }

  interface PaginationParams {
    page: number;
    limit: number;
    total: number;
  }

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

    return page >= totalPages;
  }

  return (
    <Pagination
      current={nonEffectiveSearchOpts.page ?? 1}
      pageSize={nonEffectiveSearchOpts.limit ?? 20}
      total={models.length}
      onChange={(page, pageSize) => {
        setNonEffectiveSearchOpts((prev) => ({
          ...prev,
          page,
          limit: pageSize,
        }));
        if (isLastPageSafe({ page, limit: pageSize, total: models.length })) {
          // If it's the last page, we can fetch the next set of results
          loadNextPage();
        }
      }}
      showSizeChanger
      showQuickJumper
      showTotal={(total) => `${total} items loaded!`}
    />
  );
}

function GalleryContent() {
  const [models] = useAtom(modelsAtom);
  const [nonEffectiveSearchOpts] = useAtom(nonEffectiveSearchOptsAtom);
  const [displayModels, setDisplayModels] = useState<Model[]>([]);
  const [modalContent] = useAtom(modalContentAtom);
  useEffect(() => {
    setDisplayModels(
      models.slice(
        // Start
        ((nonEffectiveSearchOpts.page ?? 1) - 1) *
          (nonEffectiveSearchOpts.limit ?? 20),
        // End
        ((nonEffectiveSearchOpts.page ?? 1) - 1) *
          (nonEffectiveSearchOpts.limit ?? 20) +
          (nonEffectiveSearchOpts.limit ?? 20)
      )
    );
  }, [models, nonEffectiveSearchOpts]);
  return (
    <>
      <Space align="center" direction="vertical" style={{ width: "100%" }}>
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
          dataSource={displayModels}
          renderItem={(item) => (
            <List.Item>{/* <ModelCard item={item} /> */}</List.Item>
          )}
        />

        <Affix offsetBottom={5}>
          <CivitaiPagination />
        </Affix>
      </Space>
      <GalleryModal
        isModalOpenAtom={isModalOpenAtom}
        modalContent={modalContent}
        modalWidthAtom={modalWidthAtom}
      />
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
  const [models, setModels] = useAtom(modelsAtom);
  const [nextPageUrl, setNextPageUrl] = useAtom(nextPageUrlAtom);
  async function fetchModels(searchOptions: ModelsRequestOpts) {
    setIsGalleryLoading(true);
    try {
      const { data, error, headers, response, status } =
        await edenTreaty.civitai.api.v1.models.get({ query: searchOptions });
      if (error) {
        throw error;
      } else {
        setModels((state) => {
          return data.items;
        });
        // setNextPageUrl(data.metadata.nextPage ?? ``);
        if (data.metadata.nextPage) {
          setNextPageUrl(data.metadata.nextPage);
        } else {
          notification.info({ message: "No more items to load." });
        }
      }
    } catch (error) {
      notification.error({
        message: "Fetching models failed.",
        description: `May you check your network?`,
      });
      throw error;
    } finally {
      setIsGalleryLoading(false);
    }
  }

  useEffect(() => {
    fetchModels({
      ...searchOptions,
      ...nonEffectiveSearchOpts,
      page: 1,
    });
  }, [searchOptions]);

  return isGalleryLoading ? <div>Loading...</div> : <GalleryContent />;
}

export default CivitaiModelsGallery;
