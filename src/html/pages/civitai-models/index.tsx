import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { notification, Result, Space, Button, Typography } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { edenTreaty } from "../../utils";

import {
  nonEffectiveSearchOptsAtom,
  searchOptsAtom,
  isGalleryLoadingAtom,
  modelsAtom,
  modelsOnPageAtom,
  nextPageUrlAtom,
  defaultPageAndSize,
} from "./atoms";
import { GalleryContent } from "./components";
import type { ModelsRequestOptions } from "../../../civitai-api/v1/models/index";

const { Paragraph, Text } = Typography;

function CivitaiModelsGallery() {
  const [isGalleryLoading, setIsGalleryLoading] = useAtom(isGalleryLoadingAtom);
  const [searchOptions] = useAtom(searchOptsAtom);
  const [nonEffectiveSearchOpts] = useAtom(nonEffectiveSearchOptsAtom);
  const [, setModels] = useAtom(modelsAtom);
  const [, setModelsOnPage] = useAtom(modelsOnPageAtom);
  const [, setNextPageUrl] = useAtom(nextPageUrlAtom);
  const [isError, setIsError] = useState(false);
  const [errorContent, setErrorContent] = useState(<></>);

  // Track previous limit to detect changes
  const prevLimitRef = useRef<number>(defaultPageAndSize.limit);
  // Track initial mount to ensure first load
  const isInitialMountRef = useRef(true);

  // Helper function to load next page with a specific URL (used for auto-loading)
  async function loadNextPageWithUrl(url: string) {
    if (!url) {
      return; // No URL, just return silently
    }

    try {
      const { data, error } = await edenTreaty.civitai_api.v1.models[
        "next-page"
      ].post({
        nextPage: url,
      });
      if (error) {
        throw error;
      } else {
        // Add new models to the existing list
        setModels((state) => {
          const newModels = [...state, ...data.items];
          return newModels;
        });

        // Update next page URL if available
        if (data.metadata.nextPage) {
          setNextPageUrl(data.metadata.nextPage);
        } else {
          // No more pages available
          setNextPageUrl("");
        }
      }
    } catch (error) {
      console.error("Error fetching next page:", error);
      // Don't show error notification for auto-load, it's not user-initiated
    }
  }

  async function fetchModels(searchOptions: ModelsRequestOptions) {
    setIsGalleryLoading(true);
    try {
      const { data, error } =
        await edenTreaty.civitai_api.v1.models.post(searchOptions);
      if (error) {
        setIsError(true);
        // need to write a more reliable error handling logic
        switch (error.status) {
          case 422:
            console.error(error.value.summary);
            notification.error({
              title: "Data Validation Error",
              description: error.value.message,
            });
            setErrorContent(
              <Space orientation="vertical" align="center">
                <Result
                  status="error"
                  title="Validation Error"
                  subTitle={error.value.message}
                  extra={[
                    <Button type="primary" key="refresh page">
                      Refresh Page
                    </Button>,
                  ]}
                >
                  <div className="desc">
                    <Paragraph>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                        }}
                      >
                        Validation summary:
                      </Text>
                    </Paragraph>
                    <Paragraph>
                      <CloseCircleOutlined />
                      {error.value.summary}
                    </Paragraph>
                    <Paragraph>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                        }}
                      >
                        Raw data
                      </Text>
                    </Paragraph>
                    <Paragraph>
                      <CloseCircleOutlined />
                      {JSON.stringify(error.value.found)}
                    </Paragraph>
                  </div>
                </Result>
              </Space>,
            );
            break;
          default:
            // waiting to apply
            break;
        }
        throw error;
      } else {
        setModels((state) => {
          setModelsOnPage(data.items);
          return data.items;
        });
        // Update next page URL from API response
        if (data.metadata.nextPage) {
          const nextPageUrlFromApi = data.metadata.nextPage;
          setNextPageUrl(nextPageUrlFromApi);

          // Auto-load next page if first page is full (to ensure user has more content initially)
          const currentLimit = searchOptions.limit || defaultPageAndSize.limit;
          if (data.items.length === currentLimit) {
            // Use setTimeout to avoid blocking UI and allow initial render
            setTimeout(() => {
              // Trigger next page load directly with the URL we just got
              // Don't rely on the state update which might be async
              loadNextPageWithUrl(nextPageUrlFromApi);
            }, 500);
          }
        } else {
          // No more pages available from API
          setNextPageUrl("");
        }
      }
    } catch (error) {
      notification.error({
        title: "Fetching models failed.",
        description: `May you check your network?`,
      });
      console.error(error);
      throw error;
    } finally {
      setIsGalleryLoading(false);
    }
  }

  useEffect(() => {
    const currentLimit =
      nonEffectiveSearchOpts.limit || defaultPageAndSize.limit;

    // Create a clean request object without the page parameter
    const createRequestOptions = (
      opts: ModelsRequestOptions,
    ): ModelsRequestOptions => {
      const { page: _page, ...rest } = opts;
      return rest;
    };

    // Always fetch on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const requestOptions = {
        ...searchOptions,
        ...nonEffectiveSearchOpts,
      };
      fetchModels(createRequestOptions(requestOptions));
      return;
    }

    // If we're here, it means either searchOptions changed or limit changed
    // Both cases require refetching data
    prevLimitRef.current = currentLimit;
    const requestOptions = {
      ...searchOptions,
      ...nonEffectiveSearchOpts,
    };
    fetchModels(createRequestOptions(requestOptions));
  }, [searchOptions, nonEffectiveSearchOpts.limit]);

  return isGalleryLoading ? (
    <div>Loading...</div>
  ) : isError ? (
    errorContent
  ) : (
    <GalleryContent />
  );
}

export default CivitaiModelsGallery;
