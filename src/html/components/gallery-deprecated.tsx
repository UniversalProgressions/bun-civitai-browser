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
      <div onClick={() => setModalVisible(true)}>
        <img src={item.url} />
      </div>
    );
  } else {
    return (
      <div onClick={() => setModalVisible(true)}>
        <video src={item.url} autoPlay loop muted></video>
      </div>
    );
  }
}

export default function Gallery({ mediaArray }: { mediaArray: string[] }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // 缩放功能
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3)); // 最大放大3倍
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5)); // 最小缩小到0.5倍
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 拖拽功能 - 移除 scale <= 1 的限制，允许在任何缩放级别拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 滚轮缩放功能
  const handleWheel = (e: React.WheelEvent) => {
    // 阻止默认滚动行为
    e.preventDefault();

    // 根据滚轮方向缩放
    if (e.deltaY < 0) {
      // 向上滚动，放大
      handleZoomIn();
    } else {
      // 向下滚动，缩小
      handleZoomOut();
    }
  };
  return (
    <>
      <GalleryThumb
        item={{
          type: getFileType(
            new URL(mediaArray[0]).searchParams.get("previewFile")!
          ),
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
              transform: { flipX, flipY, rotate, x, y },
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
                <RotateRightOutlined onClick={onRotateRight} /> */}
                <ZoomOutOutlined
                  disabled={scale <= 0.5}
                  onClick={handleZoomOut}
                />
                <ZoomInOutlined disabled={scale >= 3} onClick={handleZoomIn} />
                <UndoOutlined onClick={handleReset} />
              </Space>
            );
          },
          imageRender: (originalNode, info) => {
            const { flipX, flipY, rotate, x, y } = info.transform;
            // const { alt, height, url, width } = info.image;
            console.log(info);
            const urlobj = new URL(info.image.url);
            const fileType = getFileType(
              urlobj.searchParams.get("previewFile")!
            );
            console.log(fileType);
            if (fileType !== "unknown") {
              // Build transform string including flip, rotate, and our custom scale/position
              const flipTransforms = [];
              if (flipX) flipTransforms.push("scaleX(-1)");
              if (flipY) flipTransforms.push("scaleY(-1)");
              const flipTransform = flipTransforms.join(" ");
              const rotateTransform =
                rotate !== 0 ? `rotate(${rotate}deg)` : "";
              const customTransform = `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`;

              // Combine transforms - order matters: flip -> rotate -> scale/translate
              const transform = [
                flipTransform,
                rotateTransform,
                customTransform,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div className="relative w-full max-w-4xl rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div
                    className="flex items-center justify-center cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    style={{
                      transform: transform,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 0.2s ease",
                      minHeight: "300px",
                    }}
                  >
                    {fileType === "image" ? (
                      <img
                        src={info.image.url}
                        alt={info.image.alt ?? ""}
                        className="max-w-full max-h-[80vh] object-contain select-none"
                        draggable="false"
                      />
                    ) : (
                      <video
                        autoPlay
                        src={info.image.url}
                        className="max-w-full max-h-[80vh] object-contain select-none"
                        controls
                        draggable="false"
                      />
                    )}
                  </div>
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
