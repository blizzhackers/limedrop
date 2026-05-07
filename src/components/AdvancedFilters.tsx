import {
  ClassIdComboField,
  ColorFilterField,
  EtherealFilterField,
  IdentifiedFilterField,
  ItemClassFilterField,
  ItemCodeComboField,
  ItemTypesSelector,
  NumericFilterWithComparison,
  QualityFilterField,
  RunewordFilterField,
  SocketsFilterField,
} from "@/components/FilterFields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { withForm } from "@/lib/forms/filterForm";
import { useAppStore } from "@/stores/appStore";
import { DEFAULT_FILTER_VALUES } from "../types/filterTypes";
import { StatFilterBuilder } from "./StatFilterBuilder";

export const AdvancedFilters = withForm({
  defaultValues: DEFAULT_FILTER_VALUES,
  render: function Render({ form }) {
    const itemPacks = useAppStore((s) => s.packs);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <form.Field name="qualityFilter">
              {(field) => <QualityFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="itemClassFilter">
              {(field) => <ItemClassFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="etherealFilter">
              {(field) => <EtherealFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="runewordFilter">
              {(field) => <RunewordFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="identifiedFilter">
              {(field) => <IdentifiedFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="socketFilter">
              {(field) => <SocketsFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="colorFilter">
              {(field) => <ColorFilterField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Subscribe
              selector={(s) => ({
                value: s.values.ilvlFilter,
                comparison: s.values.ilvlComparison,
              })}
            >
              {({ value, comparison }) => (
                <NumericFilterWithComparison
                  id="ilvl-input"
                  label="Item Level"
                  value={value}
                  comparison={comparison}
                  onValueChange={(v) => form.setFieldValue("ilvlFilter", v)}
                  onComparisonChange={(v) =>
                    form.setFieldValue("ilvlComparison", v)
                  }
                  placeholder="ilvl"
                  showClearButton={true}
                />
              )}
            </form.Subscribe>
          </div>

          <div className="flex flex-col gap-4">
            <form.Subscribe
              selector={(s) => ({
                value: s.values.levelReqFilter,
                comparison: s.values.levelReqComparison,
              })}
            >
              {({ value, comparison }) => (
                <NumericFilterWithComparison
                  id="levelreq-input"
                  label="Level Req"
                  value={value}
                  comparison={comparison}
                  onValueChange={(v) => form.setFieldValue("levelReqFilter", v)}
                  onComparisonChange={(v) =>
                    form.setFieldValue("levelReqComparison", v)
                  }
                  placeholder="lvl req"
                  showClearButton={true}
                />
              )}
            </form.Subscribe>
          </div>

          <div className="flex flex-col gap-4">
            <form.Subscribe
              selector={(s) => ({
                value: s.values.strReqFilter,
                comparison: s.values.strReqComparison,
              })}
            >
              {({ value, comparison }) => (
                <NumericFilterWithComparison
                  id="strreq-input"
                  label="Str Req"
                  value={value}
                  comparison={comparison}
                  onValueChange={(v) => form.setFieldValue("strReqFilter", v)}
                  onComparisonChange={(v) =>
                    form.setFieldValue("strReqComparison", v)
                  }
                  placeholder="str req"
                  showClearButton={true}
                />
              )}
            </form.Subscribe>
          </div>

          <div className="flex flex-col gap-4">
            <form.Subscribe
              selector={(s) => ({
                value: s.values.dexReqFilter,
                comparison: s.values.dexReqComparison,
              })}
            >
              {({ value, comparison }) => (
                <NumericFilterWithComparison
                  id="dexreq-input"
                  label="Dex Req"
                  value={value}
                  comparison={comparison}
                  onValueChange={(v) => form.setFieldValue("dexReqFilter", v)}
                  onComparisonChange={(v) =>
                    form.setFieldValue("dexReqComparison", v)
                  }
                  placeholder="dex req"
                  showClearButton={true}
                />
              )}
            </form.Subscribe>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="itemCodeFilter">
              {(field) => <ItemCodeComboField field={field} />}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="classIdFilter">
              {(field) => <ClassIdComboField field={field} />}
            </form.Field>
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col flex-1">
            <form.Field name="statFilters">
              {(field) => (
                <StatFilterBuilder
                  field={field}
                  showCollapsible={true}
                  defaultOpen={true}
                />
              )}
            </form.Field>
          </div>

          <div className="flex flex-col flex-1">
            <form.Subscribe selector={(s) => s.values.itemTypeFilter}>
              {(itemTypeFilter) => (
                <ItemTypesSelector
                  itemTypeFilter={itemTypeFilter}
                  onItemTypeChange={(type, checked) => {
                    form.setFieldValue("itemTypeFilter", (prev) => {
                      const next = new Set(prev);
                      if (checked) {
                        next.add(type);
                      } else {
                        next.delete(type);
                      }
                      return next;
                    });
                  }}
                  showSearch={true}
                  showCollapsible={true}
                  defaultOpen={true}
                  gridClassName="grid-cols-3"
                />
              )}
            </form.Subscribe>
          </div>
        </div>

        <form.Subscribe
          selector={(s) => ({
            activeItemPackId: s.values.activeItemPackId,
            itemPackMultiplier: s.values.itemPackMultiplier,
          })}
        >
          {({ activeItemPackId, itemPackMultiplier }) => (
            <div className="mt-2 flex items-center gap-2">
              <label
                htmlFor="item-pack-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Item Pack
              </label>
              <Select
                value={
                  activeItemPackId !== null ? String(activeItemPackId) : "none"
                }
                onValueChange={(v) =>
                  form.setFieldValue(
                    "activeItemPackId",
                    v !== "none" ? Number(v) : null,
                  )
                }
              >
                <SelectTrigger
                  id="item-pack-select"
                  className="w-full bg-gray-900 border border-gray-700 text-white"
                >
                  <SelectValue placeholder="-- No Pack --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Pack --</SelectItem>
                  {itemPacks.map((pack) => (
                    <SelectItem key={pack.id} value={String(pack.id)}>
                      {pack.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeItemPackId !== null && (
                <div className="flex items-center gap-1 ml-2">
                  <label
                    htmlFor="item-pack-multiplier"
                    className="text-xs text-gray-300"
                  >
                    x
                  </label>
                  <input
                    id="item-pack-multiplier"
                    type="number"
                    min={1}
                    max={20}
                    value={itemPackMultiplier}
                    onChange={(e) =>
                      form.setFieldValue(
                        "itemPackMultiplier",
                        Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-12 px-1 py-0.5 rounded bg-gray-900 border border-gray-700 text-white text-center text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </form.Subscribe>
      </div>
    );
  },
});
