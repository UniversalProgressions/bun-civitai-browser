import { FloatButton } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useAtom } from "jotai";
import {
  modalStateAtom,
  tempSearchOptsAtom,
  searchOptsAtom,
  ModalType,
  ModalWidthEnum,
} from "../atoms";

function FloatingButtons() {
  const [, setModalState] = useAtom(modalStateAtom);
  const [, setTempSearchOpt] = useAtom(tempSearchOptsAtom);
  const [searchOpt] = useAtom(searchOptsAtom);

  const handleOpenSearch = () => {
    setTempSearchOpt(structuredClone(searchOpt));
    setModalState({
      type: ModalType.SEARCH,
      isOpen: true,
      width: ModalWidthEnum.SearchPanel,
      params: {
        searchOptions: searchOpt,
      },
    });
  };

  return (
    <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
      <FloatButton icon={<SearchOutlined />} onClick={handleOpenSearch} />
      <FloatButton.BackTop visibilityHeight={0} />
    </FloatButton.Group>
  );
}

export { FloatingButtons };
