import type { ModelVersion } from "../../../../civitai-api/v1/models/models";
import { extractFilenameFromUrl } from "../../../../civitai-api/v1/utils";
import MediaGallery from "../../../components/gallery";

interface LocalModelCardContentLeftSideProps {
	modelVersion: ModelVersion;
}

export function LocalModelCardContentLeftSide({
	modelVersion,
}: LocalModelCardContentLeftSideProps) {
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
