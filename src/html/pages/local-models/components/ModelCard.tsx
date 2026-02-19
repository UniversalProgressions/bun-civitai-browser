import { Card, Modal } from "antd";
import { useState } from "react";
import type { ModelTypes } from "../../../../civitai-api/v1/models/base-models/misc";
import type {
	Model,
	ModelVersion,
} from "../../../../civitai-api/v1/models/models";
import type { ModelWithAllRelations } from "../../../../modules/db/crud/model";
import { getPreviewMediaFile, MediaPreview } from "./MediaPreview";
import { ModelCardContent } from "./ModelCardContent";

interface ModelCardProps {
	item: ModelWithAllRelations;
	ModelCardContentLeftSide: ({
		modelVersion,
	}: {
		modelVersion: ModelVersion;
	}) => React.JSX.Element;
}

export function ModelCard({ item, ModelCardContentLeftSide }: ModelCardProps) {
	const [modelData, setModelData] = useState<Model | null>(null);
	const [_isError, _setIsError] = useState(false);
	const [_errorDescription, _setErrorDescription] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);

	async function openModelCard(dbModel: ModelWithAllRelations) {
		// TODO: Uncomment when the endpoint is available
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

		// Temporary: Simulate data
		setIsModalOpen(true);
		// Set placeholder model data
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
