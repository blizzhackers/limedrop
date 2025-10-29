import { ChevronsUpDown, Search, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
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
import { NTIPAliasColor } from "@/constants/NTItemAlias";
import { sdk } from "@/constants/sdk";
import { naturalSort } from "@/lib/utils";
import { ItemTypeCheckbox } from "./ItemTypeCheckbox";

interface QualityFilterFieldProps {
  id?: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const QualityFilterField: React.FC<QualityFilterFieldProps> = ({
  id = "quality-select",
  value,
  onValueChange,
  className = "",
  label = "Quality",
  showLabel = true,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={value !== null ? String(value) : "all"}
        onValueChange={(v) => onValueChange(v === "all" ? null : Number(v))}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border border-gray-700 text-white">
          <SelectItem value="all">All</SelectItem>
          {Object.entries(sdk.items.quality).map(([label, value]) => (
            <SelectItem key={value} value={String(value)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface ItemClassFilterFieldProps {
  id?: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const ItemClassFilterField: React.FC<ItemClassFilterFieldProps> = ({
  id = "item-class-select",
  value,
  onValueChange,
  className = "",
  label = "Item Class",
  showLabel = true,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={value !== null ? String(value) : "all"}
        onValueChange={(v) => onValueChange(v === "all" ? null : Number(v))}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder="Item Class" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classes</SelectItem>
          {Object.entries(sdk.items.class).map(([name, val]) => (
            <SelectItem key={val} value={String(val)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface EtherealFilterFieldProps {
  id?: string;
  value: boolean | null;
  onValueChange: (value: boolean | null) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const EtherealFilterField: React.FC<EtherealFilterFieldProps> = ({
  id = "ethereal-select",
  value,
  onValueChange,
  className = "",
  label = "Ethereal",
  showLabel = true,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={value === null ? "all" : value ? "yes" : "no"}
        onValueChange={(v) => onValueChange(v === "all" ? null : v === "yes")}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder="Ethereal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="yes">Ethereal</SelectItem>
          <SelectItem value="no">Non-Eth</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

interface RunewordFilterFieldProps {
  id?: string;
  value: boolean | null;
  onValueChange: (value: boolean | null) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const RunewordFilterField: React.FC<RunewordFilterFieldProps> = ({
  id = "runeword-select",
  value,
  onValueChange,
  className = "",
  label = "Runeword",
  showLabel = true,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={value === null ? "all" : value ? "yes" : "no"}
        onValueChange={(v) => onValueChange(v === "all" ? null : v === "yes")}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder="Runeword" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="yes">Runeword</SelectItem>
          <SelectItem value="no">Non-RW</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

interface IdentifiedFilterFieldProps {
  id?: string;
  value: boolean | null;
  onValueChange: (value: boolean | null) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const IdentifiedFilterField: React.FC<IdentifiedFilterFieldProps> = ({
  id = "identified-select",
  value,
  onValueChange,
  className = "",
  label = "Identified",
  showLabel = true,
}) => {
  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={value === null ? "all" : value ? "yes" : "no"}
        onValueChange={(v) => onValueChange(v === "all" ? null : v === "yes")}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder="Identified" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="yes">Identified</SelectItem>
          <SelectItem value="no">Unidentified</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

interface ColorFilterFieldProps {
  id?: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const ColorFilterField: React.FC<ColorFilterFieldProps> = ({
  id = "color-select",
  value,
  onValueChange,
  className = "",
  label = "Color",
  showLabel = true,
}) => {
  // Create a sorted array of color entries
  const colorEntries = Object.entries(NTIPAliasColor).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="flex flex-col">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <Select
        value={value !== null ? String(value) : "all"}
        onValueChange={(v) => onValueChange(v === "all" ? null : Number(v))}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-gray-900 border border-gray-700 text-white ${className}`}
        >
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border border-gray-700 text-white">
          <SelectItem value="all">Any</SelectItem>
          {colorEntries.map(([colorName, colorValue]) => (
            <SelectItem key={colorValue} value={String(colorValue)}>
              {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface SocketsFilterFieldProps {
  id?: string;
  value: number | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
  min?: number;
  max?: number;
}

export const SocketsFilterField: React.FC<SocketsFilterFieldProps> = ({
  id = "sockets-input",
  value,
  onChange,
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
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
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
        value={value ?? ""}
        onChange={onChange}
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
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
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

interface ItemCodeFilterFieldProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  showClearButton?: boolean;
}

export const ItemCodeFilterField: React.FC<ItemCodeFilterFieldProps> = ({
  id = "itemcode-input",
  value,
  onValueChange,
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
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="text"
          className={`bg-gray-900 text-white ${className}`}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
        />
        {showClearButton && value && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onValueChange("")}
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
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-9 gap-1 max-h-54 overflow-y-auto bg-gray-900 border border-gray-700 rounded p-2 ${className}`}
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
          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
        >
          {label}
        </label>
      )}
      {selectedItemTypesContent}
      {gridContent}
    </div>
  );
};
