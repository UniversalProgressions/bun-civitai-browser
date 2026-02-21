import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, Typography, Button, Space } from "antd";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card
          style={{
            margin: "24px",
            padding: "24px",
            maxWidth: "800px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <WarningOutlined style={{ fontSize: "48px", color: "#faad14" }} />
              <Title level={3} style={{ marginTop: "16px" }}>
                Something went wrong
              </Title>
              <Text type="secondary">
                An error occurred while rendering this component.
              </Text>
            </div>

            <div>
              <Title level={4}>Error Details</Title>
              <Paragraph
                code
                style={{ background: "#f5f5f5", padding: "12px" }}
              >
                {this.state.error?.toString() || "Unknown error"}
              </Paragraph>
            </div>

            {this.state.errorInfo && (
              <div>
                <Title level={5}>Component Stack</Title>
                <Paragraph
                  code
                  style={{
                    background: "#f5f5f5",
                    padding: "12px",
                    fontSize: "12px",
                    whiteSpace: "pre-wrap",
                    maxHeight: "200px",
                    overflow: "auto",
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Paragraph>
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <Space>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
              </Space>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Text type="secondary">
                If the problem persists, please check the browser console for
                more details.
              </Text>
            </div>
          </Space>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
