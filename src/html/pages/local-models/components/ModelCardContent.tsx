import {
  Button,
  Card,
  Col,
  Descriptions,
  type DescriptionsProps,
  Flex,
  notification,
  Row,
  Space,
  Tabs,
} from "antd";
import clipboard from "clipboardy";
import DOMPurify from "dompurify";
import type {
  Model,
  ModelVersion,
} from "../../../../civitai-api/v1/models/models";
import ShadowHTML from "../../../components/shadowHTML";

interface ModelCardContentProps {
  data: Model;
  ModelCardContentLeftSide: ({
    modelVersion,
    modelId,
    modelType,
  }: {
    modelVersion: ModelVersion;
    modelId: number;
    modelType: string;
  }) => React.JSX.Element;
}

export function ModelCardContent({
  data,
  ModelCardContentLeftSide,
}: ModelCardContentProps) {
  return (
    <Tabs
      defaultActiveKey="1"
      tabPlacement="top"
      items={data?.modelVersions.map((v) => {
        const leftSide = (
          <ModelCardContentLeftSide
            key={v.id}
            modelVersion={v}
            modelId={data.id}
            modelType={data.type}
          />
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
              v.files.length > 0
                ? v.files.map((file) => (
                    <Row key={file.id}>
                      <Col span={18}>{file.name}</Col>
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
                  ))
                : `have no files`,
          },
          {
            key: 8,
            label: "Tags",
            span: "filled",
            children: v.trainedWords ? (
              <Flex wrap gap="small">
                {v.trainedWords.map((tagStr) => (
                  <button
                    key={tagStr}
                    type="button"
                    onClick={async () => {
                      await clipboard.write(tagStr);
                      return notification.success({
                        title: "Copied to clipboard",
                      });
                    }}
                    className="
                        bg-blue-500 hover:bg-blue-700 text-white 
                          font-bold p-1 rounded transition-all 
                          duration-300 transform hover:scale-105
                          hover:cursor-pointer"
                  >
                    {tagStr}
                  </button>
                ))}
              </Flex>
            ) : undefined,
          },
          {
            key: 9,
            label: "Model Description",
            span: "filled",
            children: data.description ? (
              <ShadowHTML html={DOMPurify.sanitize(data.description)} />
            ) : undefined,
          },
          {
            key: 10,
            label: "Model Version Description",
            span: "filled",
            children: v.description ? (
              <ShadowHTML html={DOMPurify.sanitize(v.description)} />
            ) : undefined,
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
            </Card>
          ),
        };
      })}
    />
  );
}
