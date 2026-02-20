import { Card, Modal } from "antd";
import { useState } from "react";
import type { ModelTypes } from "../../../../civitai-api/v1/models/base-models/misc";
import type {
  Model,
  ModelVersion,
} from "../../../../civitai-api/v1/models/models";
import { MediaPreview, getPreviewFile } from "./MediaPreview";
import { ModelCardContent } from "./ModelCardContent";
import { LocalModelCardContentLeftSide } from "./LocalModelCardContentLeftSide";

interface ModelCardProps {
  item: Model;
}

export function ModelCard({ item }: ModelCardProps) {
  const [modelData, setModelData] = useState<Model | null>(null);
  const [_isError, _setIsError] = useState(false);
  const [_errorDescription, _setErrorDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 适配器函数：将GalleryContent期望的接口转换为LocalModelCardContentLeftSide需要的接口
  const adaptedLocalModelCardContentLeftSide = ({
    modelVersion,
  }: {
    modelVersion: ModelVersion;
  }) => {
    return (
      <LocalModelCardContentLeftSide
        modelVersion={modelVersion}
        modelId={item.id}
        modelType={item.type}
      />
    );
  };

  async function openModelCard(model: Model) {
    // TODO: Uncomment when the endpoint is available
    // const { data, error, headers, response, status } = await edenTreaty[
    //   "local-models"
    // ].models.modelId.post({
    //   modelId: model.id,
    //   modelVersionIdNumbers: model.modelVersions.map((v) => v.id),
    //   type: model.type as ModelTypes,
    // });
    // if (error?.status) {
    //   switch (error.status) {
    //     case 422:
    //       setErrorDescription(JSON.stringify(error.value, null, 2));
    //       break;
    //     default:
    //       setErrorDescription(String(error));
    //   }
    // } else {
    //   setModelData(data!);
    //   setIsModalOpen(true);
    // }

    // Temporary: Use the current model data
    setIsModalOpen(true);
    setModelData(model);
  }

  // 获取预览文件和对应的版本
  const previewInfo = getPreviewFile(item);

  return (
    <>
      <Card
        onClick={() => openModelCard(item)}
        hoverable
        cover={
          previewInfo.fileName ? (
            <MediaPreview
              fileName={previewInfo.fileName}
              model={item}
              version={
                previewInfo.versionId
                  ? {
                      id: previewInfo.versionId,
                      images: item.modelVersions[0].images,
                    }
                  : undefined
              }
            />
          ) : (
            <img
              alt="Have no preview"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo preview%3C/text%3E%3C/svg%3E"
            />
          )
        }
      >
        <Card.Meta description={item.name} />
      </Card>
      <Modal
        width={1000}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        closable={false}
        open={isModalOpen}
        footer={null}
        centered
        destroyOnHidden={true} // force refetch data by force destory DOM
      >
        {isModalOpen && modelData ? (
          <ModelCardContent
            data={modelData}
            ModelCardContentLeftSide={adaptedLocalModelCardContentLeftSide}
          />
        ) : (
          <div>loading...</div>
        )}
      </Modal>
    </>
  );
}
