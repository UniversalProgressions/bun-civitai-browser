import { atom } from "jotai";
import type {
  ModelsRequestOptions,
  Model,
  ModelVersion,
} from "../../../civitai-api/v1/models/index";

/**
 * Local models gallery state atoms
 */

// Atom to track gallery loading state
export const isGalleryLoadingAtom = atom(false);

// Atom to store local models data (legacy, for backward compatibility)
export const modelsAtom = atom<Array<Model>>([]);

// Atom to store complete local models data with versions
export const localModelsDataAtom = atom<Array<LocalModelData>>([]);

// Atom to store local search options
export const localSearchOptionsAtom = atom<ModelsRequestOptions>({});

// Atom to store total count of models
export const totalAtom = atom(0);

// Default page and size configuration
export const defaultPageAndSize = {
  page: 1,
  limit: 20,
};

// Interface for complete local model data
export interface LocalModelData {
  model: Model;
  modelVersions: {
    version: ModelVersion;
    mediaUrls: {
      thumbnail?: string;
      images: string[];
    };
    files: Array<{
      id: number;
      name: string;
      url: string;
      exists: boolean;
    }>;
  };
}
