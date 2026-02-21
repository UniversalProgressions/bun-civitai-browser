import { useEffect } from "react";
import { useAtom } from "jotai";
import { Alert, Button, Modal, Space, Typography, Spin } from "antd";
import { SettingFilled, ExclamationCircleOutlined } from "@ant-design/icons";
import {
  settingsValidAtom,
  settingsCheckingAtom,
  settingsInitializedAtom,
  showSetupRequiredAtom,
  initialSetupRequiredAtom,
} from "../atoms";
import { edenTreaty } from "../utils";

const { Title, Text, Paragraph } = Typography;

/**
 * Component that checks application settings on mount
 * and handles the initial setup flow
 */
export function SettingsCheck() {
  const [settingsValid, setSettingsValid] = useAtom(settingsValidAtom);
  const [settingsChecking, setSettingsChecking] = useAtom(settingsCheckingAtom);
  const [settingsInitialized, setSettingsInitialized] = useAtom(
    settingsInitializedAtom,
  );
  const [showSetupRequired, setShowSetupRequired] = useAtom(
    showSetupRequiredAtom,
  );
  const [initialSetupRequired, setInitialSetupRequired] = useAtom(
    initialSetupRequiredAtom,
  );

  // Check settings on component mount
  useEffect(() => {
    const checkSettings = async () => {
      try {
        setSettingsChecking(true);

        // Call settings API
        const response = await edenTreaty.settings.api.settings.get();

        if (response.error) {
          console.error("Failed to check settings:", response.error);
          setSettingsValid(false);
          setInitialSetupRequired(true);
          setShowSetupRequired(true);
        } else {
          const settingsData = response.data;
          const isConfigured = settingsData !== null;

          setSettingsValid(isConfigured);
          setInitialSetupRequired(!isConfigured);
          setShowSetupRequired(!isConfigured);

          // If settings are configured, we can proceed
          if (isConfigured) {
            console.log("Settings are configured and valid");
          } else {
            console.log("Settings not configured - initial setup required");
          }
        }
      } catch (error) {
        console.error("Error checking settings:", error);
        setSettingsValid(false);
        setInitialSetupRequired(true);
        setShowSetupRequired(true);
      } finally {
        setSettingsChecking(false);
        setSettingsInitialized(true);
      }
    };

    checkSettings();
  }, [
    setSettingsValid,
    setSettingsChecking,
    setSettingsInitialized,
    setInitialSetupRequired,
    setShowSetupRequired,
  ]);

  // If settings check is in progress, show loading state
  if (settingsChecking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <Text>Checking application configuration...</Text>
      </div>
    );
  }

  // If settings are not valid and we should show setup UI
  if (showSetupRequired) {
    return (
      <Modal
        open={true}
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <Title level={4} style={{ margin: 0 }}>
              Initial Setup Required
            </Title>
          </Space>
        }
        footer={[
          <Button
            key="configure"
            type="primary"
            icon={<SettingFilled />}
            onClick={() => {
              // Switch to settings tab - use a safer approach
              try {
                const settingsTab = document.querySelector(
                  '[data-node-key="settings"]',
                );
                if (settingsTab) {
                  // Create a mouse event to simulate click
                  const clickEvent = new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  });
                  settingsTab.dispatchEvent(clickEvent);
                }
              } catch (error) {
                console.error("Failed to switch to settings tab:", error);
              }
              setShowSetupRequired(false);
            }}
            size="large"
          >
            Configure Settings
          </Button>,
        ]}
        closable={false}
        maskClosable={false}
        width={600}
      >
        <div style={{ padding: "24px 0" }}>
          <Paragraph>
            Welcome to the CivitAI Browser! Before you can start browsing and
            downloading models, you need to configure some essential settings.
          </Paragraph>

          <Alert
            type="info"
            showIcon
            message="Required Configuration"
            description={
              <div style={{ marginTop: 8 }}>
                <Text strong>1. CivitAI API Key</Text>
                <br />
                <Text type="secondary">
                  Your personal API key from CivitAI to access the model
                  database.
                </Text>
                <br />
                <br />
                <Text strong>2. Models Saving Location</Text>
                <br />
                <Text type="secondary">
                  The folder where downloaded models will be saved on your
                  computer.
                </Text>
                <br />
                <br />
                <Text strong>3. GopeedAPI Host</Text>
                <br />
                <Text type="secondary">
                  The address of your Gopeed download manager (e.g.,
                  http://localhost:9999).
                </Text>
              </div>
            }
            style={{ marginBottom: 24 }}
          />

          <Paragraph type="secondary">
            Once configured, you'll be able to browse models, download them, and
            manage your downloads.
          </Paragraph>
        </div>
      </Modal>
    );
  }

  // If settings are valid or we're not showing setup UI, render nothing
  return null;
}

/**
 * Higher-order component that wraps any component with settings check
 */
export function withSettingsCheck<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  return function WithSettingsCheck(props: P) {
    return (
      <>
        <SettingsCheck />
        <Component {...props} />
      </>
    );
  };
}
