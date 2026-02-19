import {
  Tabs,
  Card,
  Space,
  Image,
  Button,
  Descriptions,
  List,
  Row,
  Col,
  Tag,
  Flex,
} from "antd";
import type { DescriptionsProps } from "antd";
import { useState } from "react";
import { useAtom } from "jotai";
import clipboard from "clipboardy";
import DOMPurify from "dompurify";
import { notification } from "antd";
import { edenTreaty } from "../../../utils";
import ShadowHTML from "../../../components/shadowHTML";
import { activeVersionIdAtom, civitaiExistedModelVersionsAtom } from "../atoms";
import { replaceUrlParam } from "../../../../civitai-api/v1/utils.js";
import type { Model } from "../../../../civitai-api/v1/models/index";

function ModelCardContent({ data }: { data: Model }) {
  const [activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const [existedModelversions, setExistedModelversions] = useAtom(
    civitaiExistedModelVersionsAtom,
  );

  async function onDownloadClick(model: Model, versionId: number) {
    setIsDownloadButtonLoading(true);
    try {
      const result = await edenTreaty.civitai_api.v1.download[
        "model-version"
      ].post({
        model,
        modelVersionId: versionId,
      });
      notification.success({
        title: "Download started",
      });
    } catch (error) {
      notification.error({
        title: "Download failed",
        description:
          error instanceof Error ? error.message : JSON.stringify(error),
      });
      console.error(error);
    } finally {
      setIsDownloadButtonLoading(false);
    }
  }

  return (
    <Tabs
      defaultActiveKey="1"
      tabPlacement="top"
      onChange={(id) => setActiveVersionId(id)}
      items={data?.modelVersions.map((v) => {
        const leftSide = (
          <>
            <Space align="center" orientation="vertical">
              {v.images[0]?.url ? (
                <Image.PreviewGroup
                  items={v.images.map((i) => replaceUrlParam(i.url))}
                >
                  <Image
                    width={200}
                    src={replaceUrlParam(v.images[0].url)}
                    alt="No previews"
                  />
                </Image.PreviewGroup>
              ) : (
                <img title="No preview available" alt="No preview available" />
              )}
              <Button
                type="primary"
                block
                onClick={() => onDownloadClick(data, v.id)}
                disabled={
                  existedModelversions.find((obj) => obj.versionId === v.id)
                    ?.filesOnDisk.length === v.files.length
                }
                loading={isDownloadButtonLoading}
              >
                Download
              </Button>
            </Space>
          </>
        );
        const descriptionItems: DescriptionsProps["items"] = [
          {
            key: v.id,
            label: "Version ID",
            children: v.id,
          },
          {
            key: v.baseModel,
            label: "Base Model",
            children: v.baseModel,
          },
          {
            key: 3,
            label: "Model Type",
            children: data.type,
          },
          {
            key: 4,
            label: "Publish Date",
            span: "filled",
            children: v.publishedAt?.toString() ?? "Null",
          },

          {
            key: 7,
            label: `Model Files`,
            span: `filled`,
            children:
              v.files.length > 0 ? (
                <List
                  dataSource={v.files}
                  renderItem={(file) => (
                    <List.Item>
                      <Row>
                        <Col span={18}>
                          {existedModelversions
                            .find((obj) => obj.versionId === v.id)
                            ?.filesOnDisk.includes(file.id) ? (
                            <Tag color="green">onDisk</Tag>
                          ) : undefined}
                          {file.name}
                        </Col>
                        <Col span={6}>
                          <Button
                            onClick={async () => {
                              await clipboard.write(file.name);
                              notification.success({
                                title: `${file.name} copied to clipboard`,
                              });
                            }}
                          >
                            Copy Filename
                          </Button>
                        </Col>
                      </Row>
                    </List.Item>
                  )}
                />
              ) : (
                "No files available"
              ),
          },
          {
            key: 8,
            label: "Tags",
            span: "filled",
            children: v.trainedWords ? (
              <Flex wrap gap="small">
                {v.trainedWords.map((tagStr, index) => (
                  <Button
                    key={`${v.id}-${index}`}
                    type="text"
                    size="small"
                    onClick={async () => {
                      await clipboard.write(tagStr);
                      notification.success({
                        title: "Copied to clipboard",
                      });
                    }}
                    className="
                        bg-blue-500 hover:bg-blue-700 text-white
                          font-bold p-1 rounded transition-all
                          duration-300 transform hover:scale-105
                          hover:cursor-pointer border-none"
                  >
                    {tagStr}
                  </Button>
                ))}
              </Flex>
            ) : undefined,
          },
          {
            key: 9,
            label: "Model Description",
            span: "filled",
            children: data.description ? (
              <ShadowHTML
                html={DOMPurify.sanitize(data.description)}
                key={`model-${data.id}-description`}
              ></ShadowHTML>
            ) : // <div
            //   className="bg-gray-300"
            //   dangerouslySetInnerHTML={{
            //     __html: DOMPurify.sanitize(data.description),
            //   }}
            // />
            undefined,
          },
          {
            key: 10,
            label: "Model Version Description",
            span: "filled",
            children: v.description ? (
              <ShadowHTML
                html={DOMPurify.sanitize(v.description)}
                key={`model-${data.id}-description`}
              ></ShadowHTML>
            ) : // <div
            //   className="bg-gray-300"
            //   dangerouslySetInnerHTML={{
            //     __html: DOMPurify.sanitize(v.description),
            //   }}
            // />
            undefined,
          },
        ];
        const rightSide = (
          <>
            <Space orientation="vertical">
              <Descriptions
                title="Model Version Details"
                layout="vertical"
                items={descriptionItems}
              ></Descriptions>
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
  );
}

export { ModelCardContent };
