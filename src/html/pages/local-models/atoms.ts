import { atom } from "jotai";
import type { ModelsRequestOptions } from "../../../civitai-api/v1/models/index";
import type { ModelWithAllRelations } from "../../../modules/db/crud/model";

/**
 * Local models gallery state atoms
 */

// Atom to track gallery loading state
export const isGalleryLoadingAtom = atom(false);

// Atom to store local models data
export const modelsAtom = atom<Array<ModelWithAllRelations>>([]);

// Atom to store local search options
export const localSearchOptionsAtom = atom<ModelsRequestOptions>({});

// Atom to store total count of models
export const totalAtom = atom(0);

// Default page and size configuration
export const defaultPageAndSize = {
	page: 1,
	limit: 20,
};
