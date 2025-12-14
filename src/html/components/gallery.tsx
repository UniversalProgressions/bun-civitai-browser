import { Image, Button, Card, Space } from "antd";
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { type } from "arktype";
import {
  extractFilenameFromUrl,
  getFileType,
} from "#modules/civitai/service/sharedUtils";

const mediaItem = type({
  url: "string",
  type: "'image' | 'video' | 'unknown'",
});
type MediaItem = typeof mediaItem.infer;

function GalleryThumb({
  item,
  modalVisible,
  setModalVisible,
}: {
  item?: MediaItem;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}) {
  if (item === undefined) {
    return (
      <Card>
        <p>have no preview</p>
      </Card>
    );
  } else if (item.type === "image") {
    return (
      <Card
        cover={<Image src={item.url} />}
        onClick={() => setModalVisible(true)}
      />
    );
  } else {
    return (
      <Card
        cover={<video src={item.url} autoPlay loop muted></video>}
        onClick={() => setModalVisible(true)}
      />
    );
  }
}

export default function Gallery({ mediaArray }: { mediaArray: string[] }) {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <GalleryThumb
        item={{
          type: getFileType(extractFilenameFromUrl(mediaArray[0])),
          url: mediaArray[0],
        }}
        modalVisible
        setModalVisible={setModalVisible}
      />
      <Image.PreviewGroup
        items={mediaArray}
        preview={{
          open: modalVisible,
          onOpenChange: (value) => {
            setModalVisible(value);
          },
          actionsRender: (
            _,
            {
              current,
              icons,
              image,
              total,
              transform: { scale, flipX, flipY, rotate, x, y },
              actions: {
                onClose,
                onActive,
                onFlipY,
                onFlipX,
                onRotateLeft,
                onRotateRight,
                onZoomOut,
                onZoomIn,
                onReset,
              },
            }
          ) => {
            return (
              <Space size={12} className="toolbar-wrapper">
                <LeftOutlined
                  disabled={current === 0}
                  onClick={() => onActive?.(-1)}
                />
                <RightOutlined
                  disabled={current === total - 1}
                  onClick={() => onActive?.(1)}
                />
                {/* <DownloadOutlined onClick={onDownload} /> */}
                {/* <SwapOutlined rotate={90} onClick={onFlipY} />
                <SwapOutlined onClick={onFlipX} />
                <RotateLeftOutlined onClick={onRotateLeft} />
                <RotateRightOutlined onClick={onRotateRight} />
                <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                <UndoOutlined onClick={onReset} /> */}
              </Space>
            );
          },
          imageRender: (originalNode, info) => {
            const { flipX, flipY, rotate, scale, x, y } = info.transform;
            // const { alt, height, url, width } = info.image;
            console.log(info);
            const urlobj = new URL(info.image.url);
            const fileType = getFileType(
              urlobj.searchParams.get("previewFile")!
            );
            if (fileType === "image") {
              return (
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                  <img
                    className="w-full h-auto max-h-[80vh] md:max-h-[80vh] lg:max-h-[80vh] object-contain rounded-lg"
                    src={info.image.url}
                  />
                </div>
              );
            } else if (fileType === "video") {
              return (
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                  <video
                    className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-[80vh] md:max-h-[80vh] lg:max-h-[80vh]"
                    src={info.image.url}
                    controls
                    autoPlay
                    loop
                  ></video>
                </div>
              );
            } else {
              return (
                <Card>
                  <p>Unknown file type</p>
                  <p>url: {info.image.url}</p>
                </Card>
              );
            }
          },
        }}
      ></Image.PreviewGroup>
    </>
  );
}
