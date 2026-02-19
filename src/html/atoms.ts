import { atom } from "jotai";
import { type Settings } from "#modules/settings/model";

/**
 * Global application settings state atoms
 */

// Atom to track if settings are valid (configured and validated)
export const settingsValidAtom = atom<boolean>(false);

// Atom to track if settings check is in progress
export const settingsCheckingAtom = atom<boolean>(true);

// Atom to track if settings have been initialized (first check completed)
export const settingsInitializedAtom = atom<boolean>(false);

// Atom to store the current settings data (optional, for caching)
export const settingsDataAtom = atom<Settings | null>(null);

// Atom to track if the app is in initial setup mode (settings missing)
export const initialSetupRequiredAtom = atom<boolean>(false);

// Derived atom: check if settings are valid AND initialized
export const settingsReadyAtom = atom(
  (get) => get(settingsValidAtom) && get(settingsInitializedAtom),
);

// Derived atom: check if we should show setup UI
export const showSetupRequiredAtom = atom(
  (get) => !get(settingsValidAtom) && get(settingsInitializedAtom),
);
