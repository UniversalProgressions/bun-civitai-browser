import {
  getFileType,
  extractFilenameFromUrl,
  replaceUrlParam,
} from "../../../../civitai-api/v1/utils.js";

function MediaPreview({ url }: { url: string }) {
  const filenameResult = extractFilenameFromUrl(url);
  const fileType = getFileType(
    filenameResult.isOk() ? filenameResult.value : "",
  );
  if (fileType === "video") {
    return <video src={url} autoPlay loop muted></video>;
  } else if (fileType === "image") {
    // Use smaller preview image by replacing original=true with original=false
    // https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/833e5617-47d4-44d8-82c7-d169dc2908eb/original=true/93876235.jpeg
    // to
    // https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/833e5617-47d4-44d8-82c7-d169dc2908eb/original=false/93876235.jpeg
    return <img src={replaceUrlParam(url)} alt="Model preview" />;
  } else {
    return (
      <img
        alt={`unknown file type: ${filenameResult.isOk() ? filenameResult.value : "unknown"}`}
      />
    );
  }
}

export { MediaPreview };
