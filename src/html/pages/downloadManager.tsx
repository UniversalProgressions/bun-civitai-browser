import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Card,
  Tabs,
  notification,
  Badge,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";
import {
  PauseOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
} from "@ant-design/icons";
import { edenTreaty } from "../utils";

const { Title, Text } = Typography;

// 定义任务状态枚举和颜色映射
const TaskStatusConfig = {
  FAILED: { color: "red", text: "失败", icon: <CloseCircleOutlined /> },
  CREATED: { color: "blue", text: "进行中", icon: <CloudDownloadOutlined /> },
  FINISHED: { color: "green", text: "已完成", icon: <CheckCircleOutlined /> },
  CLEANED: { color: "default", text: "已清理", icon: <CheckCircleOutlined /> },
};

// 定义任务类型接口
interface DownloadTask {
  id: number;
  name?: string;
  url?: string;
  fileType?: string;
  imageType?: string;
  sizeKB?: number;
  gopeedTaskId: string | null;
  gopeedTaskFinished: boolean;
  gopeedTaskDeleted: boolean;
  status: keyof typeof TaskStatusConfig;
  resourceType: "file" | "image";
  modelVersion: {
    id: number;
    name: string;
    model: {
      id: number;
      name: string;
    };
  };
}

interface TaskResponse {
  files: DownloadTask[];
  images: DownloadTask[];
}

interface GopeedTaskStatus {
  id: string;
  status: string;
  progress: number;
  speed: number;
  error: string | null;
  createAt: string;
}

const DownloadManager = () => {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [activeTasks, setActiveTasks] = useState<
    Record<string, GopeedTaskStatus>
  >({});

  // 获取所有任务
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await edenTreaty.gopeed.tasks.get();
      if (error) {
        notification.error({
          message: "获取任务列表失败",
          description: error.value?.message || "未知错误",
        });
        return;
      }

      // Type guard for TaskResponse - check if data has files and images properties
      if (
        !data ||
        typeof data !== "object" ||
        !("files" in data) ||
        !("images" in data)
      ) {
        throw new Error("Invalid response format");
      }
      const response = data as TaskResponse;
      const allTasks = [...response.files, ...response.images];
      setTasks(allTasks);

      // 获取活动任务的详细状态
      const activeTaskIds = allTasks
        .filter((task) => task.gopeedTaskId && !task.gopeedTaskFinished)
        .map((task) => task.gopeedTaskId as string);

      const taskStatuses: Record<string, GopeedTaskStatus> = {};
      for (const taskId of activeTaskIds) {
        try {
          // Use type assertion for dynamic taskId access
          const { data: statusData } = await (edenTreaty.gopeed.tasks as any)[
            taskId
          ].get();
          if (statusData) {
            taskStatuses[taskId] = statusData as GopeedTaskStatus;
          }
        } catch (error) {
          console.error(`Failed to get status for task ${taskId}:`, error);
        }
      }
      setActiveTasks(taskStatuses);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      notification.error({
        message: "获取任务失败",
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载任务
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 设置轮询（每5秒）
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling) {
      interval = setInterval(() => {
        fetchTasks();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, fetchTasks]);

  // 处理任务控制操作
  const handleTaskControl = async (
    action: "pause" | "continue" | "delete",
    taskId: string,
    force?: boolean,
  ) => {
    try {
      // 使用类型断言处理动态路径参数
      const tasksApi = edenTreaty.gopeed.tasks as any;
      switch (action) {
        case "pause":
          await tasksApi[taskId].pause.post();
          notification.success({ message: "任务已暂停" });
          break;
        case "continue":
          await tasksApi[taskId].continue.post();
          notification.success({ message: "任务已继续" });
          break;
        case "delete": {
          const query = force ? { force: "true" } : {};
          await tasksApi[taskId].delete(query);
          notification.success({ message: "任务已删除" });
          break;
        }
      }
      // 操作后刷新任务列表
      setTimeout(() => fetchTasks(), 1000);
    } catch (error) {
      notification.error({
        message: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  // 完成并清理任务
  const handleFinishAndClean = async (
    taskId: string,
    fileId: number,
    isMedia: boolean,
    force?: boolean,
  ) => {
    try {
      // 使用类型断言处理动态路径参数
      const tasksApi = edenTreaty.gopeed.tasks as any;
      await tasksApi[taskId]["finish-and-clean"].post({
        fileId,
        isMedia,
        force,
      });
      notification.success({ message: "任务已完成并清理" });
      setTimeout(() => fetchTasks(), 1000);
    } catch (error) {
      notification.error({
        message: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "任务类型",
      dataIndex: "resourceType",
      key: "resourceType",
      width: 100,
      render: (type: string) => (
        <Tag color={type === "file" ? "blue" : "purple"}>
          {type === "file" ? "文件" : "图片"}
        </Tag>
      ),
    },
    {
      title: "名称",
      key: "name",
      width: 200,
      render: (record: DownloadTask) => (
        <div>
          <div style={{ fontWeight: "bold" }}>
            {record.name || record.url?.split("/").pop() || "未知文件"}
          </div>
          {record.modelVersion && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.modelVersion.model.name} - {record.modelVersion.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "大小",
      dataIndex: "sizeKB",
      key: "sizeKB",
      width: 100,
      render: (size?: number) =>
        size ? `${(size / 1024).toFixed(2)} MB` : "未知",
    },
    {
      title: "状态",
      key: "status",
      width: 150,
      render: (record: DownloadTask) => {
        const statusConfig = TaskStatusConfig[record.status];
        const activeStatus = record.gopeedTaskId
          ? activeTasks[record.gopeedTaskId]
          : null;

        return (
          <div>
            <Tag icon={statusConfig.icon} color={statusConfig.color}>
              {statusConfig.text}
            </Tag>
            {activeStatus && (
              <div style={{ marginTop: 4 }}>
                <Progress
                  percent={activeStatus.progress}
                  size="small"
                  strokeColor={
                    record.status === "CREATED" ? "#1890ff" : undefined
                  }
                />
                {activeStatus.speed > 0 && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {(activeStatus.speed / 1024).toFixed(1)} KB/s
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "任务ID",
      dataIndex: "gopeedTaskId",
      key: "gopeedTaskId",
      width: 120,
      render: (taskId: string | null) =>
        taskId ? (
          <Text code copyable>
            {taskId.slice(0, 8)}...
          </Text>
        ) : (
          "-"
        ),
    },
    {
      title: "操作",
      key: "actions",
      width: 200,
      render: (record: DownloadTask) => {
        const canControl = record.gopeedTaskId && !record.gopeedTaskFinished;
        const isMedia = record.resourceType === "image";

        return (
          <Space size="small">
            {canControl && (
              <>
                <Button
                  size="small"
                  icon={<PauseOutlined />}
                  onClick={() =>
                    handleTaskControl("pause", record.gopeedTaskId!)
                  }
                  disabled={record.status !== "CREATED"}
                >
                  暂停
                </Button>
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() =>
                    handleTaskControl("continue", record.gopeedTaskId!)
                  }
                  disabled={record.status !== "CREATED"}
                >
                  继续
                </Button>
              </>
            )}
            {record.gopeedTaskId && (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  handleTaskControl("delete", record.gopeedTaskId!)
                }
              >
                删除
              </Button>
            )}
            {record.gopeedTaskFinished && !record.gopeedTaskDeleted && (
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  handleFinishAndClean(record.gopeedTaskId!, record.id, isMedia)
                }
              >
                清理
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // 计算统计信息
  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === "CREATED").length,
    finished: tasks.filter((t) => t.status === "FINISHED").length,
    failed: tasks.filter((t) => t.status === "FAILED").length,
    cleaned: tasks.filter((t) => t.status === "CLEANED").length,
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>下载管理器</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <StatCard
              title="总任务数"
              value={stats.total}
              icon={<CloudDownloadOutlined />}
              color="#1890ff"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <StatCard
              title="进行中"
              value={stats.active}
              icon={<ClockCircleOutlined />}
              color="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <StatCard
              title="已完成"
              value={stats.finished}
              icon={<CheckCircleOutlined />}
              color="#722ed1"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <StatCard
              title="失败"
              value={stats.failed}
              icon={<CloseCircleOutlined />}
              color="#f5222d"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <span>下载任务列表</span>
            <Badge count={stats.active} showZero />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={polling} />}
              onClick={() => setPolling(!polling)}
              type={polling ? "primary" : "default"}
            >
              {polling ? "停止轮询" : "开始轮询"}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTasks}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: "all",
              label: `全部 (${stats.total})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={tasks}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                />
              ),
            },
            {
              key: "active",
              label: `进行中 (${stats.active})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={tasks.filter((t) => t.status === "CREATED")}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                />
              ),
            },
            {
              key: "finished",
              label: `已完成 (${stats.finished})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={tasks.filter((t) => t.status === "FINISHED")}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                />
              ),
            },
            {
              key: "failed",
              label: `失败 (${stats.failed})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={tasks.filter((t) => t.status === "FAILED")}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Divider />

      <Card title="使用说明" size="small">
        <ul>
          <li>
            状态说明：
            <Tag color="blue">进行中</Tag> - 下载任务正在运行
            <Tag color="green">已完成</Tag> - 文件已下载完成
            <Tag color="red">失败</Tag> - 下载任务失败
            <Tag color="default">已清理</Tag> - Gopeed任务已被清理
          </li>
          <li>
            操作说明：
            <Button size="small" icon={<PauseOutlined />} disabled>
              暂停
            </Button>{" "}
            - 暂停下载任务
            <Button size="small" icon={<PlayCircleOutlined />} disabled>
              继续
            </Button>{" "}
            - 继续已暂停的任务
            <Button size="small" danger icon={<DeleteOutlined />} disabled>
              删除
            </Button>{" "}
            - 删除Gopeed下载任务
            <Button size="small" type="primary" disabled>
              清理
            </Button>{" "}
            - 标记已完成的任务为已清理状态
          </li>
          <li>轮询功能：开启后每5秒自动刷新任务状态</li>
        </ul>
      </Card>
    </div>
  );
};

// 统计卡片组件
const StatCard = ({ title, value, icon, color }: any) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    <div style={{ marginRight: 16, fontSize: 24, color }}>{icon}</div>
    <div>
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: "bold" }}>{value}</div>
    </div>
  </div>
);

export default DownloadManager;
