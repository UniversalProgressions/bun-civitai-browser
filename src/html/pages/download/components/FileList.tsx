import { Button, List, Row, Col, Tag, notification } from "antd";
import { useAtom } from "jotai";
import clipboard from "clipboardy";
import type { ModelFile } from "#civitai-api/v1/models";
import type { ExistedModelVersions } from "#civitai-api/v1/models";
import { removeFileExtension } from "#civitai-api/v1/utils";
import { existedModelVersionsAtom } from "../atoms";

interface FileListProps {
  files: ModelFile[];
  versionId: number;
}

function FileList({ files, versionId }: FileListProps) {
  const [existedModelVersions] = useAtom(existedModelVersionsAtom);

  const handleCopyLoraString = async (fileId: number, fileName: string) => {
    const loraString = `<lora:${fileId}_${removeFileExtension(fileName)}:1>`;
    await clipboard.write(loraString);
    notification.success({
      title: "Lora string copied to clipboard",
      description: loraString,
    });
  };

  if (files.length === 0) {
    return <div>No files available</div>;
  }

  return (
    <List
      dataSource={files}
      renderItem={(file) => {
        const existingVersion = existedModelVersions.find(
          (obj: ExistedModelVersions[number]) => obj.versionId === versionId,
        );
        const isFileOnDisk = existingVersion?.filesOnDisk.includes(file.id);

        return (
          <List.Item>
            <Row>
              <Col span={18}>
                {isFileOnDisk ? <Tag color="green">onDisk</Tag> : undefined}
                {file.name}
              </Col>
              <Col span={6}>
                <Button
                  onClick={() => handleCopyLoraString(file.id, file.name)}
                >
                  Copy Lora String
                </Button>
              </Col>
            </Row>
          </List.Item>
        );
      }}
    />
  );
}

export default FileList;
