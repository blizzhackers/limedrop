import {
  Boxes,
  FileCog,
  Gamepad2,
  KeyRound,
  Lock,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DEV_CATEGORIES,
  DEV_ENDPOINTS,
  type DevCategory,
  type DevEndpoint,
} from "@/lib/devApiRegistry";

const CATEGORY_ICONS: Record<
  DevCategory,
  React.ComponentType<{ className?: string }>
> = {
  Session: KeyRound,
  "Accounts & Items": Boxes,
  Game: Gamepad2,
  Files: FileCog,
  Profiles: Wrench,
  Crypto: Lock,
  Utility: Wrench,
  Raw: Terminal,
};

interface EndpointListProps {
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function EndpointList({
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: EndpointListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DEV_ENDPOINTS;
    return DEV_ENDPOINTS.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.func.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<DevCategory, DevEndpoint[]>();
    for (const category of DEV_CATEGORIES) {
      const items = filtered.filter((e) => e.category === category);
      if (items.length) map.set(category, items);
    }
    return map;
  }, [filtered]);

  // Flat order matching visual order — used for arrow-key navigation.
  const flat = useMemo(() => {
    const out: DevEndpoint[] = [];
    for (const items of grouped.values()) out.push(...items);
    return out;
  }, [grouped]);

  const focusOption = (id: string) => {
    // Move focus to the option (roving tabindex) after the re-render.
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-endpoint-id="${id}"]`)
        ?.focus();
    });
  };

  const moveSelection = (delta: number) => {
    if (flat.length === 0) return;
    const currentIndex = flat.findIndex((e) => e.id === selectedId);
    const nextIndex =
      currentIndex === -1
        ? delta > 0
          ? 0
          : flat.length - 1
        : (currentIndex + delta + flat.length) % flat.length;
    const next = flat[nextIndex];
    onSelect(next.id);
    focusOption(next.id);
  };

  // From the search box, ArrowDown / Enter hand off into the filtered results.
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "ArrowDown" || e.key === "Enter") && flat.length) {
      e.preventDefault();
      const inList = flat.some((x) => x.id === selectedId);
      const targetId = inList ? selectedId : flat[0].id;
      if (!inList) onSelect(flat[0].id);
      focusOption(targetId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (flat.length) onSelect(flat[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      if (flat.length) onSelect(flat[flat.length - 1].id);
    }
  };

  return (
    <div className="flex min-h-0 w-[240px] shrink-0 flex-col border-gray-700 border-r bg-gray-900">
      <div className="border-gray-700 border-b p-2">
        <div className="relative">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search endpoints…"
            aria-label="Search endpoints"
            className="border-gray-700 bg-gray-800 pl-8 text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div
          ref={listRef}
          role="listbox"
          aria-label="API endpoints"
          onKeyDown={handleKeyDown}
          className="p-2"
        >
          {flat.length === 0 && (
            <p className="px-2 py-4 text-gray-400 text-sm">
              No endpoints match.
            </p>
          )}
          {[...grouped.entries()].map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <div key={category} className="mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1 font-semibold text-gray-400 text-xs uppercase tracking-wide">
                  <Icon className="h-3.5 w-3.5" />
                  {category}
                </div>
                {items.map((endpoint) => {
                  const isSelected = endpoint.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={endpoint.id}
                      id={`endpoint-${endpoint.id}`}
                      data-endpoint-id={endpoint.id}
                      role="option"
                      aria-selected={isSelected}
                      aria-current={isSelected ? "true" : undefined}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => onSelect(endpoint.id)}
                      onFocus={() => onSelect(endpoint.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lime-400 ${
                        isSelected
                          ? "border border-lime-400 bg-gray-700 font-semibold text-white"
                          : "border border-transparent text-gray-200 hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isSelected && (
                          <span aria-hidden className="text-lime-400">
                            ▸
                          </span>
                        )}
                        {endpoint.label}
                      </span>
                      {endpoint.destructive && (
                        <span
                          aria-hidden
                          title="Destructive"
                          className="shrink-0 text-red-400"
                        >
                          ●
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
