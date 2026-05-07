import { ChevronsUpDown, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NTIPAliasClassID,
  NTIPAliasCodes,
  NTIPAliasColor,
  NTIPAliasType,
} from "@/constants/NTItemAlias";
import { sdk } from "@/constants/sdk";
import { naturalSort } from "@/lib/utils";
import type { FilterField } from "../types/filterTypes";
import { ItemTypeCheckbox } from "./ItemTypeCheckbox";

// ── Generic reusable select wrapper ─────────────────────────────────────────

type SelectOption = { value: string; label: string };

interface SelectFilterFieldProps<T> {
  field: FilterField<T>;
  id?: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  options: SelectOption[];
  allLabel?: string;
  toKey: (v: T) => string;
  fromKey: (k: string) => T;
}

export function SelectFilterField<T>({
  field,
  id,
  label = "",
  showLabel = true,
  className = "",
  options,
  allLabel = "All",
  toKey,
  fromKey,
}: SelectFilterFieldProps<T>) {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-sm mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={toKey(field.state.value)}
        onValueChange={(k) => field.handleChange(fromKey(k))}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border border-gray-700 text-white">
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Individual typed filter fields ───────────────────────────────────────────

interface QualityFilterFieldProps {
  field: FilterField<number | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const qualityOptions: SelectOption[] = Object.entries(sdk.items.quality).map(
  ([lbl, val]) => ({ value: String(val), label: lbl }),
);

export const QualityFilterField: React.FC<QualityFilterFieldProps> = ({
  field,
  id = "quality-select",
  className = "",
  label = "Quality",
  showLabel = true,
}) => (
  <SelectFilterField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    className={className}
    options={qualityOptions}
    toKey={(v) => (v !== null ? String(v) : "all")}
    fromKey={(k) => (k === "all" ? null : Number(k))}
  />
);

interface ItemClassFilterFieldProps {
  field: FilterField<number | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const itemClassOptions: SelectOption[] = Object.entries(sdk.items.class).map(
  ([name, val]) => ({ value: String(val), label: name }),
);

export const ItemClassFilterField: React.FC<ItemClassFilterFieldProps> = ({
  field,
  id = "item-class-select",
  className = "",
  label = "Item Class",
  showLabel = true,
}) => (
  <SelectFilterField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    className={className}
    options={itemClassOptions}
    allLabel="All Classes"
    toKey={(v) => (v !== null ? String(v) : "all")}
    fromKey={(k) => (k === "all" ? null : Number(k))}
  />
);

interface EtherealFilterFieldProps {
  field: FilterField<boolean | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const boolOptions = {
  ethereal: [
    { value: "yes", label: "Ethereal" },
    { value: "no", label: "Non-Eth" },
  ],
  runeword: [
    { value: "yes", label: "Runeword" },
    { value: "no", label: "Non-RW" },
  ],
  identified: [
    { value: "yes", label: "Identified" },
    { value: "no", label: "Unidentified" },
  ],
} as const;

const boolToKey = (v: boolean | null) =>
  v === null ? "all" : v ? "yes" : "no";
const boolFromKey = (k: string): boolean | null =>
  k === "all" ? null : k === "yes";

export const EtherealFilterField: React.FC<EtherealFilterFieldProps> = ({
  field,
  id = "ethereal-select",
  className = "",
  label = "Ethereal",
  showLabel = true,
}) => (
  <SelectFilterField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    className={className}
    options={boolOptions.ethereal as unknown as SelectOption[]}
    allLabel="Any"
    toKey={boolToKey}
    fromKey={boolFromKey}
  />
);

interface RunewordFilterFieldProps {
  field: FilterField<boolean | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const RunewordFilterField: React.FC<RunewordFilterFieldProps> = ({
  field,
  id = "runeword-select",
  className = "",
  label = "Runeword",
  showLabel = true,
}) => (
  <SelectFilterField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    className={className}
    options={boolOptions.runeword as unknown as SelectOption[]}
    allLabel="Any"
    toKey={boolToKey}
    fromKey={boolFromKey}
  />
);

interface IdentifiedFilterFieldProps {
  field: FilterField<boolean | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const IdentifiedFilterField: React.FC<IdentifiedFilterFieldProps> = ({
  field,
  id = "identified-select",
  className = "",
  label = "Identified",
  showLabel = true,
}) => (
  <SelectFilterField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    className={className}
    options={boolOptions.identified as unknown as SelectOption[]}
    allLabel="Any"
    toKey={boolToKey}
    fromKey={boolFromKey}
  />
);

interface ColorFilterFieldProps {
  field: FilterField<number | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const colorOptions: SelectOption[] = Object.entries(NTIPAliasColor)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([name, val]) => ({
    value: String(val),
    label: name.charAt(0).toUpperCase() + name.slice(1),
  }));

export const ColorFilterField: React.FC<ColorFilterFieldProps> = ({
  field,
  id = "color-select",
  className = "",
  label = "Color",
  showLabel = true,
}) => (
  <SelectFilterField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    className={className}
    options={colorOptions}
    allLabel="Any"
    toKey={(v) => (v !== null ? String(v) : "all")}
    fromKey={(k) => (k === "all" ? null : Number(k))}
  />
);

interface SocketsFilterFieldProps {
  field: FilterField<number | null>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
  min?: number;
  max?: number;
}

export const SocketsFilterField: React.FC<SocketsFilterFieldProps> = ({
  field,
  id = "sockets-input",
  className = "",
  label = "Sockets",
  showLabel = true,
  min = 0,
  max = 6,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-sm mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Input
        id={id}
        type="number"
        className={`bg-gray-900 text-white ${className}`}
        min={min}
        max={max}
        value={field.state.value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          field.handleChange(val === "" ? null : Number(val));
        }}
        placeholder="Sockets"
      />
    </div>
  );
};

interface ComparisonSelectFieldProps {
  id?: string;
  value: "gte" | "lte" | "eq";
  onValueChange: (value: "gte" | "lte" | "eq") => void;
  className?: string;
}

export const ComparisonSelectField: React.FC<ComparisonSelectFieldProps> = ({
  id,
  value,
  onValueChange,
  className = "",
}) => {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as "gte" | "lte" | "eq")}
    >
      <SelectTrigger
        id={id}
        className={`w-16 bg-gray-900 border border-gray-700 text-white px-2 ${className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gte">≥</SelectItem>
        <SelectItem value="lte">≤</SelectItem>
        <SelectItem value="eq">=</SelectItem>
      </SelectContent>
    </Select>
  );
};

interface NumericFilterWithComparisonProps {
  id?: string;
  label: string;
  value: number | null;
  comparison: "gte" | "lte" | "eq";
  onValueChange: (value: number | null) => void;
  onComparisonChange: (value: "gte" | "lte" | "eq") => void;
  placeholder?: string;
  min?: number;
  max?: number;
  showLabel?: boolean;
  showClearButton?: boolean;
}

export const NumericFilterWithComparison: React.FC<
  NumericFilterWithComparisonProps
> = ({
  id,
  label,
  value,
  comparison,
  onValueChange,
  onComparisonChange,
  placeholder = "",
  min = 0,
  max = 99,
  showLabel = true,
  showClearButton = false,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-sm mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <ComparisonSelectField
          value={comparison}
          onValueChange={onComparisonChange}
        />
        <Input
          id={id}
          type="number"
          className="bg-gray-900 text-white flex-1"
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onValueChange(val === "" ? null : Number(val));
          }}
          placeholder={placeholder}
        />
        {showClearButton && value !== null && (
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center hover:bg-gray-800 rounded"
            onClick={() => onValueChange(null)}
            title={`Clear ${label}`}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Multi-select combobox ───────────────────────────────────────────────────

interface MultiComboFieldProps {
  field: FilterField<string[]>;
  id?: string;
  label?: string;
  showLabel?: boolean;
  options: { key: string; value: number }[];
  placeholder?: string;
}

export const MultiComboField: React.FC<MultiComboFieldProps> = ({
  field,
  id,
  label,
  showLabel = true,
  options,
  placeholder = "Search...",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = field.state.value;

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    const all = lower
      ? options.filter((o) => o.key.toLowerCase().includes(lower))
      : options;
    return all.slice(0, 60);
  }, [query, options]);

  const toggle = (key: string) => {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    field.handleChange(next);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div className="flex flex-col" ref={containerRef}>
      {showLabel && label && (
        <label
          htmlFor={id}
          className="text-xs xl:text-sm mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selected.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lime-900 border border-lime-700 text-xs text-lime-200"
            >
              {key}
              <button
                type="button"
                onClick={() => toggle(key)}
                className="hover:text-red-400 transition-colors"
                aria-label={`Remove ${key}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          id={id}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-gray-900 text-white"
        />
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No results</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between transition-colors ${
                    selected.includes(opt.key)
                      ? "bg-lime-900/40 text-lime-300 hover:bg-lime-900/60"
                      : "text-white hover:bg-gray-700"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(opt.key);
                  }}
                >
                  <span className="font-mono">{opt.key}</span>
                  <span className="text-gray-500 text-xs">{opt.value}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ITEM_CODE_OPTIONS = Object.entries(NTIPAliasCodes).map(
  ([key, value]) => ({ key, value }),
);

const CLASS_ID_OPTIONS = Object.entries(NTIPAliasClassID).map(
  ([key, value]) => ({ key, value }),
);

interface ItemCodeComboFieldProps {
  field: FilterField<string[]>;
  id?: string;
  label?: string;
  showLabel?: boolean;
}

export const ItemCodeComboField: React.FC<ItemCodeComboFieldProps> = ({
  field,
  id = "itemcode-combo",
  label = "Item Code",
  showLabel = true,
}) => (
  <MultiComboField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    options={ITEM_CODE_OPTIONS}
    placeholder="Search item code (e.g. umc)"
  />
);

interface ClassIdComboFieldProps {
  field: FilterField<string[]>;
  id?: string;
  label?: string;
  showLabel?: boolean;
}

export const ClassIdComboField: React.FC<ClassIdComboFieldProps> = ({
  field,
  id = "classid-combo",
  label = "Class ID",
  showLabel = true,
}) => (
  <MultiComboField
    field={field}
    id={id}
    label={label}
    showLabel={showLabel}
    options={CLASS_ID_OPTIONS}
    placeholder="Search item class (e.g. handaxe)"
  />
);

// ── Item type combo (Set<number> ↔ string[]) ─────────────────────────────────

const ITEM_TYPE_OPTIONS = Object.entries(NTIPAliasType).map(([key, value]) => ({
  key,
  value,
}));

const ITEM_TYPE_BY_ID = Object.fromEntries(
  Object.entries(NTIPAliasType).map(([k, v]) => [v, k]),
) as Record<number, string>;

interface ItemTypeComboFieldProps {
  field: FilterField<Set<number>>;
  id?: string;
  label?: string;
  showLabel?: boolean;
}

export const ItemTypeComboField: React.FC<ItemTypeComboFieldProps> = ({
  field,
  id = "itemtype-combo",
  label = "Item Types",
  showLabel = true,
}) => {
  const adapted: FilterField<string[]> = {
    state: {
      value: Array.from(field.state.value)
        .map((n) => ITEM_TYPE_BY_ID[n])
        .filter(Boolean),
    },
    handleChange: (names: string[]) => {
      field.handleChange(
        new Set(
          names
            .map((name) => NTIPAliasType[name as keyof typeof NTIPAliasType])
            .filter((n): n is NonNullable<typeof n> => n !== undefined),
        ),
      );
    },
  };

  return (
    <MultiComboField
      field={adapted}
      id={id}
      label={label}
      showLabel={showLabel}
      options={ITEM_TYPE_OPTIONS}
      placeholder="Search item type (e.g. sword, helm)"
    />
  );
};

// ── Legacy text input for item code (used in ItemPacksDialog) ───────────────

interface ItemCodeFilterFieldProps {
  field: FilterField<string>;
  id?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  showClearButton?: boolean;
}

export const ItemCodeFilterField: React.FC<ItemCodeFilterFieldProps> = ({
  field,
  id = "itemcode-input",
  className = "",
  label = "Item Code",
  showLabel = true,
  placeholder = "e.g. umc, amu",
  showClearButton = true,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-sm mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="text"
          className={`bg-gray-900 text-white ${className}`}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
        />
        {showClearButton && field.state.value && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => field.handleChange("")}
            title="Clear Item Code Filter"
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
};

interface ItemTypesSelectorProps {
  itemTypeFilter: Set<number>;
  onItemTypeChange: (type: number, checked: boolean) => void;
  id?: string;
  label?: string;
  showLabel?: boolean;
  showSearch?: boolean;
  showCollapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  gridClassName?: string;
}

export const ItemTypesSelector: React.FC<ItemTypesSelectorProps> = ({
  itemTypeFilter,
  onItemTypeChange,
  id = "item-type-select",
  label = "Item Type",
  showLabel = true,
  showSearch = false,
  showCollapsible = false,
  defaultOpen = true,
  className = "",
  gridClassName,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(defaultOpen);

  const allItemTypes = useMemo(
    () => Object.entries(sdk.items.type).sort(([a], [b]) => naturalSort(a, b)),
    [],
  );

  const filteredItemTypes = useMemo(() => {
    if (!showSearch || !searchTerm) return allItemTypes;
    const lower = searchTerm.toLowerCase();
    return allItemTypes.filter(([name]) => name.toLowerCase().includes(lower));
  }, [allItemTypes, searchTerm, showSearch]);

  const selectedItemTypes = useMemo(() => {
    return allItemTypes.filter(([, val]) => itemTypeFilter.has(Number(val)));
  }, [allItemTypes, itemTypeFilter]);

  const selectedItemTypesContent = (
    <>
      {selectedItemTypes.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedItemTypes.map(([name, val]) => (
              <div
                key={val}
                className="flex items-center gap-2 px-2 py-1 rounded border bg-gray-800 border-gray-700"
              >
                <span className="text-sm text-gray-300">{name}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 hover:text-red-400 p-0"
                  onClick={() => onItemTypeChange(Number(val), false)}
                  title={`Remove ${name}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const gridContent = (
    <>
      {showSearch && (
        <div className="mb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search item types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-gray-900 border-gray-700 text-white text-sm"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}
      <div
        id={id}
        className={`grid ${gridClassName ?? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-9"} gap-1 max-h-54 overflow-y-auto bg-gray-900 border border-gray-700 rounded p-2 ${className}`}
      >
        {filteredItemTypes.map(([name, val]) => (
          <ItemTypeCheckbox
            key={val}
            name={name}
            checked={itemTypeFilter.has(Number(val))}
            onChange={(checked) => onItemTypeChange(Number(val), checked)}
          />
        ))}
        {showSearch && filteredItemTypes.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-4">
            No item types found matching "{searchTerm}"
          </div>
        )}
      </div>
    </>
  );

  if (showCollapsible) {
    return (
      <div className="flex flex-col">
        <Collapsible
          open={isCollapsibleOpen}
          onOpenChange={setIsCollapsibleOpen}
        >
          <div className="flex items-center justify-between">
            {showLabel && (
              <label
                htmlFor={id}
                className="text-xs 2xl:text-base mb-1 text-gray-300 font-semibold"
              >
                {label} {itemTypeFilter.size > 0 && `(${itemTypeFilter.size})`}
              </label>
            )}
            <CollapsibleTrigger
              className="flex items-center gap-1 text-gray-400 hover:text-gray-300 cursor-pointer"
              aria-label="Toggle Item Types"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </CollapsibleTrigger>
          </div>
          {!isCollapsibleOpen && selectedItemTypesContent}
          <CollapsibleContent>{gridContent}</CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-sm mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      {selectedItemTypesContent}
      {gridContent}
    </div>
  );
};
