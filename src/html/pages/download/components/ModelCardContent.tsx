import { Card, Col, Row, Space, Tabs } from "antd";
import { useAtom } from "jotai";
import Gallery from "../../../components/gallery";
import { replaceUrlParam } from "#civitai-api/v1/utils";
import { activeVersionIdAtom } from "../atoms";
import DownloadButton from "./DownloadButton";
import FileList from "./FileList";
import TagList from "./TagList";
import ModelDetails from "./ModelDetails";
import type { Model } from "#civitai-api/v1/models";

interface ModelCardContentProps {
  data: Model;
}

function ModelCardContent({ data }: ModelCardContentProps) {
  const [_activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);

  // https://blog.csdn.net/weixin_42579348/article/details/124397538 Antd Tabs longer than window problem.
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", width: "100%" }}>
        <Tabs
          defaultActiveKey="1"
          tabPlacement="top"
          onChange={(id) => setActiveVersionId(id)}
          items={data?.modelVersions.map((v) => {
            const leftSide = (
              <>
                <Space align="center" orientation="vertical" size="middle">
                  {v.images.length > 0 ? (
                    <Gallery
                      items={v.images.map((img) => ({
                        ...img,
                        url: replaceUrlParam(img.url),
                      }))}
                    />
                  ) : (
                    <div
                      style={{
                        width: 200,
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        border: "1px dashed #d9d9d9",
                        borderRadius: "8px",
                      }}
                      title="No preview available"
                    >
                      <span style={{ color: "#999" }}>No preview</span>
                    </div>
                  )}
                  <DownloadButton
                    model={data}
                    versionId={v.id}
                    versionFilesCount={v.files.length}
                  />
                </Space>
              </>
            );

            const rightSide = (
              <>
                <Space orientation="vertical">
                  <ModelDetails
                    versionId={v.id}
                    baseModel={v.baseModel}
                    modelType={data.type}
                    publishedAt={v.publishedAt?.toString()}
                    description={data.description}
                    versionDescription={v.description}
                  />
                  <div>
                    <strong>Model Files</strong>
                    <FileList files={v.files} versionId={v.id} />
                  </div>
                  <div>
                    <strong>Tags</strong>
                    <TagList trainedWords={v.trainedWords} />
                  </div>
                </Space>
              </>
            );

            return {
              label: v.name,
              key: v.id.toString(),
              children: (
                <Card>
                  <Space align="center" orientation="vertical">
                    <div>
                      <a
                        className="clickable-title"
                        target="_blank"
                        href={`https://civitai.com/models/${data.id}?modelVersionId=${v.id}`}
                      >
                        {data.name}
                      </a>
                    </div>
                    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                      <Col sm={8} lg={6}>
                        {leftSide}
                      </Col>
                      <Col sm={16} lg={18}>
                        {rightSide}
                      </Col>
                    </Row>
                  </Space>
                </Card>
              ),
            };
          })}
        />
      </div>
    </div>
  );
}

export default ModelCardContent;
