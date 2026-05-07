export type Comparison = "gte" | "lte" | "eq";

export type StatFilter = {
  id: string;
  stat: string;
  comparison: Comparison;
  value: number;
};

export type FilterFormValues = {
  qualityFilter: number | null;
  itemClassFilter: number | null;
  itemTypeFilter: Set<number>;
  etherealFilter: boolean | null;
  runewordFilter: boolean | null;
  identifiedFilter: boolean | null;
  socketFilter: number | null;
  colorFilter: number | null;
  activeItemPackId: number | null;
  itemPackMultiplier: number;
  ilvlFilter: number | null;
  ilvlComparison: Comparison;
  levelReqFilter: number | null;
  levelReqComparison: Comparison;
  strReqFilter: number | null;
  strReqComparison: Comparison;
  dexReqFilter: number | null;
  dexReqComparison: Comparison;
  itemCodeFilter: string[];
  classIdFilter: string[];
  statFilters: StatFilter[];
};

/**
 * Minimal structural type compatible with TanStack Form's FieldApi.
 * Keeps FilterFields.tsx decoupled from TanStack's complex generics
 * while remaining duck-type compatible with the actual FieldApi.
 */
export type FilterField<T> = {
  state: { value: T };
  handleChange: (value: T) => void;
};

export const DEFAULT_FILTER_VALUES: FilterFormValues = {
  qualityFilter: null,
  itemClassFilter: null,
  itemTypeFilter: new Set<number>(),
  etherealFilter: null,
  runewordFilter: null,
  identifiedFilter: null,
  socketFilter: null,
  colorFilter: null,
  activeItemPackId: null,
  itemPackMultiplier: 1,
  ilvlFilter: null,
  ilvlComparison: "gte",
  levelReqFilter: null,
  levelReqComparison: "lte",
  strReqFilter: null,
  strReqComparison: "lte",
  dexReqFilter: null,
  dexReqComparison: "lte",
  itemCodeFilter: [],
  classIdFilter: [],
  statFilters: [],
};
