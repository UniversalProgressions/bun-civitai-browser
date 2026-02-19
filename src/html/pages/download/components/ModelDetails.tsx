import { Descriptions, type DescriptionsProps } from "antd";
import DOMPurify from "dompurify";
import ShadowHTML from "../../../components/shadowHTML";

interface ModelDetailsProps {
  versionId: number;
  baseModel: string;
  modelType: string;
  publishedAt?: string | null;
  description?: string | null;
  versionDescription?: string | null;
}

function ModelDetails({
  versionId,
  baseModel,
  modelType,
  publishedAt,
  description,
  versionDescription,
}: ModelDetailsProps) {
  const items: DescriptionsProps["items"] = [
    {
      key: versionId,
      label: "Version ID",
      children: versionId,
    },
    {
      key: baseModel,
      label: "Base Model",
      children: baseModel,
    },
    {
      key: 3,
      label: "Model Type",
      children: modelType,
    },
    {
      key: 4,
      label: "Publish Date",
      span: "filled",
      children: publishedAt ?? "Null",
    },
    {
      key: 9,
      label: "Model Description",
      span: "filled",
      children: description ? (
        <ShadowHTML html={DOMPurify.sanitize(description)} />
      ) : undefined,
    },
    {
      key: 10,
      label: "Model Version Description",
      span: "filled",
      children: versionDescription ? (
        <ShadowHTML html={DOMPurify.sanitize(versionDescription)} />
      ) : undefined,
    },
  ];

  return (
    <Descriptions
      title="Model Version Details"
      layout="vertical"
      items={items}
    />
  );
}

export default ModelDetails;
