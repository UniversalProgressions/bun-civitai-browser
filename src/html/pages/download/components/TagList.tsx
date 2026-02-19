import { Button, Flex, notification } from "antd";
import clipboard from "clipboardy";

interface TagListProps {
  trainedWords?: string[];
}

function TagList({ trainedWords }: TagListProps) {
  if (!trainedWords || trainedWords.length === 0) {
    return undefined;
  }

  const handleCopyTag = async (tagStr: string) => {
    await clipboard.write(tagStr);
    notification.success({
      title: "Copied to clipboard",
    });
  };

  return (
    <Flex wrap gap="small">
      {trainedWords.map((tagStr) => (
        <Button
          key={tagStr}
          onClick={async () => handleCopyTag(tagStr)}
          className="
          bg-blue-500 hover:bg-blue-700 text-white 
            font-bold p-1 rounded transition-all 
            duration-300 transform hover:scale-105
            hover:cursor-pointer"
          size="small"
          type="text"
        >
          {tagStr}
        </Button>
      ))}
    </Flex>
  );
}

export default TagList;
