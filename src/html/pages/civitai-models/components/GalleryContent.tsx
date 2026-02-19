import { Affix, Masonry, Space } from "antd";
import { useAtom } from "jotai";
import { modelsOnPageAtom } from "../atoms";
import { GalleryModal } from "./GalleryModal";
import { FloatingButtons } from "./FloatingButtons";
import { CivitaiPagination } from "./CivitaiPagination";
import { ModelCard } from "./ModelCard";

function GalleryContent() {
  const [modelsOnPage] = useAtom(modelsOnPageAtom);
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

export { GalleryContent };
