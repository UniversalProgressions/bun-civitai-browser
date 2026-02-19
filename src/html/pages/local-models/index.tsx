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
import {
  FloatingButtons,
  GalleryContent,
  LocalModelCardContentLeftSide,
  LocalPagination,
} from "./components";
import { edenTreaty } from "../../utils";

function LocalModelsGallery() {
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [models, setModels] = useAtom(modelsAtom);
  const [searchOpt, _setSearchOpt] = useAtom(localSearchOptionsAtom);
  const [_totalCount, setTotalCount] = useAtom(totalAtom);

  const fetchModels = useCallback(
    async (_opts: ModelsRequestOptions) => {
      setIsGalleryLoading(true);
      try {
        // TODO: Uncomment when the endpoint is available
        // const { data, error, headers, response, status } =
        //   await edenTreaty["local-models"].models.pagination.post(opts);
        // if (error) {
        //   throw error;
        // } else {
        //   setModels(data.records);
        //   setTotalCount(data.totalCount ?? 0);
        // }
        // Temporary: Return empty data
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
        <GalleryContent
          models={models}
          ModelCardContentLeftSide={LocalModelCardContentLeftSide}
        />
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
