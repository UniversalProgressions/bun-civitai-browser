import { SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { Checkbox, FloatButton, Form, Modal, notification } from "antd";
import { useAtom } from "jotai";
import { useState } from "react";
import { localSearchOptionsAtom } from "../atoms";
import { SearchPanel } from "./SearchPanel";
import { edenTreaty } from "../../../utils";

export function FloatingButtons() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanForm] = Form.useForm();
  const [scanning, setScanning] = useState(false);
  const [_searchOpts, _setSearchOpts] = useAtom(localSearchOptionsAtom);

  const handleStartScan = async () => {
    const values = scanForm.getFieldsValue();
    setScanning(true);
    setIsScanModalOpen(false);

    notification.info({
      message: "Scanning local models...",
      description: "Please wait while we scan your local models directory.",
      duration: 0,
    });

    try {
      const response =
        await edenTreaty["local-models"]["enhanced-scan"].post(values);

      // Check if response has error (Eden Treaty style)
      if ((response as any).error) {
        const errorData = (response as any).error;
        let errorMessage = "Unknown error occurred";
        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === "object") {
          errorMessage =
            errorData.message ||
            errorData.value?.message ||
            errorData.value?.summary ||
            JSON.stringify(errorData);
        }
        throw new Error(errorMessage);
      }

      // Type assertion for the response data
      const result = (response as any).data;
      if (!result) {
        throw new Error("No data returned from scan");
      }

      notification.success({
        message: "Scan completed successfully",
        description: (
          <div>
            <p>Total files scanned: {result.totalFilesScanned}</p>
            <p>New records added: {result.newRecordsAdded}</p>
            <p>Existing records found: {result.existingRecordsFound}</p>
            <p>Repaired records: {result.repairedRecords}</p>
            <p>
              Scan duration: {(result.scanDurationMs / 1000).toFixed(2)} seconds
            </p>
            {result.failedFiles?.length > 0 && (
              <p style={{ color: "#ff4d4f" }}>
                Failed files: {result.failedFiles.length}
              </p>
            )}
          </div>
        ),
        duration: 8,
      });

      // TODO: Refresh local models list after scan
      // This would require refetching the models data
      // Currently the data fetching is in the parent component
    } catch (error) {
      notification.error({
        message: "Scan failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        duration: 4.5,
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton
          icon={<SearchOutlined />}
          onClick={() => {
            setIsModalOpen(true);
          }}
        />
        <FloatButton
          icon={<SyncOutlined spin={scanning} />}
          onClick={() => {
            if (!scanning) {
              setIsScanModalOpen(true);
            }
          }}
          tooltip={scanning ? "Scanning in progress..." : "Scan local models"}
          style={{
            cursor: scanning ? "not-allowed" : "pointer",
            opacity: scanning ? 0.6 : 1,
          }}
        />
        <FloatButton.BackTop visibilityHeight={0} />
      </FloatButton.Group>

      {/* Search Modal */}
      <Modal
        width={600}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        closable={false}
        open={isModalOpen}
        footer={null}
        centered
        destroyOnHidden={true} // force refetch data by force destory DOM
      >
        {isModalOpen ? (
          <SearchPanel
            setIsModalOpen={setIsModalOpen}
            searchOptsAtom={localSearchOptionsAtom}
          />
        ) : (
          <div>loading...</div>
        )}
      </Modal>

      {/* Scan Configuration Modal */}
      <Modal
        title="Local Models Scan Configuration"
        open={isScanModalOpen}
        onOk={handleStartScan}
        onCancel={() => setIsScanModalOpen(false)}
        okText="Start Scan"
        cancelText="Cancel"
        confirmLoading={scanning}
        okButtonProps={{ disabled: scanning }}
      >
        <Form form={scanForm} layout="vertical">
          <Form.Item
            name="incremental"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>Incremental Scan (only new/changed files)</Checkbox>
          </Form.Item>

          <Form.Item
            name="checkConsistency"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>Check Database Consistency</Checkbox>
          </Form.Item>

          <Form.Item
            name="repairDatabase"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Repair Inconsistent Records</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
