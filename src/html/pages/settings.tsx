import { Button, Form, Input, Alert, Row, Col, notification } from "antd";
import { edenTreaty } from "../utils";
import { type Settings } from "../../modules/settings/model";
import { useState, useEffect } from "react";

/**
 * Settings component with improved readability using Form.useForm()
 * Handles both initial setup and updates of application settings
 * Features responsive design using Ant Design Grid system
 */
function SettingsPage() {
  // Form instance for better state management and readability
  const [form] = Form.useForm();

  // Component state - grouped for clarity
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  // Load initial settings - separated for better readability
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await edenTreaty.settings.api.settings.get();

        if (response.error) {
          setError(
            `Failed to load settings: ${JSON.stringify(response.error)}`,
          );
          return;
        }

        const settingsData = response.data;
        const isSetupRequired = settingsData === null;

        // Update form with loaded values or empty values for initial setup
        if (settingsData) {
          form.setFieldsValue({
            civitai_api_token: settingsData.civitai_api_token,
            basePath: settingsData.basePath,
            http_proxy: settingsData.http_proxy || "",
            gopeed_api_host: settingsData.gopeed_api_host,
            gopeed_api_token: settingsData.gopeed_api_token || "",
          });
        } else {
          // Initial setup - set empty values
          form.setFieldsValue({
            civitai_api_token: "",
            basePath: "",
            http_proxy: "",
            gopeed_api_host: "",
            gopeed_api_token: "",
          });
        }

        setIsInitialSetup(isSetupRequired);
      } catch (err) {
        setError(
          "An error has occurred: Can't communicate with server, maybe it's not even running yet.",
        );
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [form]);

  // Handle form submission - centralized logic for better readability
  const handleSubmit = async (values: Settings) => {
    try {
      setSubmitting(true);

      // Convert form values to Settings object
      const updatedSettings: Settings = {
        civitai_api_token: values.civitai_api_token,
        basePath: values.basePath,
        http_proxy: values.http_proxy || undefined,
        gopeed_api_host: values.gopeed_api_host,
        gopeed_api_token: values.gopeed_api_token || undefined,
      };

      // Send update to server
      const response =
        await edenTreaty.settings.api.settings.post(updatedSettings);

      if (response.error) {
        console.error("Failed to save settings:", response.error);
        notification.error({
          message: "Save Failed",
          description: "Failed to save settings. Please try again.",
          duration: 3,
        });
        return;
      }

      // Success handling
      notification.success({
        message: "Settings Saved",
        description: "Your settings have been successfully saved.",
        duration: 3,
      });

      // Update initial setup flag if this was the first setup
      if (isInitialSetup) {
        setIsInitialSetup(false);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      notification.error({
        message: "Save Failed",
        description: "An unexpected error occurred. Please try again.",
        duration: 3,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission errors
  const handleSubmitFailed = (errorInfo: any) => {
    console.log("Form validation failed:", errorInfo);
    notification.warning({
      message: "Validation Error",
      description: "Please check the form for errors.",
      duration: 3,
    });
  };

  // Show loading state
  if (loading) {
    return "Loading...";
  }

  // Show error state
  if (error) {
    return <Alert type="error" title="Error" description={error} showIcon />;
  }

  // Responsive form layout configuration
  const formItemLayout = {
    // Responsive label column configuration
    labelCol: {
      xs: { span: 24 }, // Mobile: full width
      sm: { span: 24 }, // Small tablet: full width
      md: { span: 8 }, // Medium: 8/24
      lg: { span: 6 }, // Large: 6/24
      xl: { span: 6 }, // Extra large: 6/24
    },
    // Responsive wrapper column configuration
    wrapperCol: {
      xs: { span: 24 }, // Mobile: full width
      sm: { span: 24 }, // Small tablet: full width
      md: { span: 16 }, // Medium: 16/24
      lg: { span: 18 }, // Large: 18/24
      xl: { span: 18 }, // Extra large: 18/24
    },
  };

  // Responsive button layout
  const buttonLayout = {
    wrapperCol: {
      xs: { span: 24, offset: 0 }, // Mobile: full width, no offset
      sm: { span: 24, offset: 0 }, // Small tablet: full width, no offset
      md: { span: 16, offset: 8 }, // Medium: offset to align with input fields
      lg: { span: 18, offset: 6 }, // Large: offset to align with input fields
      xl: { span: 18, offset: 6 }, // Extra large: offset to align with input fields
    },
  };

  return (
    <div style={{ padding: "24px" }}>
      {isInitialSetup && (
        <Row justify="center">
          <Col
            xs={24} // Mobile: full width
            sm={24} // Small tablet: full width
            md={20} // Medium: 20/24
            lg={18} // Large: 18/24
            xl={16} // Extra large: 16/24
          >
            <Alert
              type="info"
              title="Initial Setup Required"
              description="This is your first time using the application. Please configure the required settings below to get started."
              showIcon
              style={{ marginBottom: 24 }}
            />
          </Col>
        </Row>
      )}

      <Row justify="center">
        <Col
          xs={24} // Mobile: full width
          sm={24} // Small tablet: full width
          md={20} // Medium: 20/24
          lg={18} // Large: 18/24
          xl={16} // Extra large: 16/24
        >
          <Form
            form={form}
            name="settings"
            onFinish={handleSubmit}
            onFinishFailed={handleSubmitFailed}
            autoComplete="off"
            {...formItemLayout}
            layout="horizontal"
            colon={false}
          >
            <Form.Item
              label="CivitAI API Key"
              name="civitai_api_token"
              rules={[
                {
                  required: true,
                  message: "Please input your CivitAI API key here!",
                },
              ]}
              labelAlign="left"
            >
              <Input placeholder="Enter your CivitAI API key" size="large" />
            </Form.Item>

            <Form.Item
              label="Models saving location"
              name="basePath"
              rules={[
                {
                  required: true,
                  message:
                    "Please input the location of where your models will be saved at.",
                },
              ]}
              labelAlign="left"
            >
              <Input
                placeholder="Enter the path where models will be saved"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Proxy"
              name="http_proxy"
              rules={[
                {
                  required: false,
                  message:
                    "You could set your proxy address for downloading at here. (optional)",
                },
              ]}
              labelAlign="left"
            >
              <Input
                placeholder="Optional proxy address (e.g., http://proxy.example.com:8080)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="GopeedAPI Host"
              name="gopeed_api_host"
              rules={[
                {
                  required: true,
                  message: "Please input your GopeedAPI host address here!",
                },
              ]}
              labelAlign="left"
            >
              <Input
                placeholder="Enter GopeedAPI host address (e.g., http://localhost:9999)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="GopeedAPI Token"
              name="gopeed_api_token"
              rules={[
                {
                  required: false,
                  message: "Optional GopeedAPI token",
                },
              ]}
              labelAlign="left"
            >
              <Input placeholder="Optional GopeedAPI token" size="large" />
            </Form.Item>

            <Form.Item {...buttonLayout}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={submitting}
                size="large"
                style={{
                  marginTop: "16px",
                }}
              >
                {isInitialSetup
                  ? "Complete Setup"
                  : submitting
                    ? "Saving..."
                    : "Save Settings"}
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default SettingsPage;
