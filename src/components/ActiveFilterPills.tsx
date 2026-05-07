import { X } from "lucide-react";
import { NTIPAliasColor } from "@/constants/NTItemAlias";
import { sdk } from "@/constants/sdk";
import { withForm } from "@/lib/forms/filterForm";
import { DEFAULT_FILTER_VALUES, type StatFilter } from "@/types/filterTypes";

// ── Shared pill component ────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  value: string;
  onRemove: () => void;
  ariaLabel?: string;
  valueClassName?: string;
}

function FilterPill({
  label,
  value,
  onRemove,
  ariaLabel,
  valueClassName = "text-white font-medium",
}: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs">
      <span className="text-gray-400">{label}:</span>
      <span className={valueClassName}>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 hover:text-red-400 transition-colors"
        aria-label={ariaLabel ?? `Remove ${label.toLowerCase()} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function comparisonSymbol(c: string) {
  return c === "gte" ? "≥" : c === "lte" ? "≤" : "=";
}

// ── ActiveFilterPills (withForm HOC) ────────────────────────────────────────

export const ActiveFilterPills = withForm({
  defaultValues: DEFAULT_FILTER_VALUES,
  render: function Render({ form }) {
    return (
      <div className="mb-4 bg-gray-900 p-3 rounded border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-300">
            Active Filters:
          </span>
          <button
            type="button"
            onClick={() => form.reset()}
            className="px-3 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-200 text-xs font-medium transition-colors border border-red-700"
          >
            Clear All Filters
          </button>
        </div>

        <form.Subscribe selector={(s) => s.values}>
          {(values) => (
            <div className="flex flex-wrap gap-2 items-center">
              {values.qualityFilter !== null && (
                <FilterPill
                  label="Quality"
                  value={
                    Object.entries(sdk.items.quality).find(
                      ([, v]) => v === values.qualityFilter,
                    )?.[0] ?? String(values.qualityFilter)
                  }
                  onRemove={() => form.setFieldValue("qualityFilter", null)}
                />
              )}

              {values.itemClassFilter !== null && (
                <FilterPill
                  label="Class"
                  value={
                    Object.entries(sdk.items.class).find(
                      ([, v]) => v === values.itemClassFilter,
                    )?.[0] ?? String(values.itemClassFilter)
                  }
                  onRemove={() => form.setFieldValue("itemClassFilter", null)}
                />
              )}

              {values.itemTypeFilter.size > 0 && (
                <FilterPill
                  label="Item Types"
                  value={`${values.itemTypeFilter.size} selected`}
                  onRemove={() =>
                    form.setFieldValue("itemTypeFilter", new Set<number>())
                  }
                  ariaLabel="Clear item type filters"
                />
              )}

              {values.etherealFilter !== null && (
                <FilterPill
                  label="Ethereal"
                  value={values.etherealFilter ? "Yes" : "No"}
                  onRemove={() => form.setFieldValue("etherealFilter", null)}
                />
              )}

              {values.runewordFilter !== null && (
                <FilterPill
                  label="Runeword"
                  value={values.runewordFilter ? "Yes" : "No"}
                  onRemove={() => form.setFieldValue("runewordFilter", null)}
                />
              )}

              {values.identifiedFilter !== null && (
                <FilterPill
                  label="Identified"
                  value={values.identifiedFilter ? "Yes" : "No"}
                  onRemove={() => form.setFieldValue("identifiedFilter", null)}
                />
              )}

              {values.socketFilter !== null && (
                <FilterPill
                  label="Sockets"
                  value={String(values.socketFilter)}
                  onRemove={() => form.setFieldValue("socketFilter", null)}
                />
              )}

              {values.colorFilter !== null && (
                <FilterPill
                  label="Color"
                  value={
                    Object.entries(NTIPAliasColor).find(
                      ([, v]) => v === values.colorFilter,
                    )?.[0] ?? String(values.colorFilter)
                  }
                  onRemove={() => form.setFieldValue("colorFilter", null)}
                />
              )}

              {values.ilvlFilter !== null && (
                <FilterPill
                  label="ilvl"
                  value={`${comparisonSymbol(values.ilvlComparison)} ${values.ilvlFilter}`}
                  onRemove={() => form.setFieldValue("ilvlFilter", null)}
                  ariaLabel="Remove ilvl filter"
                />
              )}

              {values.levelReqFilter !== null && (
                <FilterPill
                  label="Level Req"
                  value={`${comparisonSymbol(values.levelReqComparison)} ${values.levelReqFilter}`}
                  onRemove={() => form.setFieldValue("levelReqFilter", null)}
                  ariaLabel="Remove level requirement filter"
                />
              )}

              {values.strReqFilter !== null && (
                <FilterPill
                  label="Str Req"
                  value={`${comparisonSymbol(values.strReqComparison)} ${values.strReqFilter}`}
                  onRemove={() => form.setFieldValue("strReqFilter", null)}
                  ariaLabel="Remove strength requirement filter"
                />
              )}

              {values.dexReqFilter !== null && (
                <FilterPill
                  label="Dex Req"
                  value={`${comparisonSymbol(values.dexReqComparison)} ${values.dexReqFilter}`}
                  onRemove={() => form.setFieldValue("dexReqFilter", null)}
                  ariaLabel="Remove dexterity requirement filter"
                />
              )}

              {values.itemCodeFilter.map((code: string) => (
                <FilterPill
                  key={code}
                  label="Item Code"
                  value={code}
                  onRemove={() =>
                    form.setFieldValue(
                      "itemCodeFilter",
                      values.itemCodeFilter.filter((c: string) => c !== code),
                    )
                  }
                />
              ))}

              {values.classIdFilter.map((name: string) => (
                <FilterPill
                  key={name}
                  label="Class ID"
                  value={name}
                  onRemove={() =>
                    form.setFieldValue(
                      "classIdFilter",
                      values.classIdFilter.filter((c: string) => c !== name),
                    )
                  }
                />
              ))}

              {values.statFilters.map((filter: StatFilter) => (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs"
                >
                  <span className="text-lime-400 font-medium">
                    {filter.stat}
                  </span>
                  <span className="text-gray-400">
                    {comparisonSymbol(filter.comparison)}
                  </span>
                  <span className="text-white font-mono">{filter.value}</span>
                  <button
                    type="button"
                    onClick={() =>
                      form.setFieldValue(
                        "statFilters",
                        values.statFilters.filter(
                          (f: StatFilter) => f.id !== filter.id,
                        ),
                      )
                    }
                    className="ml-1 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${filter.stat} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </form.Subscribe>
      </div>
    );
  },
});
