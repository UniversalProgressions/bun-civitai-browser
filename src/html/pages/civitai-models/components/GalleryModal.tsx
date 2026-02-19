import { Modal } from "antd";
import { useAtom } from "jotai";
import { modalStateAtom, ModalType, ModalWidthEnum } from "../atoms";
import { SearchPanel } from "./SearchPanel";
import { ModelCardContent } from "./ModelCardContent";

function GalleryModal() {
  const [modalState, setModalState] = useAtom(modalStateAtom);

  const handleClose = () => {
    setModalState({
      type: ModalType.NONE,
      isOpen: false,
      width: ModalWidthEnum.SearchPanel,
    });
  };

  const renderContent = () => {
    switch (modalState.type) {
      case ModalType.SEARCH:
        return <SearchPanel />;
      case ModalType.MODEL_DETAIL:
        return modalState.params?.modelData ? (
          <ModelCardContent data={modalState.params.modelData} />
        ) : (
          <div>No model data available</div>
        );
      case ModalType.NONE:
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <Modal
      width={modalState.width}
      onOk={handleClose}
      onCancel={handleClose}
      closable={false}
      open={modalState.isOpen}
      footer={null}
      centered
      destroyOnHidden={true}
    >
      {modalState.isOpen ? renderContent() : <div>Loading...</div>}
    </Modal>
  );
}

export { GalleryModal };
