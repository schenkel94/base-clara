import { STORAGE_KEYS } from "@/features/persistence/storageKeys";
import type { UiPreferences } from "@/features/persistence/types";
import { readFromLocalStorage, writeToLocalStorage } from "@/features/persistence/utils/localStorageClient";

const DEFAULT_PREFERENCES: UiPreferences = {
  preferredCodeLanguage: "python",
};

export function loadUiPreferences(): UiPreferences {
  const saved = readFromLocalStorage<Partial<UiPreferences>>(STORAGE_KEYS.uiPreferences);

  if (!saved) {
    return DEFAULT_PREFERENCES;
  }

  return {
    preferredCodeLanguage:
      saved.preferredCodeLanguage === "power-query" || saved.preferredCodeLanguage === "sql"
        ? saved.preferredCodeLanguage
        : "python",
  };
}

export function saveUiPreferences(patch: Partial<UiPreferences>) {
  const current = loadUiPreferences();
  const next = {
    ...current,
    ...patch,
  };

  writeToLocalStorage(STORAGE_KEYS.uiPreferences, next);
}
