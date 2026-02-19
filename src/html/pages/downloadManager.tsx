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

// Define task status enum and color mapping
const TaskStatusConfig = {
	FAILED: { color: "red", text: "Failed", icon: <CloseCircleOutlined /> },
	CREATED: {
		color: "blue",
		text: "In Progress",
		icon: <CloudDownloadOutlined />,
	},
	FINISHED: {
		color: "green",
		text: "Completed",
		icon: <CheckCircleOutlined />,
	},
	CLEANED: { color: "default", text: "Cleaned", icon: <CheckCircleOutlined /> },
};

// Define task type interface
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

	// Get all tasks
	const fetchTasks = useCallback(async () => {
		setLoading(true);
		try {
			const { data, error } = await edenTreaty.gopeed.tasks.get();
			if (error) {
				notification.error({
					message: "Failed to fetch task list",
					description: error.value?.message || "Unknown error",
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

			// Get detailed status for active tasks
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
				message: "Failed to fetch tasks",
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	// Initialize loading tasks
	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	// Setup polling (every 5 seconds)
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

	// Handle task control operations
	const handleTaskControl = async (
		action: "pause" | "continue" | "delete",
		taskId: string,
		force?: boolean,
	) => {
		try {
			// Use type assertion for dynamic path parameters
			const tasksApi = edenTreaty.gopeed.tasks as any;
			switch (action) {
				case "pause":
					await tasksApi[taskId].pause.post();
					notification.success({ message: "Task paused" });
					break;
				case "continue":
					await tasksApi[taskId].continue.post();
					notification.success({ message: "Task continued" });
					break;
				case "delete": {
					const query = force ? { force: "true" } : {};
					await tasksApi[taskId].delete(query);
					notification.success({ message: "Task deleted" });
					break;
				}
			}
			// Refresh task list after operation
			setTimeout(() => fetchTasks(), 1000);
		} catch (error) {
			notification.error({
				message: "Operation failed",
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// Finish and clean task
	const handleFinishAndClean = async (
		taskId: string,
		fileId: number,
		isMedia: boolean,
		force?: boolean,
	) => {
		try {
			// Use type assertion for dynamic path parameters
			const tasksApi = edenTreaty.gopeed.tasks as any;
			await tasksApi[taskId]["finish-and-clean"].post({
				fileId,
				isMedia,
				force,
			});
			notification.success({ message: "Task completed and cleaned" });
			setTimeout(() => fetchTasks(), 1000);
		} catch (error) {
			notification.error({
				message: "Operation failed",
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// Table column definitions
	const columns = [
		{
			title: "Task Type",
			dataIndex: "resourceType",
			key: "resourceType",
			width: 100,
			render: (type: string) => (
				<Tag color={type === "file" ? "blue" : "purple"}>
					{type === "file" ? "File" : "Image"}
				</Tag>
			),
		},
		{
			title: "Name",
			key: "name",
			width: 200,
			render: (record: DownloadTask) => (
				<div>
					<div style={{ fontWeight: "bold" }}>
						{record.name || record.url?.split("/").pop() || "Unknown file"}
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
			title: "Size",
			dataIndex: "sizeKB",
			key: "sizeKB",
			width: 100,
			render: (size?: number) =>
				size ? `${(size / 1024).toFixed(2)} MB` : "Unknown",
		},
		{
			title: "Status",
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
			title: "Task ID",
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
			title: "Actions",
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
									Pause
								</Button>
								<Button
									size="small"
									icon={<PlayCircleOutlined />}
									onClick={() =>
										handleTaskControl("continue", record.gopeedTaskId!)
									}
									disabled={record.status !== "CREATED"}
								>
									Continue
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
								Delete
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
								Clean
							</Button>
						)}
					</Space>
				);
			},
		},
	];

	// Calculate statistics
	const stats = {
		total: tasks.length,
		active: tasks.filter((t) => t.status === "CREATED").length,
		finished: tasks.filter((t) => t.status === "FINISHED").length,
		failed: tasks.filter((t) => t.status === "FAILED").length,
		cleaned: tasks.filter((t) => t.status === "CLEANED").length,
	};

	return (
		<div style={{ padding: 24 }}>
			<Title level={2}>Download Manager</Title>

			<Row gutter={16} style={{ marginBottom: 24 }}>
				<Col span={6}>
					<Card size="small">
						<StatCard
							title="Total Tasks"
							value={stats.total}
							icon={<CloudDownloadOutlined />}
							color="#1890ff"
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card size="small">
						<StatCard
							title="In Progress"
							value={stats.active}
							icon={<ClockCircleOutlined />}
							color="#52c41a"
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card size="small">
						<StatCard
							title="Completed"
							value={stats.finished}
							icon={<CheckCircleOutlined />}
							color="#722ed1"
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card size="small">
						<StatCard
							title="Failed"
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
						<span>Download Task List</span>
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
							{polling ? "Stop Polling" : "Start Polling"}
						</Button>
						<Button
							icon={<ReloadOutlined />}
							onClick={fetchTasks}
							loading={loading}
						>
							Refresh
						</Button>
					</Space>
				}
			>
				<Tabs
					defaultActiveKey="all"
					items={[
						{
							key: "all",
							label: `All (${stats.total})`,
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
							label: `In Progress (${stats.active})`,
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
							label: `Completed (${stats.finished})`,
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
							label: `Failed (${stats.failed})`,
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

			<Card title="Usage Instructions" size="small">
				<ul>
					<li>
						Status descriptions:
						<Tag color="blue">In Progress</Tag> - Download task is running
						<Tag color="green">Completed</Tag> - File has been downloaded
						<Tag color="red">Failed</Tag> - Download task failed
						<Tag color="default">Cleaned</Tag> - Gopeed task has been cleaned
					</li>
					<li>
						Operation descriptions:
						<Button size="small" icon={<PauseOutlined />} disabled>
							Pause
						</Button>{" "}
						- Pause download task
						<Button size="small" icon={<PlayCircleOutlined />} disabled>
							Continue
						</Button>{" "}
						- Continue paused task
						<Button size="small" danger icon={<DeleteOutlined />} disabled>
							Delete
						</Button>{" "}
						- Delete Gopeed download task
						<Button size="small" type="primary" disabled>
							Clean
						</Button>{" "}
						- Mark completed task as cleaned
					</li>
					<li>
						Polling feature: Automatically refreshes task status every 5 seconds
						when enabled
					</li>
				</ul>
			</Card>
		</div>
	);
};

// Statistics card component
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
