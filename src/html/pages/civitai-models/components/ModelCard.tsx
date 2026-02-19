import { Card } from "antd";
import { useAtom } from "jotai";
import { modalStateAtom, ModalType, ModalWidthEnum } from "../atoms";
import { MediaPreview } from "./MediaPreview";
import type { Model } from "../../../../civitai-api/v1/models/index";

function ModelCard({ item }: { item: Model }) {
  const [, setModalState] = useAtom(modalStateAtom);

  function openModelCard(item: Model) {
    setModalState({
      type: ModalType.MODEL_DETAIL,
      isOpen: true,
      width: ModalWidthEnum.modelDetailCard,
      params: {
        modelData: item,
      },
    });
  }

  return (
    <Card
      onClick={() => openModelCard(item)}
      hoverable
      cover={
        item.modelVersions[0]?.images[0]?.url ? (
          <MediaPreview url={item.modelVersions[0].images[0].url} />
        ) : (
          <img title="No preview available" alt="No model preview available" />
        )
      }
    >
      <Card.Meta description={item.name} />
    </Card>
  );
}

export { ModelCard };
