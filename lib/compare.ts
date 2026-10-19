"use client";

import { createLocalListStore } from "./stores/local-list";

export const COMPARE_MAX = 3;

/** Device-local comparison tray (temporary adapter — see lib/stores/local-list.ts). */
export const compareList = createLocalListStore({ key: "pricepilot:compare:v1", max: COMPARE_MAX });

export const useCompareList = compareList.useItems;
