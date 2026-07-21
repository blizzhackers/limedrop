import { ChevronDown, History, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { D2BotAPI } from "@/lib/D2Bot";
import { DEV_ENDPOINTS, type DevEndpoint } from "@/lib/devApiRegistry";
import { useAppStore } from "@/stores/appStore";
import {
  type AutofillContext,
  buildAutofillContext,
  type CallStatus,
  formatResponse,
  type HistoryEntry,
  initialValuesFor,
  savePersistedValues,
  statusOfResponse,
  withoutPasswords,
} from "./devConsoleUtils";
import { EndpointList } from "./EndpointList";
import { EndpointPanel, type ResponseState } from "./EndpointPanel";

const HISTORY_CAP = 25;

const EMPTY_CTX: AutofillContext = {
  realm: "",
  account: "",
  character: "",
  username: "",
  session: "",
  password: "",
  apiUrl: "",
  gameName: "",
  hash: "",
};

const byId = (id: string): DevEndpoint =>
  DEV_ENDPOINTS.find((e) => e.id === id) ?? DEV_ENDPOINTS[0];

interface ApiConsoleProps {
  api: D2BotAPI;
}

export function ApiConsole({ api }: ApiConsoleProps) {
  const session = useAppStore((s) => s.session);
  const hasSession = Boolean(session);
  const realm = useAppStore((s) => s.realm);
  const selectedAccount = useAppStore((s) => s.selectedAccount);
  const hashSeed = useMemo(
    () => ({
      realm: realm ?? "",
      account: selectedAccount === "Show All" ? "" : selectedAccount,
    }),
    [realm, selectedAccount],
  );

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(DEV_ENDPOINTS[0].id);
  const [valuesByEndpoint, setValuesByEndpoint] = useState<
    Record<string, Record<string, string>>
  >({});
  const [responseByEndpoint, setResponseByEndpoint] = useState<
    Record<string, ResponseState>
  >({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [ctx, setCtx] = useState<AutofillContext | null>(null);
  const initializedRef = useRef<Set<string>>(new Set());

  const selected = useMemo(() => byId(selectedId), [selectedId]);

  // Build the autofill context from a store + api.config snapshot (async: it
  // computes the gameaction hash via MD5).
  useEffect(() => {
    let cancelled = false;
    buildAutofillContext(api).then((next) => {
      if (!cancelled) setCtx(next);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  // Initialize a selected endpoint's values on first open. Endpoints with
  // autofill fields wait for the async context so they seed with real values;
  // this effect re-runs when the context resolves.
  useEffect(() => {
    if (initializedRef.current.has(selected.id)) return;
    const needsCtx = selected.fields.some((f) => f.autofill);
    if (needsCtx && !ctx) return;
    const initial = initialValuesFor(selected, ctx ?? EMPTY_CTX);
    initializedRef.current.add(selected.id);
    setValuesByEndpoint((prev) => ({ ...prev, [selected.id]: initial }));
  }, [selected, ctx]);

  const currentValues = valuesByEndpoint[selectedId] ?? {};

  const handleFieldChange = (name: string, value: string) => {
    setValuesByEndpoint((prev) => {
      const next = { ...(prev[selectedId] ?? {}), [name]: value };
      savePersistedValues(selected, next);
      return { ...prev, [selectedId]: next };
    });
  };

  const runEndpoint = useCallback(
    async (endpoint: DevEndpoint, values: Record<string, string>) => {
      setSendingId(endpoint.id);
      const start = performance.now();
      let status: CallStatus;
      let text: string;
      try {
        const result = await endpoint.invoke(api, values, {
          realm: hashSeed.realm,
          account: hashSeed.account,
        });
        status = statusOfResponse(result);
        text = formatResponse(result);
        if (status === "failed") toast.warning(`${endpoint.label} failed`);
        else toast.success(`${endpoint.label} succeeded`);
      } catch (error) {
        status = "error";
        text = error instanceof Error ? error.message : String(error);
        toast.error(`${endpoint.label} error: ${text}`);
      }
      const ms = Math.round(performance.now() - start);
      const responseState: ResponseState = { status, ms, text };
      setResponseByEndpoint((prev) => ({
        ...prev,
        [endpoint.id]: responseState,
      }));
      setHistory((prev) =>
        [
          {
            id: `${endpoint.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            endpointId: endpoint.id,
            label: endpoint.label,
            status,
            ms,
            at: Date.now(),
            values: withoutPasswords(endpoint, values),
            response: text,
          },
          ...prev,
        ].slice(0, HISTORY_CAP),
      );
      setSendingId(null);
    },
    [api, hashSeed],
  );

  const handleSend = () => {
    runEndpoint(selected, valuesByEndpoint[selectedId] ?? {});
  };

  const reviewHistory = (entry: HistoryEntry) => {
    initializedRef.current.add(entry.endpointId);
    setValuesByEndpoint((prev) => ({
      ...prev,
      [entry.endpointId]: { ...entry.values },
    }));
    setResponseByEndpoint((prev) => ({
      ...prev,
      [entry.endpointId]: {
        status: entry.status,
        ms: entry.ms,
        text: entry.response,
      },
    }));
    setSelectedId(entry.endpointId);
  };

  const runHistoryAgain = (entry: HistoryEntry) => {
    const endpoint = byId(entry.endpointId);
    reviewHistory(entry);
    if (endpoint.destructive) {
      // Never auto-fire a destructive call from history — load it into the form
      // and require the explicit Send -> Confirm gate.
      toast("Loaded — press Send to confirm this call.");
      return;
    }
    runEndpoint(endpoint, entry.values);
  };

  const statusDot: Record<CallStatus, string> = {
    success: "bg-lime-400",
    failed: "bg-amber-400",
    error: "bg-red-400",
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!hasSession && (
        <p className="border-gray-700 border-b bg-gray-800/60 px-4 py-1.5 text-amber-200 text-xs">
          Not logged in — session calls will fail, but local calls (md5,
          encrypt, decrypt, challenge) still work.
        </p>
      )}
      <div className="flex min-h-0 flex-1">
        <EndpointList
          selectedId={selectedId}
          onSelect={setSelectedId}
          search={search}
          onSearchChange={setSearch}
        />
        <EndpointPanel
          key={selectedId}
          api={api}
          endpoint={selected}
          values={currentValues}
          onFieldChange={handleFieldChange}
          onSend={handleSend}
          sending={sendingId === selectedId}
          response={responseByEndpoint[selectedId] ?? null}
          hasSession={hasSession}
          hashSeed={hashSeed}
        />
      </div>

      {/* History */}
      <Collapsible
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        className="border-gray-700 border-t bg-gray-900"
      >
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-gray-200 text-sm hover:bg-gray-800">
          <History className="h-4 w-4" />
          <span>History</span>
          <span className="text-gray-400 text-xs">({history.length})</span>
          <ChevronDown
            className={`ml-auto h-4 w-4 transition-transform ${historyOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-40 overflow-y-auto">
            <ul className="px-2 pb-2">
              {history.length === 0 && (
                <li className="px-2 py-2 text-gray-400 text-xs">
                  No calls yet.
                </li>
              )}
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-800"
                >
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${statusDot[entry.status]}`}
                  />
                  <button
                    type="button"
                    onClick={() => reviewHistory(entry)}
                    className="flex-1 truncate text-left text-gray-200"
                  >
                    <span className="font-medium">{entry.label}</span>
                    <span className="ml-2 text-gray-400 text-xs">
                      {entry.status} · {entry.ms} ms ·{" "}
                      {new Date(entry.at).toLocaleTimeString()}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => runHistoryAgain(entry)}
                    className="border-gray-600 text-gray-200"
                  >
                    <RotateCw className="mr-1 h-3.5 w-3.5" />
                    {byId(entry.endpointId).destructive ? "Load" : "Run again"}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
