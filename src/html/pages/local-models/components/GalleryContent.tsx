import { Masonry } from "antd";
import type { ModelVersion } from "../../../../civitai-api/v1/models/models";
import type { ModelWithAllRelations } from "../../../../modules/db/crud/model";
import { ModelCard } from "./ModelCard";

interface GalleryContentProps {
	models: Array<ModelWithAllRelations>;
	ModelCardContentLeftSide: ({
		modelVersion,
	}: {
		modelVersion: ModelVersion;
	}) => React.JSX.Element;
}

export function GalleryContent({
	models,
	ModelCardContentLeftSide,
}: GalleryContentProps) {
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
