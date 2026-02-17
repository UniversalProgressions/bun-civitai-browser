import { Image, Card, Space } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { getFileType } from "../../civitai-api/v1/utils";
import type { ModelImageWithId } from "../../civitai-api/v1/models";

function GalleryThumb({
  item,
  setModalVisible,
}: {
  item?: ModelImageWithId;
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
      <button
        type="button"
        onClick={() => setModalVisible(true)}
        style={{ all: "unset", cursor: "pointer" }}
        aria-label="View image preview"
      >
        <img src={item.url} alt="" />
      </button>
    );
  } else {
    return (
      <button
        type="button"
        onClick={() => setModalVisible(true)}
        style={{ all: "unset", cursor: "pointer" }}
        aria-label="View video preview"
      >
        <video src={item.url} autoPlay loop muted>
          <track kind="captions" src="" label="English" />
        </video>
      </button>
    );
  }
}

export default function Gallery({ items }: { items: Array<ModelImageWithId> }) {
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
      <GalleryThumb item={items[0]} setModalVisible={setModalVisible} />
      <Image.PreviewGroup
        items={items.map((item) => ({
          src: item.url,
          alt: "",
        }))}
        preview={{
          open: modalVisible,
          onOpenChange: (value) => {
            setModalVisible(value);
          },
          actionsRender: (_, { current, total, actions: { onActive } }) => {
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
            // Extract filename from URL pathname
            const pathParts = urlobj.pathname.split("/");
            const filename = pathParts[pathParts.length - 1];
            const fileType = getFileType(filename || "");
            console.log(fileType, filename);
            // Build transform string including flip, rotate, and our custom scale/position
            const flipTransforms = [];
            if (flipX) flipTransforms.push("scaleX(-1)");
            if (flipY) flipTransforms.push("scaleY(-1)");
            const flipTransform = flipTransforms.join(" ");
            const rotateTransform = rotate !== 0 ? `rotate(${rotate}deg)` : "";
            const customTransform = `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`;

            // Combine transforms - order matters: flip -> rotate -> scale/translate
            const transform = [flipTransform, rotateTransform, customTransform]
              .filter(Boolean)
              .join(" ");

            return (
              <div className="relative w-full max-w-4xl rounded-lg bg-gray-100 dark:bg-gray-800">
                <div
                  className="flex items-center justify-center cursor-move"
                  role="application"
                  aria-label="Image viewer with drag and zoom controls"
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
                    >
                      <track kind="captions" src="" label="English" />
                    </video>
                  )}
                </div>
              </div>
            );
          },
        }}
      ></Image.PreviewGroup>
    </>
  );
}
