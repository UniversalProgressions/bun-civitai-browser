import { atom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import type {
  ModelsRequestOptions,
  Model,
} from "../../../civitai-api/v1/models/index";
import type { ExistedModelVersions } from "../../../civitai-api/v1/models/index";

export enum ModalWidthEnum {
  SearchPanel = 600,
  modelDetailCard = 1000,
}

export enum ModalType {
  NONE = "NONE",
  SEARCH = "SEARCH",
  MODEL_DETAIL = "MODEL_DETAIL",
}

export interface ModalState {
  type: ModalType;
  isOpen: boolean;
  width: number;
  params?: {
    modelId?: number;
    modelData?: Model;
    searchOptions?: ModelsRequestOptions;
  };
}

export const defaultPageAndSize = {
  page: 1,
  limit: 20,
};

export const modalStateAtom = atom<ModalState>({
  type: ModalType.NONE,
  isOpen: false,
  width: ModalWidthEnum.SearchPanel,
});

export const modelsAtom = atomWithImmer<Model[]>([]);
export const modelsOnPageAtom = atom<Model[]>([]);
export const searchOptsAtom = atom<ModelsRequestOptions>({});
export const tempSearchOptsAtom = atomWithImmer<ModelsRequestOptions>({});
export const nextPageUrlAtom = atom<string>("");
export const nonEffectiveSearchOptsAtom =
  atom<Partial<ModelsRequestOptions>>(defaultPageAndSize);
export const isGalleryLoadingAtom = atom<boolean>(false);
export const activeVersionIdAtom = atom<string>("");
export const civitaiExistedModelVersionsAtom = atom<ExistedModelVersions>([]);
