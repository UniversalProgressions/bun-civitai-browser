import {
	extractFilenameFromUrl,
	getFileType,
} from "../../../../civitai-api/v1/utils";
import type { ModelWithAllRelations } from "../../../../modules/db/crud/model";

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
