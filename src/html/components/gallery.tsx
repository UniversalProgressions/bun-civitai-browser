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
        <p>No preview available</p>
      </Card>
    );
  }

  // 根据文件扩展名判断是图片还是视频，不依赖item.type
  let filename = "";
  try {
    const urlobj = new URL(item.url);
    // 尝试从查询参数中提取filename
    const params = new URLSearchParams(urlobj.search);
    const filenameParam = params.get("filename");

    if (filenameParam) {
      filename = filenameParam;
    } else {
      // 否则从pathname中提取
      const pathParts = urlobj.pathname.split("/");
      filename = pathParts[pathParts.length - 1] || "";
    }
  } catch (e) {
    // 如果URL解析失败，尝试直接提取
    const lastSlashIndex = item.url.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const afterSlash = item.url.substring(lastSlashIndex + 1);
      filename = afterSlash.split("?")[0] || "";
    }
  }

  const fileType = getFileType(filename || "");
  const isVideo = fileType === "video";
  const isImage = fileType === "image" || fileType === "unknown" || !isVideo;

  if (isImage) {
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

  // Zoom functionality
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3)); // Maximum zoom 3x
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5)); // Minimum zoom 0.5x
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag functionality - Remove scale <= 1 restriction, allow dragging at any zoom level
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

  // Mouse wheel zoom functionality
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default scroll behavior
    e.preventDefault();

    // Zoom based on wheel direction
    if (e.deltaY < 0) {
      // Scroll up, zoom in
      handleZoomIn();
    } else {
      // Scroll down, zoom out
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

            // 安全地处理URL - 如果是相对路径，转换为完整URL
            let urlToUse = info.image.url;
            try {
              // 尝试创建URL对象来检查是否是有效的完整URL
              new URL(urlToUse);
            } catch (e) {
              // 如果是相对路径，添加当前origin
              if (typeof window !== "undefined" && urlToUse.startsWith("/")) {
                urlToUse = `${window.location.origin}${urlToUse}`;
              }
            }

            let filename = "";
            try {
              const urlobj = new URL(urlToUse);

              // 尝试从查询参数中提取filename参数
              const params = new URLSearchParams(urlobj.search);
              const filenameParam = params.get("filename");

              if (filenameParam) {
                // 如果有filename查询参数，使用它
                filename = filenameParam;
              } else {
                // 否则从pathname中提取
                const pathParts = urlobj.pathname.split("/");
                filename = pathParts[pathParts.length - 1] || "";
              }
            } catch (e) {
              // 仅在开发环境中显示URL解析失败警告
              if (import.meta.env.DEV) {
                console.warn("Failed to parse URL:", urlToUse, e);
              }
              // 如果仍然无法解析URL，尝试直接从URL字符串中提取文件名
              const lastSlashIndex = urlToUse.lastIndexOf("/");
              if (lastSlashIndex !== -1) {
                const afterSlash = urlToUse.substring(lastSlashIndex + 1);
                // 移除查询参数
                filename = afterSlash.split("?")[0] || "";
              }
            }

            const fileType = getFileType(filename || "");

            // 对于未知类型，默认使用图片渲染，因为大多数模型预览都是图片
            // 只有在明确是视频类型时才渲染video元素
            const isVideo = fileType === "video";
            const isImage = fileType === "image" || fileType === "unknown";

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
                  {isImage ? (
                    <img
                      src={info.image.url}
                      alt={info.image.alt ?? ""}
                      className="max-w-full max-h-[80vh] object-contain select-none"
                      draggable="false"
                    />
                  ) : isVideo ? (
                    <video
                      autoPlay
                      src={info.image.url}
                      className="max-w-full max-h-[80vh] object-contain select-none"
                      controls
                      draggable="false"
                    >
                      <track kind="captions" src="" label="English" />
                    </video>
                  ) : (
                    // 对于其他未知类型，也使用图片渲染
                    <img
                      src={info.image.url}
                      alt={info.image.alt ?? ""}
                      className="max-w-full max-h-[80vh] object-contain select-none"
                      draggable="false"
                    />
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
