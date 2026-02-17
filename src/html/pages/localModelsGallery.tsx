import { SearchOutlined } from "@ant-design/icons";
import {
	Affix,
	Button,
	Card,
	Col,
	Descriptions,
	type DescriptionsProps,
	Flex,
	FloatButton,
	Form,
	Input,
	Masonry,
	Modal,
	notification,
	Pagination,
	type PaginationProps,
	Row,
	Select,
	Space,
	Tabs,
} from "antd";
import type { DefaultOptionType } from "antd/es/select";
import clipboard from "clipboardy";
import DOMPurify from "dompurify";
import { debounce } from "es-toolkit";
import { atom, type PrimitiveAtom, useAtom } from "jotai";
import type React from "react";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import {
	BaseModelsArray,
	CheckpointTypeArray,
	ModelsRequestPeriodArray,
	ModelsRequestSortArray,
	type ModelTypes,
	ModelTypesArray,
} from "../../civitai-api/v1/models/base-models/misc";
import type {
	Model,
	ModelsRequestOptions,
	ModelVersion,
} from "../../civitai-api/v1/models/models";
import {
	extractFilenameFromUrl,
	getFileType,
} from "../../civitai-api/v1/utils";
import type { ModelWithAllRelations } from "../../modules/db/crud/model";
import MediaGallery from "../components/gallery";
import ShadowHTML from "../components/shadowHTML";
import { edenTreaty } from "../utils";

const isGalleryLoadingAtom = atom(false);
const modelsAtom = atom<Array<ModelWithAllRelations>>([]);
const localSearchOptionsAtom = atom<ModelsRequestOptions>({});

const totalAtom = atom(0);

export function MediaPreview({ fileName }: { fileName: string }) {
	const fileType = getFileType(fileName);
	const srcPath = `${location.origin}/civitai/local/media/preview?previewFile=${fileName}`;
	if (fileType === "video") {
		return <video src={srcPath} autoPlay loop muted></video>;
	} else if (fileType === "image") {
		return <img src={srcPath} alt={`Preview image: ${fileName}`} />;
	} else {
		return <img alt={`unknown file type: ${fileName}`} />;
	}
}

/**
 * Get the preview media file from a model with all relations
 * Selects the media file with the highest ID from all model versions
 */
export function getPreviewMediaFile(
	model: ModelWithAllRelations,
): string | null {
	let maxId = -1;
	let previewFilename: string | null = null;

	// Iterate through all model versions
	for (const version of model.modelVersions) {
		// Check if version has images in json field
		const versionJson = version.json as { images?: Array<{ url: string }> };
		if (versionJson?.images && Array.isArray(versionJson.images)) {
			for (const image of versionJson.images) {
				// Extract filename from URL
				const filenameResult = extractFilenameFromUrl(image.url);
				if (filenameResult.isOk()) {
					const filename = filenameResult.value;
					// Extract ID from filename (remove extension)
					const dotIndex = filename.lastIndexOf(".");
					const idStr =
						dotIndex > -1 ? filename.substring(0, dotIndex) : filename;
					const id = parseInt(idStr, 10);

					if (!Number.isNaN(id) && id > maxId) {
						maxId = id;
						previewFilename = filename;
					}
				}
			}
		}
	}

	return previewFilename;
}

export function ModelCardContent({
	data,
	ModelCardContentLeftSide,
}: {
	data: Model;
	ModelCardContentLeftSide: ({
		modelVersion,
	}: {
		modelVersion: ModelVersion;
	}) => React.JSX.Element;
}) {
	return (
		<Tabs
			defaultActiveKey="1"
			tabPlacement="top"
			// onChange={(id) => id}
			items={data?.modelVersions.map((v) => {
				const leftSide = (
					<ModelCardContentLeftSide key={v.id} modelVersion={v} />
				);
				const descriptionItems: DescriptionsProps["items"] = [
					{
						key: v.id,
						label: "Version ID",
						children: v.id,
					},
					{
						key: v.baseModel,
						label: "Base Model",
						children: v.baseModel,
					},
					{
						key: 3,
						label: "Model Type",
						children: data.type,
					},
					{
						key: 4,
						label: "Publish Date",
						span: "filled",
						children: v.publishedAt?.toString() ?? "Null",
					},

					{
						key: 7,
						label: `Model Files`,
						span: `filled`,
						children:
							v.files.length > 0
								? v.files.map((file) => (
										<Row key={file.id}>
											<Col span={18}>{file.name}</Col>
											<Col span={6}>
												<Button
													onClick={async () => {
														// const loraString = `<lora:${
														//   modelVersion.files[index].id
														// }_${
														//   removeFileExtension(
														//     modelVersion.files[index].name,
														//   )
														// }:1>`;
														await clipboard.write(file.name);
														notification.success({
															title: `${file.name} copied to clipboard`,
														});
													}}
												>
													Copy Filename
												</Button>
											</Col>
										</Row>
									))
								: `have no files`,
					},
					{
						key: 8,
						label: "Tags",
						span: "filled",
						children: v.trainedWords ? (
							<Flex wrap gap="small">
								{v.trainedWords.map((tagStr) => (
									<button
										key={tagStr}
										type="button"
										onClick={async () => {
											await clipboard.write(tagStr);
											return notification.success({
												title: "Copied to clipboard",
											});
										}}
										className="
                        bg-blue-500 hover:bg-blue-700 text-white 
                          font-bold p-1 rounded transition-all 
                          duration-300 transform hover:scale-105
                          hover:cursor-pointer"
									>
										{tagStr}
									</button>
								))}
							</Flex>
						) : undefined,
					},
					{
						key: 9,
						label: "Model Description",
						span: "filled",
						children: data.description ? (
							<ShadowHTML html={DOMPurify.sanitize(data.description)} />
						) : undefined,
					},
					{
						key: 10,
						label: "Model Version Description",
						span: "filled",
						children: v.description ? (
							<ShadowHTML html={DOMPurify.sanitize(v.description)} />
						) : undefined,
					},
				];
				const rightSide = (
					<>
						<Space orientation="vertical">
							<Descriptions
								title="Model Version Details"
								layout="vertical"
								items={descriptionItems}
							></Descriptions>
						</Space>
					</>
				);
				return {
					label: v.name,
					key: v.id.toString(),
					children: (
						<Card>
							<div>
								<a
									className="clickable-title"
									target="_blank"
									href={`https://civitai.com/models/${data.id}?modelVersionId=${v.id}`}
								>
									{data.name}
								</a>
							</div>
							<Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
								<Col sm={8} lg={6}>
									{leftSide}
								</Col>
								<Col sm={16} lg={18}>
									{rightSide}
								</Col>
							</Row>
						</Card>
					),
				};
			})}
		/>
	);
}

export function ModelCard({
	item,
	ModelCardContentLeftSide,
}: {
	item: ModelWithAllRelations;
	ModelCardContentLeftSide: ({
		modelVersion,
	}: {
		modelVersion: ModelVersion;
	}) => React.JSX.Element;
}) {
	const [modelData, setModelData] = useState<Model | null>(null);
	const [_isError, _setIsError] = useState(false);
	const [_errorDescription, _setErrorDescription] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	async function openModelCard(dbModel: ModelWithAllRelations) {
		// 暂时注释掉不存在的端点调用
		// const { data, error, headers, response, status } = await edenTreaty[
		//   "local-models"
		// ].models.modelId.post({
		//   modelId: dbModel.id,
		//   modelVersionIdNumbers: dbModel.modelVersions.map((v) => v.id),
		//   type: dbModel.type.name as ModelTypes,
		// });
		// if (error?.status) {
		//   switch (error.status) {
		//     case 422:
		//       setErrorDescription(JSON.stringify(error.value, null, 2));
		//       break;
		//     default:
		//       setErrorDescription(String(error));
		//   }
		// } else {
		//   setModelData(data!);
		//   setIsModalOpen(true);
		// }

		// 临时：模拟数据
		setIsModalOpen(true);
		// 设置一个空的模型数据占位
		setModelData({
			id: dbModel.id,
			name: dbModel.name,
			type: dbModel.type.name as ModelTypes,
			nsfw: false,
			tags: [],
			modelVersions: [],
			creator: {
				username: "unknown",
				image: null,
			},
			stats: {
				downloadCount: 0,
				favoriteCount: 0,
				commentCount: 0,
				ratingCount: 0,
				rating: 0,
			},
			mode: "Archived",
		} as unknown as Model);
	}

	const previewFile = getPreviewMediaFile(item);

	return (
		<>
			<Card
				onClick={() => openModelCard(item)}
				hoverable
				cover={
					previewFile ? (
						<MediaPreview fileName={previewFile} />
					) : (
						<img alt="Have no preview" />
					)
				}
			>
				<Card.Meta description={item.name} />
			</Card>
			<Modal
				width={1000}
				onOk={() => setIsModalOpen(false)}
				onCancel={() => setIsModalOpen(false)}
				closable={false}
				open={isModalOpen}
				footer={null}
				centered
				destroyOnHidden={true} // force refetch data by force destory DOM
			>
				{isModalOpen && modelData ? (
					<ModelCardContent
						data={modelData}
						ModelCardContentLeftSide={ModelCardContentLeftSide}
					/>
				) : (
					<div>loading...</div>
				)}
			</Modal>
		</>
	);
}

export function GalleryContent({
	models,
	ModelCardContentLeftSide,
}: {
	models: Array<ModelWithAllRelations>;
	ModelCardContentLeftSide: ({
		modelVersion,
	}: {
		modelVersion: ModelVersion;
	}) => React.JSX.Element;
}) {
	return (
		<Masonry
			className="w-full"
			columns={{
				xs: 1,
				sm: 2,
				md: 4,
				lg: 4,
				xl: 6,
				xxl: 8,
			}}
			gutter={{ xs: 8, sm: 12, md: 16 }}
			items={models.map((item, index) => ({
				key: `item-${index}`,
				data: item,
				index,
			}))}
			itemRender={(item) => (
				<ModelCard
					key={item.key}
					item={item.data}
					ModelCardContentLeftSide={ModelCardContentLeftSide}
				/>
			)}
		/>
	);
}

export function SearchPanel({
	setIsModalOpen,
	searchOptsAtom,
}: {
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	searchOptsAtom: PrimitiveAtom<ModelsRequestOptions>;
}) {
	const [searchOpt, setSearchOpt] = useAtom(searchOptsAtom);
	const [form] = Form.useForm<ModelsRequestOptions>();
	const [tagsOptions, setTagsOptions] = useState<Array<DefaultOptionType>>([]);

	async function asyncSearchTags(keyword: string) {
		function toOptionsArray(params: Array<string>): Array<DefaultOptionType> {
			return params.map((tag) => ({
				label: tag,
				value: tag,
			}));
		}
		const response = await edenTreaty.db.tags.get({
			query: { tagKeyword: keyword },
		});
		switch (response.status) {
			case 200:
				if (response.data) {
					setTagsOptions(toOptionsArray(response.data));
				} else {
					setTagsOptions([]);
				}
				break;
			case 422:
				notification.error({ title: "Invalide HTTP QueryString" });
				setTagsOptions([]);
				break;
			default:
				notification.error({ title: "Failed to fetch tags" });
				setTagsOptions([]);
				break;
		}
	}
	const debouncedSearchTags = debounce(asyncSearchTags, 600);
	useEffect(() => {
		form.setFieldsValue(searchOpt);
	});
	return (
		<Form
			layout="horizontal"
			form={form}
			onSubmitCapture={() => {
				setSearchOpt(form.getFieldsValue());
				setIsModalOpen(false);
			}}
		>
			<Form.Item name="query" label="Query Text">
				<Input
					placeholder="input search text"
					value={form.getFieldValue("query")}
					onChange={(e) => {
						form.setFieldValue("query", e.target.value);
					}}
				/>
			</Form.Item>
			<Form.Item name="username" label="Username">
				<Input
					placeholder="input username"
					value={form.getFieldValue("username")}
					onChange={(e) => {
						form.setFieldValue("username", e.target.value);
					}}
				/>
			</Form.Item>
			<Form.Item name="baseModels" label="Base Model Select">
				<Select
					mode="multiple"
					options={BaseModelsArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Base model"
					value={searchOpt.baseModels}
					onChange={(value) => {
						form.setFieldValue("baseModels", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="types" label="Model Type">
				<Select
					mode="multiple"
					options={ModelTypesArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Model Type"
					value={form.getFieldValue("types")}
					onChange={(value) => {
						form.setFieldValue("types", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="checkpointType" label="Checkpoint Type">
				<Select
					options={CheckpointTypeArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Checkpoint Type"
					value={form.getFieldValue("checkpointType")}
					onChange={(value) => {
						form.setFieldValue("checkpointType", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="period" label="Period">
				<Select
					options={ModelsRequestPeriodArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Period"
					value={form.getFieldValue("period")}
					onChange={(value) => {
						form.setFieldValue("period", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="sort" label="Sort">
				<Select
					options={ModelsRequestSortArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Sort"
					value={form.getFieldValue("sort")}
					onChange={(value) => {
						form.setFieldValue("sort", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="tag" label="Tags">
				<Select
					mode="multiple"
					placeholder="Tags"
					value={form.getFieldValue("tag")}
					onChange={(value) => {
						form.setFieldValue("tag", value);
					}}
					showSearch={{
						onSearch: (value) => debouncedSearchTags(value),
						autoClearSearchValue: false,
					}}
					options={tagsOptions}
				/>
			</Form.Item>
			<Form.Item>
				<Space>
					<Button type="primary" htmlType="submit">
						Search
					</Button>
					<Button onClick={() => setSearchOpt({})}>Reset</Button>
				</Space>
			</Form.Item>
		</Form>
	);
}

function LocalModelCardContentLeftSide({
	modelVersion,
}: {
	modelVersion: ModelVersion;
}) {
	const images = modelVersion.images || [];
	return (
		<div>
			{images[0]?.url ? (
				<MediaGallery
					items={images.map((i) => {
						const url = `${location.origin}/civitai/local/media/preview?previewFile=${extractFilenameFromUrl(i.url)}`;
						const filenameResult = extractFilenameFromUrl(i.url);
						const id = filenameResult.isOk()
							? parseInt(filenameResult.value.split(".")[0], 10) || 0
							: 0;
						return {
							id,
							url,
							nsfwLevel: i.nsfwLevel,
							width: i.width,
							height: i.height,
							hash: i.hash,
							type: i.type,
						};
					})}
				/>
			) : (
				<img title="Have no preview" alt="No preview available" />
			)}
		</div>
	);
}

function LocalPagination() {
	const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
	const [total, _setTotal] = useAtom(totalAtom);
	const onChange: PaginationProps["onChange"] = (page, pageSize) => {
		setSearchOpt((prev) => ({ ...prev, page, limit: pageSize }));
	};
	return (
		<Pagination
			pageSize={searchOpt.limit ?? 20}
			current={searchOpt.page ?? 1}
			total={total}
			onChange={onChange}
			showSizeChanger
			showQuickJumper
			showTotal={(total) => `Total ${total} items`}
		/>
	);
}

function LocalFloatingButtons() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<>
			<FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
				<FloatButton
					icon={<SearchOutlined />}
					onClick={() => {
						setIsModalOpen(true);
					}}
				/>
				{/* 暂时注释掉不存在的端点调用 */}
				{/* <FloatButton
          icon={<SyncOutlined />}
          onClick={async () => {
            notification.info({ title: "Scaning..." });
            await edenTreaty["local-models"].scanModels.head();
            notification.success({ title: "Finished~" });
          }}
        /> */}
				<FloatButton.BackTop visibilityHeight={0} />
			</FloatButton.Group>
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
		</>
	);
}

function LocalModelsGallery() {
	const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
	const [models, setModels] = useAtom(modelsAtom);
	const [searchOpt, _setSearchOpt] = useAtom(localSearchOptionsAtom);
	const [_totalCount, setTotalCount] = useAtom(totalAtom);

	const fetchModels = useCallback(
		async (_opts: ModelsRequestOptions) => {
			setIsGalleryLoading(true);
			try {
				// 暂时注释掉不存在的端点调用，使用占位数据
				// const { data, error, headers, response, status } =
				//   await edenTreaty["local-models"].models.pagination.post(opts);
				// if (error) {
				//   throw error;
				// } else {
				//   setModels(data.records);
				//   setTotalCount(data.totalCount ?? 0);
				// }
				// 临时：返回空数据
				setModels([]);
				setTotalCount(0);
			} finally {
				setIsGalleryLoading(false);
			}
		},
		[setIsGalleryLoading, setModels, setTotalCount],
	);

	useEffect(() => {
		fetchModels(searchOpt);
	}, [fetchModels, searchOpt]);

	return (
		<>
			{isGalleryLoading ? (
				<div>Loading...</div>
			) : (
				<GalleryContent
					models={models}
					ModelCardContentLeftSide={LocalModelCardContentLeftSide}
				/>
			)}
			<Space orientation="vertical" align="center" className="w-full">
				<Affix offsetBottom={5}>
					<LocalPagination />
				</Affix>
				<LocalFloatingButtons />
			</Space>
		</>
	);
}

export default LocalModelsGallery;
