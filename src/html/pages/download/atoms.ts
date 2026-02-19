import { atom } from "jotai";
import type { ExistedModelVersions, Model } from "#civitai-api/v1/models";
import type React from "react";

/**
 * Loading options enumeration
 */
export enum LoadingOptionsEnum {
  VersionId = "VersionId",
  VersionHash = "VersionHash",
  ModelId = "ModelId",
  Url = "Url",
}

/**
 * Atom for currently active model version ID
 */
export const activeVersionIdAtom = atom<string>("");

/**
 * Atom for existing model versions with files on disk
 */
export const existedModelVersionsAtom = atom<ExistedModelVersions>([]);

/**
 * Atom for currently selected loading option
 */
export const selectedOptionAtom = atom<LoadingOptionsEnum>(
  LoadingOptionsEnum.VersionId,
);

/**
 * Atom for input value in the search bar
 */
export const inputValueAtom = atom<string>("");

/**
 * Atom for loading state
 */
export const loadingAtom = atom<boolean>(false);

/**
 * Atom for model content React node
 */
export const modelContentAtom = atom<React.ReactNode>(null);
