import { Affix, Space } from "antd";
import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import type { ModelsRequestOptions } from "../../../civitai-api/v1/models/models";
import {
  isGalleryLoadingAtom,
  localSearchOptionsAtom,
  modelsAtom,
  totalAtom,
} from "./atoms";
import { FloatingButtons, GalleryContent, LocalPagination } from "./components";
import { edenTreaty } from "../../utils";

function LocalModelsGallery() {
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [models, setModels] = useAtom(modelsAtom);
  const [searchOpt, _setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [_totalCount, setTotalCount] = useAtom(totalAtom);

  const fetchModels = useCallback(
    async (opts: ModelsRequestOptions) => {
      setIsGalleryLoading(true);
      try {
        // 调用新的 /local-models/models/on-disk 端点
        const { data, error } =
          await edenTreaty["local-models"]["models"]["on-disk"].post(opts);
        if (error) {
          throw error;
        } else {
          // 新的数据结构包含 model 和 version 字段
          // 我们需要将数据转换为前端期望的格式
          setModels(data.items.map((item) => item.model));
          setTotalCount(data.metadata.totalItems ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch local models:", error);
        setModels([]);
        setTotalCount(0);
      } finally {
        setIsGalleryLoading(false);
      }
    },
    [setIsGalleryLoading, setModels, setTotalCount],
  );

  useEffect(() => {
    fetchModels(searchOpt);
  }, [fetchModels, searchOpt]);

  return (
    <>
      {isGalleryLoading ? (
        <div>Loading...</div>
      ) : (
        <GalleryContent models={models} />
      )}
      <Space orientation="vertical" align="center" className="w-full">
        <Affix offsetBottom={5}>
          <LocalPagination />
        </Affix>
        <FloatingButtons />
      </Space>
    </>
  );
}

export default LocalModelsGallery;
