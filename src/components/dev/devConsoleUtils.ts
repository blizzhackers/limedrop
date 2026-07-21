import type { D2BotAPI } from "@/lib/D2Bot";
import type { AutofillKey, DevEndpoint, DevField } from "@/lib/devApiRegistry";
import { useAppStore } from "@/stores/appStore";

const STORAGE_KEY = "limedrop:dev:inputs";
const SHOW_ALL = "Show All";

export type AutofillContext = Record<AutofillKey, string>;

export type CallStatus = "success" | "failed" | "error";

export interface HistoryEntry {
  id: string;
  endpointId: string;
  label: string;
  status: CallStatus;
  ms: number;
  at: number;
  /** Request values as sent (password fields already excluded). */
  values: Record<string, string>;
  /** Pretty-printed response text (never persisted to localStorage). */
  response: string;
}

/**
 * Build the auto-fill context from a snapshot of the app store + api.config.
 * `hash` is computed asynchronously via MD5(realm+account).
 */
export async function buildAutofillContext(
  api: D2BotAPI,
): Promise<AutofillContext> {
  const s = useAppStore.getState();
  const account = s.selectedAccount === SHOW_ALL ? "" : s.selectedAccount;
  const character = s.selectedCharacter === SHOW_ALL ? "" : s.selectedCharacter;
  const realm = s.realm ?? "";

  let hash = "";
  if (realm && account) {
    try {
      hash = await api.md5(realm.toLowerCase() + account.toLowerCase());
    } catch {
      hash = "";
    }
  }

  return {
    realm,
    account,
    character,
    username: s.username ?? api.config.username ?? "",
    session: s.session ?? api.config.session ?? "",
    password: "",
    apiUrl: s.apiUrl ?? api.config.host ?? "",
    gameName: s.gameName ?? "",
    hash,
  };
}

type PersistShape = Record<string, Record<string, string>>;

function readPersisted(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as PersistShape) : {};
  } catch {
    return {};
  }
}

/** Persisted values for a single endpoint (password fields are never stored). */
export function loadPersistedValues(
  endpointId: string,
): Record<string, string> {
  const all = readPersisted();
  return all[endpointId] ?? {};
}

/**
 * Persist an endpoint's current values, excluding any `type: "password"`
 * fields. Guards JSON/quota errors.
 */
export function savePersistedValues(
  endpoint: DevEndpoint,
  values: Record<string, string>,
): void {
  const safe: Record<string, string> = {};
  for (const field of endpoint.fields) {
    if (field.type === "password" || field.noPersist) continue;
    if (values[field.name] !== undefined) safe[field.name] = values[field.name];
  }
  try {
    const all = readPersisted();
    all[endpoint.id] = safe;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore quota / serialization errors — persistence is best-effort.
  }
}

/** Resolve one field's initial value: persisted -> autofill -> default -> "". */
function resolveFieldValue(
  field: DevField,
  persisted: Record<string, string>,
  ctx: AutofillContext,
): string {
  if (
    field.type !== "password" &&
    !field.noPersist &&
    persisted[field.name] !== undefined
  ) {
    return persisted[field.name];
  }
  if (field.autofill && ctx[field.autofill]) return ctx[field.autofill];
  return field.defaultValue ?? "";
}

/** Initial form values for an endpoint on open (per precedence rules). */
export function initialValuesFor(
  endpoint: DevEndpoint,
  ctx: AutofillContext,
): Record<string, string> {
  const persisted = loadPersistedValues(endpoint.id);
  const values: Record<string, string> = {};
  for (const field of endpoint.fields) {
    values[field.name] = resolveFieldValue(field, persisted, ctx);
  }
  return values;
}

/** Strip password field values so a request/history record never keeps them. */
export function withoutPasswords(
  endpoint: DevEndpoint,
  values: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of endpoint.fields) {
    out[field.name] =
      field.type === "password" ? "" : (values[field.name] ?? "");
  }
  return out;
}

/** Pretty-print any response (object, JSON string, string, boolean, void). */
export function formatResponse(value: unknown): string {
  if (value === undefined) return "(void)";
  if (value === null) return "null";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Classify a resolved response into a status pill category. */
export function statusOfResponse(value: unknown): CallStatus {
  // A bare `false` (e.g. validate on an invalid session) is a failed outcome.
  if (value === false) return "failed";
  if (
    value &&
    typeof value === "object" &&
    "status" in value &&
    (value as { status?: unknown }).status === "failed"
  ) {
    return "failed";
  }
  return "success";
}
