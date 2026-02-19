import { Pagination, notification, message } from "antd";
import { useState } from "react";
import { useAtom } from "jotai";
import { debounce } from "es-toolkit";
import { edenTreaty } from "../../../utils";
import {
  nonEffectiveSearchOptsAtom,
  modelsOnPageAtom,
  modelsAtom,
  nextPageUrlAtom,
  defaultPageAndSize,
} from "../atoms";

function CivitaiPagination() {
  const [nonEffectiveSearchOpts, setNonEffectiveSearchOpts] = useAtom(
    nonEffectiveSearchOptsAtom,
  );
  const [, setModelsOnPage] = useAtom(modelsOnPageAtom);

  const [models, setModels] = useAtom(modelsAtom);
  const [nextPageUrl, setNextPageUrl] = useAtom(nextPageUrlAtom);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);

  /**
   * Loads the next page of models from the API
   * Uses the nextPage URL provided by the API metadata
   */
  async function loadNextPage() {
    if (!nextPageUrl) {
      // No next page URL available, show notification
      notification.info({
        message: "No more results",
        description: "You have reached the end of the results.",
      });
      return;
    }

    if (isLoadingNextPage) {
      // Prevent duplicate requests
      return;
    }

    setIsLoadingNextPage(true);
    message.open({
      type: "loading",
      content: "Loading more models...",
      duration: 0,
    });

    try {
      const { data, error } = await edenTreaty.civitai_api.v1.models[
        "next-page"
      ].post({
        nextPage: nextPageUrl,
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
          notification.info({
            message: "No more results",
            description: "You have reached the end of the results.",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching next page:", error);
      notification.error({
        title: "Error fetching models",
        description: String(error),
      });
      throw error;
    } finally {
      setIsLoadingNextPage(false);
      message.destroy();
    }
  }

  const debounceLoadNextPage = debounce(loadNextPage, 500);

  /**
   * Determines if the current page is the last page based on local data
   * This is used for pagination UI, not for API pagination logic
   */
  function isLastLocalPage({
    page,
    limit,
    total,
  }: {
    page: number;
    limit: number;
    total: number;
  }): boolean {
    // Parameter validation
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(
        "Page number must be an integer greater than or equal to 1",
      );
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error("Items per page must be an integer greater than 0");
    }

    if (!Number.isInteger(total) || total < 0) {
      throw new Error("Total items must be a non-negative integer");
    }

    // Handle case when there's no data
    if (total === 0) {
      return false;
    }

    // Calculate total number of pages based on local data
    const totalPages = Math.ceil(total / limit);
    return page >= totalPages;
  }

  /**
   * Handles pagination change events
   * When user reaches the last local page, automatically try to load more from API
   */
  const handlePaginationChange = (page: number, pageSize: number) => {
    setNonEffectiveSearchOpts((prev) => ({
      ...prev,
      page,
      limit: pageSize,
    }));

    // Update the displayed models for the current page
    setModelsOnPage(models.slice((page - 1) * pageSize, page * pageSize));

    // Check if user is on the last local page
    const isLastPage = isLastLocalPage({
      page,
      limit: pageSize,
      total: models.length,
    });

    // If user is on the last local page and there might be more data from API
    if (isLastPage && nextPageUrl) {
      // Auto-load next page from API
      debounceLoadNextPage();
    } else if (isLastPage && !nextPageUrl) {
      // User is on the last page and no more data from API
      notification.info({
        message: "End of results",
        description: "No more models available.",
      });
    }
  };

  return (
    <Pagination
      pageSize={nonEffectiveSearchOpts.limit ?? defaultPageAndSize.limit}
      total={models.length}
      onChange={handlePaginationChange}
      showSizeChanger
      showQuickJumper
      showTotal={(total) => `${total} items loaded!`}
    />
  );
}

export { CivitaiPagination };
