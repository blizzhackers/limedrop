import {
  type ItemPackFilter,
  addItemPack,
  deleteItemPack,
  getItemPacks,
  updateItemPack,
} from "@/lib/itemPacksDb";
import { sdk } from "@/lib/sdk";
import { naturalSort } from "@/lib/utils";
import { setPacks, useAppStore } from "@/stores/appStore";
import { useItemPacksDialogStore } from "@/stores/itemPacksDialogStore";
import { useForm } from "@tanstack/react-form";
import { Edit2Icon, Trash2Icon, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ItemTypeCheckbox } from "./ItemTypeCheckbox";
import { type StatFilter, StatFilterBuilder } from "./StatFilterBuilder";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const ItemPacksDialog: React.FC = () => {
  const username = useAppStore((s) => s.username);
  const packs = useAppStore((s) => s.packs);
  const session = useAppStore((s) => s.session);
  const open = useItemPacksDialogStore((s) => s.open);

  // Pack-level state (not in form)
  const [filters, setFilters] = useState<ItemPackFilter[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editFilterIdx, setEditFilterIdx] = useState<number | null>(null);

  // Legacy stat editing state
  const [statInput, setStatInput] = useState("");
  const [editStatIdx, setEditStatIdx] = useState<number | null>(null);
  const [statEditIdx, setStatEditIdx] = useState<number | null>(null);

  // TanStack Form for pack name
  const packForm = useForm({
    defaultValues: {
      label: "",
    },
  });

  // TanStack Form for filter creation/editing
  const filterForm = useForm({
    defaultValues: {
      name: "",
      qualityFilter: null as number | null,
      itemClassFilter: null as number | null,
      itemTypeFilter: new Set<number>(),
      etherealFilter: null as boolean | null,
      runewordFilter: null as boolean | null,
      sockets: null as number | null,
      count: null as number | null,
      stats: [] as string[],
      // V2 filters
      ilvlFilter: null as number | null,
      ilvlComparison: "gte" as "gte" | "lte" | "eq",
      levelReqFilter: null as number | null,
      levelReqComparison: "lte" as "gte" | "lte" | "eq",
      itemCodeFilter: "",
      statFilters: [] as StatFilter[],
    },
    onSubmit: async ({ value }) => {
      const filter = buildFilterFromFormValues(value);
      if (Object.keys(filter).length === 0) return;

      if (editFilterIdx !== null) {
        // Update existing filter
        const updated = [...filters];
        updated[editFilterIdx] = filter;
        setFilters(updated);
        setEditFilterIdx(null);
      } else {
        // Add new filter
        setFilters((prev) => [...prev, filter]);
      }

      // Reset form
      filterForm.reset();
    },
  });

  // Helper function to build filter from form values
  const buildFilterFromFormValues = (
    values: typeof filterForm.state.values,
  ): ItemPackFilter => {
    const filter: ItemPackFilter = {};
    if (values.name.trim()) filter.name = values.name.trim();
    if (values.itemTypeFilter.size > 0)
      filter.itemType = Array.from(values.itemTypeFilter);
    if (values.qualityFilter !== null) filter.quality = values.qualityFilter;
    if (values.itemClassFilter !== null)
      filter.classid = values.itemClassFilter;
    if (typeof values.etherealFilter === "boolean")
      filter.ethereal = values.etherealFilter;
    if (typeof values.runewordFilter === "boolean")
      filter.runeword = values.runewordFilter;
    if (values.sockets !== null) filter.sockets = values.sockets;
    if (values.count !== null) filter.count = values.count;
    if (values.stats.length > 0) filter.stats = [...values.stats];
    // V2 filters
    if (values.ilvlFilter !== null) {
      filter.ilvl = values.ilvlFilter;
      filter.ilvlComparison = values.ilvlComparison;
    }
    if (values.levelReqFilter !== null) {
      filter.levelReq = values.levelReqFilter;
      filter.levelReqComparison = values.levelReqComparison;
    }
    if (values.itemCodeFilter.trim())
      filter.itemCode = values.itemCodeFilter.trim();
    if (values.statFilters.length > 0) {
      filter.statFilters = values.statFilters.map(
        ({ stat, comparison, value }) => ({
          stat,
          comparison,
          value,
        }),
      );
    }
    return filter;
  };

  useEffect(() => {
    if (selectedPackId !== null && packs.length > 0) {
      const pack = packs.find((p) => p.id === selectedPackId);
      if (pack) {
        packForm.setFieldValue("label", pack.label);
        setFilters(pack.filters);
        setEditingId(pack.id);
        filterForm.reset();
      }
    }
  }, [selectedPackId, packs, filterForm, packForm]);

  const handleItemTypeChange = useCallback(
    (val: number) => (checked: boolean) => {
      const current = filterForm.getFieldValue("itemTypeFilter");
      const next = new Set(current);
      checked ? next.add(val) : next.delete(val);
      filterForm.setFieldValue("itemTypeFilter", next);
    },
    [filterForm],
  );

  useEffect(() => {
    if (open && session) {
      getItemPacks(username).then((packs) => {
        setPacks(packs);
      });
    }
  }, [open, session, username]);

  const resetForm = () => {
    packForm.setFieldValue("label", "");
    setFilters([]);
    setEditingId(null);
    filterForm.reset();
  };

  const handleAddStat = () => {
    const trimmed = statInput.trim();
    if (!trimmed) return;
    const currentStats = filterForm.getFieldValue("stats");
    if (editStatIdx !== null) {
      // Editing existing stat
      const updated = currentStats.map((s, i) =>
        i === editStatIdx ? trimmed : s,
      );
      filterForm.setFieldValue("stats", updated);
      setEditStatIdx(null);
      setStatInput("");
      return;
    }
    if (!currentStats.includes(trimmed)) {
      filterForm.setFieldValue("stats", [...currentStats, trimmed]);
      setStatInput("");
    }
  };

  const handleEditStat = (idx: number) => {
    const currentStats = filterForm.getFieldValue("stats");
    setStatEditIdx(idx);
    setStatInput(currentStats[idx] || "");
  };

  const handleSaveStatEdit = () => {
    if (statEditIdx === null) return;
    const trimmed = statInput.trim();
    if (!trimmed) return;
    const currentStats = filterForm.getFieldValue("stats");
    if (currentStats.some((s, i) => s === trimmed && i !== statEditIdx)) return;
    const updated = currentStats.map((s, i) =>
      i === statEditIdx ? trimmed : s,
    );
    filterForm.setFieldValue("stats", updated);
    setStatEditIdx(null);
    setStatInput("");
  };

  const handleCancelStatEdit = () => {
    setStatEditIdx(null);
    setStatInput("");
  };

  const handleRemoveStat = (idx: number) => {
    const currentStats = filterForm.getFieldValue("stats");
    filterForm.setFieldValue(
      "stats",
      currentStats.filter((_, i) => i !== idx),
    );
    if (statEditIdx === idx) {
      setStatEditIdx(null);
      setStatInput("");
    }
  };

  const handleRemoveFilter = (idx: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const label = packForm.getFieldValue("label");
    if (!session || !label.trim() || filters.length === 0) return;
    if (editingId) {
      await updateItemPack(editingId, { label, filters, username });
    } else {
      await addItemPack({ label, filters, username });
    }
    const updated = await getItemPacks(username);
    setPacks(updated);
    resetForm();
    setSelectedPackId(null);
  };

  const handleDelete = async (id: number) => {
    if (!session) return;
    await deleteItemPack(id);
    setPacks(await getItemPacks(username));
    resetForm();
    setSelectedPackId(null);
  };

  const handleEditFilter = (idx: number) => {
    const f = filters[idx];
    filterForm.setFieldValue("name", f.name || "");
    filterForm.setFieldValue("qualityFilter", f.quality ?? null);
    filterForm.setFieldValue("itemClassFilter", f.classid ?? null);
    filterForm.setFieldValue("itemTypeFilter", new Set(f.itemType ?? []));
    filterForm.setFieldValue(
      "etherealFilter",
      typeof f.ethereal === "boolean" ? f.ethereal : null,
    );
    filterForm.setFieldValue(
      "runewordFilter",
      typeof f.runeword === "boolean" ? f.runeword : null,
    );
    filterForm.setFieldValue("sockets", f.sockets ?? null);
    filterForm.setFieldValue("count", f.count ?? null);
    filterForm.setFieldValue("stats", f.stats ?? []);
    // V2 filters
    filterForm.setFieldValue("ilvlFilter", f.ilvl ?? null);
    filterForm.setFieldValue("ilvlComparison", f.ilvlComparison ?? "gte");
    filterForm.setFieldValue("levelReqFilter", f.levelReq ?? null);
    filterForm.setFieldValue(
      "levelReqComparison",
      f.levelReqComparison ?? "lte",
    );
    filterForm.setFieldValue("itemCodeFilter", f.itemCode ?? "");
    filterForm.setFieldValue(
      "statFilters",
      (f.statFilters ?? []).map((sf, i) => ({
        id: `${Date.now()}-${i}`,
        ...sf,
      })),
    );
    setEditFilterIdx(idx);
  };

  const handleCancelFilterEdit = () => {
    setEditFilterIdx(null);
    filterForm.reset();
  };

  const handleQualityChange = useCallback(
    (v: string) => {
      filterForm.setFieldValue("qualityFilter", v === "all" ? null : Number(v));
    },
    [filterForm],
  );
  const handleItemClassChange = useCallback(
    (v: string) => {
      filterForm.setFieldValue(
        "itemClassFilter",
        v === "all" ? null : Number(v),
      );
    },
    [filterForm],
  );
  const handleSocketsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      filterForm.setFieldValue(
        "sockets",
        e.target.value ? Number(e.target.value) : null,
      );
    },
    [filterForm],
  );
  const handleCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      filterForm.setFieldValue(
        "count",
        e.target.value ? Number(e.target.value) : null,
      );
    },
    [filterForm],
  );
  const handleEtherealChange = useCallback(
    (v: string) => {
      filterForm.setFieldValue(
        "etherealFilter",
        v === "all" ? null : v === "yes",
      );
    },
    [filterForm],
  );
  const handleRunewordChange = useCallback(
    (v: string) => {
      filterForm.setFieldValue(
        "runewordFilter",
        v === "all" ? null : v === "yes",
      );
    },
    [filterForm],
  );

  const handleDeleteRequest = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId !== null) {
      await handleDelete(pendingDeleteId);
      setPendingDeleteId(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
    setDeleteDialogOpen(false);
  };

  const handleExportPack = () => {
    if (selectedPackId !== null) {
      const pack = packs.find((p) => p.id === selectedPackId);
      if (!pack) return;
      const data = JSON.stringify(pack, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pack.label.replace(/[^a-z0-9]/gi, "_") || "itempack"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportAll = () => {
    if (!packs.length) return;
    const data = JSON.stringify(packs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all_itempacks.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function isItemPackFilter(obj: unknown): obj is ItemPackFilter {
    return typeof obj === "object" && obj !== null;
  }

  function isItemPack(
    obj: unknown,
  ): obj is { label: string; filters: unknown[] } {
    if (typeof obj !== "object" || obj === null) return false;
    const rec = obj as Record<string, unknown>;
    return typeof rec.label === "string" && Array.isArray(rec.filters);
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn("No file found");
      return;
    }
    try {
      const text = await file.text();
      const importedRaw: unknown = JSON.parse(text);
      const importedArr = Array.isArray(importedRaw)
        ? importedRaw
        : [importedRaw];
      const valid = importedArr.filter(isItemPack);
      if (!valid.length) {
        toast.error("No valid item packs found in file.");
        return;
      }

      const packsToAdd = valid.map((p) => ({
        ...p,
        id: undefined,
        username,
        filters: Array.isArray(p.filters)
          ? p.filters.filter(isItemPackFilter)
          : [],
      }));
      for (const pack of packsToAdd) {
        await addItemPack(
          pack as {
            label: string;
            filters: ItemPackFilter[];
            username: string;
          },
        );
      }
      setPacks(await getItemPacks(username));
      toast.success(`Imported ${packsToAdd.length} item pack(s).`);
    } catch (err) {
      toast.error("Failed to import item packs.");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={useItemPacksDialogStore.getState().setOpen}
      >
        <DialogContent className="w-full min-w-[90dvw] max-w-2xl md:max-w-3xl bg-gray-700 p-2 md:p-6 max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-white text-base md:text-xl">
              Manage Item Packs
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-row gap-2 mb-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPack}
              disabled={selectedPackId === null}
            >
              Export Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportAll}
              disabled={!packs.length}
            >
              Export All
            </Button>
            <label htmlFor="import" className="inline-block">
              <span className="sr-only">Import Packs</span>
              <Input
                id="import"
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
              <Button asChild size="sm" variant="outline">
                <span>Import</span>
              </Button>
            </label>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            <div>
              <label
                htmlFor="pack-select"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Select Saved Pack
              </label>
              <div className="flex flex-row items-center mb-2 gap-1">
                <Select
                  name="pack-select"
                  value={selectedPackId !== null ? String(selectedPackId) : ""}
                  onValueChange={(v) => {
                    setSelectedPackId(v !== "none" ? Number(v) : null);
                    v === "none" && resetForm();
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-900 border border-gray-700 text-white">
                    <SelectValue placeholder="Choose a pack to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Pack --</SelectItem>
                    {packs.map((pack) => (
                      <SelectItem key={pack.id} value={String(pack.id)}>
                        {pack.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() =>
                    selectedPackId !== null &&
                    handleDeleteRequest(selectedPackId)
                  }
                  disabled={selectedPackId === null}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <div>
              <label
                htmlFor="pack-name-input"
                className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
              >
                Item Pack Name
              </label>
              <packForm.Field name="label">
                {(field) => (
                  <Input
                    id="pack-name-input"
                    placeholder="Pack Name"
                    className="mb-2 bg-gray-900 text-white"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </packForm.Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 flex flex-col">
                  <label
                    htmlFor="name-input"
                    className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                  >
                    Name
                  </label>
                  <filterForm.Field name="name">
                    {(field) => (
                      <Input
                        id="name-input"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Item Name (optional)"
                        className="bg-gray-900 text-white"
                      />
                    )}
                  </filterForm.Field>
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col">
                  <label
                    htmlFor="stat-input"
                    className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                  >
                    Stats (one per line)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="stat-input"
                      value={statInput}
                      onChange={(e) => setStatInput(e.target.value)}
                      placeholder="Enter stat and press Add"
                      className="bg-gray-900 text-white flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          statEditIdx !== null
                            ? handleSaveStatEdit()
                            : handleAddStat();
                        }
                      }}
                    />
                    {statEditIdx !== null ? (
                      <>
                        <Button
                          type="button"
                          onClick={handleSaveStatEdit}
                          disabled={!statInput.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelStatEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleAddStat}
                        disabled={!statInput.trim()}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-yellow-400 mb-2">
                    <strong>Tip:</strong> You can use regular expressions for
                    advanced matching.
                    <br />
                    If you want to match special characters (like <code>+</code>
                    , <code>*</code>, <code>?</code>, etc.), escape them with a
                    backslash (e.g. <code>\+</code>).
                    <br />
                    <span className="text-red-400">
                      Invalid regex will cause errors.
                    </span>
                  </div>
                  <filterForm.Subscribe
                    selector={(state) => state.values.stats}
                  >
                    {(stats) =>
                      stats.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                          {stats.map((s, idx) => (
                            <li
                              key={
                                stats.filter((x) => x === s).length === 1
                                  ? s
                                  : `${s}-${idx}`
                              }
                              className="bg-gray-800 text-white rounded px-2 py-1 flex items-center gap-1 text-xs"
                            >
                              <span>{s}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditStat(idx)}
                              >
                                <Edit2Icon />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveStat(idx)}
                              >
                                <X />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )
                    }
                  </filterForm.Subscribe>
                </div>
                <div className="flex flex-col gap-4">
                  <filterForm.Field name="qualityFilter">
                    {(field) => (
                      <div className="flex flex-col">
                        <label
                          htmlFor="quality-select"
                          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                        >
                          Quality
                        </label>
                        <Select
                          value={
                            field.state.value !== null
                              ? String(field.state.value)
                              : "all"
                          }
                          onValueChange={handleQualityChange}
                        >
                          <SelectTrigger
                            id="quality-select"
                            className="w-full bg-gray-900 border border-gray-700 text-white"
                          >
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border border-gray-700 text-white">
                            <SelectItem value="all">All</SelectItem>
                            {Object.entries(sdk.items.quality).map(
                              ([label, value]) => (
                                <SelectItem key={value} value={String(value)}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </filterForm.Field>
                  <filterForm.Field name="itemClassFilter">
                    {(field) => (
                      <div className="flex flex-col">
                        <label
                          htmlFor="item-class-select"
                          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                        >
                          Item Class
                        </label>
                        <Select
                          value={
                            field.state.value !== null
                              ? String(field.state.value)
                              : "all"
                          }
                          onValueChange={handleItemClassChange}
                        >
                          <SelectTrigger
                            id="item-class-select"
                            className="w-full bg-gray-900 border border-gray-700 text-white"
                          >
                            <SelectValue placeholder="Item Class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {Object.entries(sdk.items.class).map(
                              ([label, value]) => (
                                <SelectItem key={value} value={String(value)}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </filterForm.Field>
                </div>
                <div className="flex flex-col gap-4">
                  <filterForm.Field name="etherealFilter">
                    {(field) => (
                      <div className="flex flex-col">
                        <label
                          htmlFor="ethereal-select"
                          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                        >
                          Ethereal
                        </label>
                        <Select
                          value={
                            field.state.value === null
                              ? "all"
                              : field.state.value
                                ? "yes"
                                : "no"
                          }
                          onValueChange={handleEtherealChange}
                        >
                          <SelectTrigger
                            id="ethereal-select"
                            className="w-full bg-gray-900 border border-gray-700 text-white"
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
                    )}
                  </filterForm.Field>
                  <filterForm.Field name="runewordFilter">
                    {(field) => (
                      <div className="flex flex-col">
                        <label
                          htmlFor="runeword-select"
                          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                        >
                          Runeword
                        </label>
                        <Select
                          value={
                            field.state.value === null
                              ? "all"
                              : field.state.value
                                ? "yes"
                                : "no"
                          }
                          onValueChange={handleRunewordChange}
                        >
                          <SelectTrigger
                            id="runeword-select"
                            className="w-full bg-gray-900 border border-gray-700 text-white"
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
                    )}
                  </filterForm.Field>
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-row gap-4">
                  <filterForm.Field name="sockets">
                    {(field) => (
                      <div className="flex flex-col flex-1">
                        <label
                          htmlFor="sockets-input"
                          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                        >
                          Sockets
                        </label>
                        <Input
                          id="sockets-input"
                          type="number"
                          className="bg-gray-900 text-white"
                          min={0}
                          value={field.state.value ?? ""}
                          onChange={handleSocketsChange}
                          placeholder="Sockets"
                        />
                      </div>
                    )}
                  </filterForm.Field>
                  <filterForm.Field name="count">
                    {(field) => (
                      <div className="flex flex-col flex-1">
                        <label
                          htmlFor="count-input"
                          className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                        >
                          Count
                        </label>
                        <Input
                          id="count-input"
                          type="number"
                          min={1}
                          max={6}
                          className="bg-gray-900 text-white"
                          value={field.state.value ?? ""}
                          onChange={handleCountChange}
                          placeholder="Count"
                        />
                      </div>
                    )}
                  </filterForm.Field>
                </div>

                {/* V2 Item Filters */}
                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-600">
                  <h3 className="text-sm font-semibold text-lime-400 mb-3">
                    V2 Item Filters (Enhanced Data)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <filterForm.Field name="ilvlFilter">
                      {(field) => (
                        <div className="flex flex-col">
                          <label
                            htmlFor="ilvl-filter"
                            className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                          >
                            Item Level
                          </label>
                          <div className="flex items-center gap-1">
                            <filterForm.Field name="ilvlComparison">
                              {(compField) => (
                                <Select
                                  value={compField.state.value}
                                  onValueChange={(v) =>
                                    filterForm.setFieldValue(
                                      "ilvlComparison",
                                      v as "gte" | "lte" | "eq",
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-16 bg-gray-900 border border-gray-700 text-white px-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gte">≥</SelectItem>
                                    <SelectItem value="lte">≤</SelectItem>
                                    <SelectItem value="eq">=</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </filterForm.Field>
                            <Input
                              id="ilvl-filter"
                              type="number"
                              className="bg-gray-900 text-white flex-1"
                              min={0}
                              max={99}
                              value={field.state.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                filterForm.setFieldValue(
                                  "ilvlFilter",
                                  val === "" ? null : Number(val),
                                );
                              }}
                              placeholder="ilvl"
                            />
                          </div>
                        </div>
                      )}
                    </filterForm.Field>
                    <filterForm.Field name="levelReqFilter">
                      {(field) => (
                        <div className="flex flex-col">
                          <label
                            htmlFor="levelreq-filter"
                            className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                          >
                            Level Requirement
                          </label>
                          <div className="flex items-center gap-1">
                            <filterForm.Field name="levelReqComparison">
                              {(compField) => (
                                <Select
                                  value={compField.state.value}
                                  onValueChange={(v) =>
                                    filterForm.setFieldValue(
                                      "levelReqComparison",
                                      v as "gte" | "lte" | "eq",
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-16 bg-gray-900 border border-gray-700 text-white px-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gte">≥</SelectItem>
                                    <SelectItem value="lte">≤</SelectItem>
                                    <SelectItem value="eq">=</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </filterForm.Field>
                            <Input
                              id="levelreq-filter"
                              type="number"
                              className="bg-gray-900 text-white flex-1"
                              min={0}
                              max={99}
                              value={field.state.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                filterForm.setFieldValue(
                                  "levelReqFilter",
                                  val === "" ? null : Number(val),
                                );
                              }}
                              placeholder="lvl req"
                            />
                          </div>
                        </div>
                      )}
                    </filterForm.Field>
                    <filterForm.Field name="itemCodeFilter">
                      {(field) => (
                        <div className="flex flex-col md:col-span-2">
                          <label
                            htmlFor="itemcode-filter"
                            className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                          >
                            Item Code
                          </label>
                          <Input
                            id="itemcode-filter"
                            type="text"
                            className="bg-gray-900 text-white"
                            value={field.state.value}
                            onChange={(e) =>
                              filterForm.setFieldValue(
                                "itemCodeFilter",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. umc, amu"
                          />
                        </div>
                      )}
                    </filterForm.Field>

                    {/* Stat Filters */}
                    <filterForm.Field name="statFilters">
                      {(field) => (
                        <div className="flex flex-col md:col-span-2 mt-4">
                          <StatFilterBuilder
                            statFilters={field.state.value}
                            setStatFilters={(val) =>
                              filterForm.setFieldValue("statFilters", val)
                            }
                            showLabel={true}
                            labelText="Item Stats"
                          />
                        </div>
                      )}
                    </filterForm.Field>
                  </div>
                </div>
              </div>
              <filterForm.Field name="itemTypeFilter">
                {(field) => (
                  <div className="flex flex-col mt-6">
                    <label
                      htmlFor="item-type-select"
                      className="text-xs xl:text-base mb-1 text-gray-300 font-semibold"
                    >
                      Item Type
                    </label>
                    <div
                      id="item-type-select"
                      className="text-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 max-h-54 overflow-y-auto bg-gray-900 border border-gray-700 rounded p-2"
                    >
                      {Object.entries(sdk.items.type)
                        .sort(([a], [b]) => naturalSort(a, b))
                        .map(([name, val]) => (
                          <ItemTypeCheckbox
                            key={val}
                            name={name}
                            checked={field.state.value.has(Number(val))}
                            onChange={handleItemTypeChange(Number(val))}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </filterForm.Field>
              <filterForm.Subscribe
                selector={(state) => ({
                  values: state.values,
                  canSubmit:
                    Object.keys(buildFilterFromFormValues(state.values))
                      .length > 0,
                })}
              >
                {({ canSubmit }) => (
                  <div className="flex flex-row justify-end gap-2">
                    {editFilterIdx !== null ? (
                      <>
                        <Button
                          className="mt-2 flex justify-end"
                          onClick={(e) => {
                            e.preventDefault();
                            filterForm.handleSubmit();
                          }}
                          disabled={!canSubmit}
                        >
                          Save Filter Edit
                        </Button>
                        <Button
                          className="mt-2 flex justify-end text-white"
                          variant="ghost"
                          onClick={handleCancelFilterEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <div className="mt-2 flex justify-end">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            filterForm.handleSubmit();
                          }}
                          disabled={!canSubmit}
                        >
                          Add to Pack
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </filterForm.Subscribe>
              {filters.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-sm text-gray-300">
                    Current Filters in Pack:
                  </h4>
                  <ul className="space-y-1">
                    {filters.map((f, idx) => (
                      <li
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={idx}
                        className="flex items-center justify-between gap-2 text-xs text-white bg-gray-800 rounded px-2 py-1"
                      >
                        <span>{JSON.stringify(f)}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditFilter(idx)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFilter(idx)}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <packForm.Subscribe selector={(state) => state.values.label}>
                {(label) => (
                  <div className="mt-2 flex justify-end">
                    {filters.length > 0 && (
                      <Button
                        onClick={handleSave}
                        disabled={!label.trim() || filters.length === 0}
                      >
                        Save Pack
                      </Button>
                    )}
                    {editingId && (
                      <Button
                        className="ml-2"
                        variant="destructive"
                        onClick={resetForm}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                )}
              </packForm.Subscribe>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-xs bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Item Pack?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-white">
            Are you sure you want to delete this item pack? This action cannot
            be undone.
          </div>
          <div className="flex justify-end gap-2 mt-4 text-white">
            <Button variant="ghost" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemPacksDialog;
