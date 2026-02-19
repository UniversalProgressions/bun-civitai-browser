import { Alert, Space } from "antd";
import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import type { Model } from "#civitai-api/v1/models";
import { loadingAtom, modelContentAtom } from "./atoms";
import { InputBar, ModelCardContent } from "./components";

function DownloadPanel() {
  const [modelContent, setModelContent] = useAtom(modelContentAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [modelData, setModelData] = useState<Model | null>(null);

  const handleModelLoad = (data: Model) => {
    setModelData(data);
    setModelContent(<ModelCardContent data={data} />);
  };

  const handleError = (error: unknown) => {
    console.error("Failed to load model:", error);
    setModelContent(
      <Alert
        type="error"
        title="Failed to load model"
        description={error instanceof Error ? error.message : String(error)}
      />,
    );
  };

  // This effect could be used for additional data fetching based on search options
  useEffect(() => {
    // Currently not used, but could be extended for caching or other purposes
    if (modelData) {
      // Additional logic if needed
    }
  }, [modelData]);

  return (
    <>
      <Space
        orientation="vertical"
        align="center"
        className="w-full max-w-full"
      >
        <InputBar onModelLoad={handleModelLoad} onError={handleError} />
      </Space>
      <div className="p-2">
        {loading ? <div>loading...</div> : modelContent}
      </div>
    </>
  );
}

export default DownloadPanel;
