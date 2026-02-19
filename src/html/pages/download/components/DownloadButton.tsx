import { Button, notification } from "antd";
import { useState } from "react";
import { useAtom } from "jotai";
import { edenTreaty } from "../../../utils";
import type { Model } from "#civitai-api/v1/models";
import { existedModelVersionsAtom } from "../atoms";

interface DownloadButtonProps {
  model: Model;
  versionId: number;
  versionFilesCount: number;
  className?: string;
}

function DownloadButton({
  model,
  versionId,
  versionFilesCount,
  className,
}: DownloadButtonProps) {
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const [existedModelVersions] = useAtom(existedModelVersionsAtom);

  async function onDownloadClick() {
    setIsDownloadButtonLoading(true);
    try {
      const { data, error } = await edenTreaty.civitai_api.v1.download[
        "model-version"
      ].post({
        model,
        modelVersionId: versionId,
      });

      if (error) {
        // Elysia returns error in the error field with structure { status, value: { message, ... } }
        const errorMessage =
          error.value?.message || "Failed to start download task";
        notification.error({
          message: "Download failed",
          description: errorMessage,
        });
        console.error("Download API error:", error);
      } else {
        // Check if tasks were actually created
        const hasTasks =
          data &&
          ((data.modelfileTasksId && data.modelfileTasksId.length > 0) ||
            (data.mediaTaskIds && data.mediaTaskIds.length > 0));

        if (hasTasks) {
          notification.success({
            message: "Download started successfully",
            description: `Model: ${model.name}, Version: ${versionId}`,
          });
        } else {
          notification.warning({
            message: "No download tasks created",
            description:
              "All files may already exist on disk or no files to download",
          });
        }
      }
    } catch (error) {
      // Network error or other exceptions
      notification.error({
        message: "Download failed",
        description:
          error instanceof Error ? error.message : JSON.stringify(error),
      });
      console.error("Download error:", error);
    } finally {
      setIsDownloadButtonLoading(false);
    }
  }

  // Check if all files are already on disk
  const existingVersion = existedModelVersions.find(
    (obj) => obj.versionId === versionId,
  );
  const filesOnDiskCount = existingVersion?.filesOnDisk.length ?? 0;
  const allFilesOnDisk = filesOnDiskCount === versionFilesCount;

  return (
    <Button
      type="primary"
      block
      onClick={onDownloadClick}
      disabled={allFilesOnDisk}
      loading={isDownloadButtonLoading}
      className={className}
    >
      Download
    </Button>
  );
}

export default DownloadButton;
