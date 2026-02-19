import { Alert, Input, Select, type SelectProps, Space } from "antd";
import { useAtom } from "jotai";
import { debounce } from "es-toolkit";
import { edenTreaty } from "../../../utils";
import type { Model } from "#civitai-api/v1/models";
import {
  activeVersionIdAtom,
  existedModelVersionsAtom,
  inputValueAtom,
  loadingAtom,
  LoadingOptionsEnum,
  modelContentAtom,
  selectedOptionAtom,
} from "../atoms";

interface InputBarProps {
  onModelLoad?: (data: Model) => void;
  onError?: (error: unknown) => void;
}

function InputBar({ onModelLoad, onError }: InputBarProps) {
  const [selectedOption, setSelectedOption] = useAtom(selectedOptionAtom);
  const [_activeVersionId, setActiveVersionId] = useAtom(activeVersionIdAtom);
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [_loading, setLoading] = useAtom(loadingAtom);
  const [_modelContent, setModelContent] = useAtom(modelContentAtom);
  const [_existedModelVersions, _setExistedModelVersions] = useAtom(
    existedModelVersionsAtom,
  );

  const handleApiError = (error: unknown) => {
    // Type guard to check if error has status property
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: unknown }).status === 422
    ) {
      const err = error as { value?: { message?: string; summary?: string } };
      setModelContent(
        <Alert
          type="error"
          title={err.value?.message || "Validation Error"}
          description={err.value?.summary || "Invalid input"}
        />,
      );
    } else {
      setModelContent(
        <Alert
          type="error"
          title="API Error"
          description={error instanceof Error ? error.message : String(error)}
        />,
      );
    }

    // Call external error handler if provided
    onError?.(error);
    throw error;
  };

  const handleApiSuccess = (data: Model) => {
    setModelContent(null); // Will be set by parent component
    setActiveVersionId(data.modelVersions[0].id.toString());
    onModelLoad?.(data);
  };

  async function loadModelInfo() {
    // Validate input
    const parsedId = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsedId) && selectedOption !== LoadingOptionsEnum.Url) {
      setModelContent(
        <Alert
          type="error"
          title="Invalid input"
          description="Please enter a valid number"
        />,
      );
      return;
    }

    setLoading(true);
    try {
      switch (selectedOption) {
        case LoadingOptionsEnum.VersionId: {
          const { data, error } = await edenTreaty.civitai_api.v1.download[
            "get-info"
          ]["by-version-id"].post({ id: parsedId });
          if (error) {
            handleApiError(error);
          } else {
            handleApiSuccess(data);
          }
          break;
        }
        case LoadingOptionsEnum.ModelId: {
          const { data, error } = await edenTreaty.civitai_api.v1.download[
            "get-info"
          ]["by-id"].post({ id: parsedId });
          if (error) {
            handleApiError(error);
          } else {
            handleApiSuccess(data);
          }
          break;
        }
        case LoadingOptionsEnum.Url: {
          setModelContent(
            <Alert
              type="warning"
              title="URL option not yet implemented"
              description="This feature is coming soon"
            />,
          );
          break;
        }
        default:
          setModelContent(
            <Alert
              type="error"
              title="Invalid option"
              description={`Unknown option: ${selectedOption}`}
            />,
          );
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  const debounceLoadModelInfo = debounce(loadModelInfo, 500);

  const loadingOptions: SelectProps["options"] = [
    {
      value: LoadingOptionsEnum.VersionId,
      label: LoadingOptionsEnum.VersionId,
    },
    {
      value: LoadingOptionsEnum.ModelId,
      label: LoadingOptionsEnum.ModelId,
    },
    {
      value: LoadingOptionsEnum.Url,
      label: LoadingOptionsEnum.Url,
    },
  ];

  return (
    <Space.Compact>
      <Select
        defaultValue={LoadingOptionsEnum.VersionId}
        options={loadingOptions}
        onChange={(value) => setSelectedOption(value as LoadingOptionsEnum)}
      />
      <Input
        defaultValue={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Please input corresponding value according to the option on the left."
        onPressEnter={debounceLoadModelInfo}
      />
    </Space.Compact>
  );
}

export default InputBar;
