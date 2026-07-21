import type { D2BotAPI } from "@/lib/D2Bot";

/**
 * Typed registry describing every public method of {@link D2BotAPI} (plus the
 * raw `$get` escape hatch) so the Dev API Console can render one form per
 * endpoint and invoke the real, correctly-typed method.
 *
 * This module is intentionally pure (no JSX) — it is the single source of
 * truth for which endpoints exist, what fields they take, and how form values
 * map onto the actual API call.
 */

export type DevFieldType = "text" | "password" | "textarea" | "select";

/**
 * Keys the UI can auto-fill a field from. The console builds an
 * `AutofillContext: Record<AutofillKey, string>` from a snapshot of the app
 * store + `api.config` and computes `hash` asynchronously.
 */
export type AutofillKey =
  | "realm"
  | "account"
  | "character"
  | "username"
  | "session"
  | "password"
  | "apiUrl"
  | "gameName"
  | "hash";

export interface DevField {
  name: string;
  label: string;
  type: DevFieldType;
  placeholder?: string;
  /** Only used when `type === "select"`; free text is still allowed. */
  options?: string[];
  autofill?: AutofillKey;
  defaultValue?: string;
  /** Never persist this field's value to localStorage (e.g. game passwords). */
  noPersist?: boolean;
}

export type DevCategory =
  | "Session"
  | "Accounts & Items"
  | "Game"
  | "Files"
  | "Profiles"
  | "Crypto"
  | "Utility"
  | "Raw";

/** Context passed to `invoke` for helpers such as hash generation. */
export interface DevInvokeContext {
  realm: string;
  account: string;
}

export interface DevEndpoint {
  id: string;
  /** The underlying `D2BotAPI` method name (or `$get`). */
  func: string;
  label: string;
  category: DevCategory;
  description: string;
  signature: string;
  /** Needs an authenticated session to do anything useful. */
  session?: boolean;
  /** Changes remote state / can trigger real in-game actions — needs confirm. */
  destructive?: boolean;
  /** Runs entirely client-side, no network round-trip. */
  local?: boolean;
  fields: DevField[];
  /**
   * Maps the current (string) form values onto a real, typed API call.
   * May throw (e.g. invalid JSON) — the caller surfaces the message.
   */
  invoke: (
    api: D2BotAPI,
    v: Record<string, string>,
    ctx: DevInvokeContext,
  ) => Promise<unknown>;
}

export const DEV_CATEGORIES: DevCategory[] = [
  "Session",
  "Accounts & Items",
  "Game",
  "Files",
  "Profiles",
  "Crypto",
  "Utility",
  "Raw",
];

/** Blank string -> `undefined` so optional password args fall back to the login password. */
const orUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value;

export const DEV_ENDPOINTS: DevEndpoint[] = [
  // ---------------------------------------------------------------- Session
  {
    id: "challenge",
    func: "challenge",
    label: "Challenge",
    category: "Session",
    description: "Request a login challenge from the server.",
    signature: "challenge()",
    fields: [],
    invoke: (api) => api.challenge(),
  },
  {
    id: "login",
    func: "login",
    label: "Login",
    category: "Session",
    description:
      "Authenticate and establish a session. Mutates api.config and returns the session string.",
    signature: "login(username, password, server): string",
    fields: [
      {
        name: "username",
        label: "Username",
        type: "text",
        autofill: "username",
      },
      { name: "password", label: "Password", type: "password" },
      { name: "server", label: "Server", type: "text", autofill: "apiUrl" },
    ],
    invoke: (api, v) => api.login(v.username, v.password, v.server),
  },
  {
    id: "validate",
    func: "validate",
    label: "Validate",
    category: "Session",
    description: "Check whether a username/session pair is still valid.",
    signature: "validate(username, session): boolean",
    session: true,
    fields: [
      {
        name: "username",
        label: "Username",
        type: "text",
        autofill: "username",
      },
      { name: "session", label: "Session", type: "text", autofill: "session" },
    ],
    invoke: (api, v) => api.validate(v.username, v.session),
  },
  {
    id: "initSessionData",
    func: "initSessionData",
    label: "Init Session Data",
    category: "Session",
    description:
      "Set the session and password on the API instance (local setter, no network).",
    signature: "initSessionData(session, password): void",
    local: true,
    fields: [
      { name: "session", label: "Session", type: "text", autofill: "session" },
      { name: "password", label: "Password", type: "password" },
    ],
    invoke: async (api, v) => {
      api.initSessionData(v.session, v.password);
      return "session/password set on API instance";
    },
  },

  // ------------------------------------------------------- Accounts & Items
  {
    id: "accounts",
    func: "accounts",
    label: "Accounts",
    category: "Accounts & Items",
    description: "List the accounts available to the session.",
    signature: "accounts()",
    session: true,
    fields: [],
    invoke: (api) => api.accounts(),
  },
  {
    id: "profiles",
    func: "profiles",
    label: "Profiles",
    category: "Accounts & Items",
    description: "List the bot profiles available to the session.",
    signature: "profiles()",
    session: true,
    fields: [],
    invoke: (api) => api.profiles(),
  },
  {
    id: "query",
    func: "query",
    label: "Query Items",
    category: "Accounts & Items",
    description:
      "Query mule inventory. Empty account/character are dropped before sending.",
    signature: "query(item?, realm?, account?, charname?)",
    session: true,
    fields: [
      {
        name: "item",
        label: "Item",
        type: "text",
        placeholder: "Item name (optional)",
      },
      { name: "realm", label: "Realm", type: "text", autofill: "realm" },
      { name: "account", label: "Account", type: "text", autofill: "account" },
      {
        name: "charname",
        label: "Character",
        type: "text",
        autofill: "character",
      },
    ],
    invoke: (api, v) => api.query(v.item, v.realm, v.account, v.charname),
  },
  {
    id: "poll",
    func: "poll",
    label: "Poll",
    category: "Accounts & Items",
    description: "Poll the server for queued events.",
    signature: "poll()",
    session: true,
    fields: [],
    invoke: (api) => api.poll(),
  },

  // ------------------------------------------------------------------- Game
  {
    id: "gameaction",
    func: "gameaction",
    label: "Game Action",
    category: "Game",
    description:
      "Trigger an in-game action (e.g. doDrop). Can drop real items — confirm before sending.",
    signature: "gameaction(data)",
    session: true,
    destructive: true,
    fields: [
      {
        name: "hash",
        label: "Hash",
        type: "text",
        autofill: "hash",
        placeholder: "MD5(realm+account)",
      },
      { name: "profile", label: "Profile", type: "text", autofill: "username" },
      {
        name: "action",
        label: "Action",
        type: "select",
        options: ["doDrop"],
        defaultValue: "doDrop",
      },
      {
        name: "gameName",
        label: "Game Name",
        type: "text",
        autofill: "gameName",
      },
      {
        name: "gamePass",
        label: "Game Password",
        type: "text",
        placeholder: "Optional",
        noPersist: true,
      },
      {
        name: "customData",
        label: "Custom Data (JSON)",
        type: "textarea",
        defaultValue: '{"items": []}',
      },
    ],
    invoke: (api, v) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(v.customData || "{}");
      } catch {
        throw new Error("Invalid JSON in custom data");
      }
      const data = {
        hash: v.hash,
        profile: v.profile,
        action: v.action,
        data: JSON.stringify({
          gameName: v.gameName,
          gamePass: v.gamePass,
          ...parsed,
        }),
      };
      return api.gameaction(data);
    },
  },

  // ------------------------------------------------------------------ Files
  {
    id: "put",
    func: "put",
    label: "Put File",
    category: "Files",
    description: "Encrypt and upload a file to the server.",
    signature: "put(folder, file, data, pw)",
    session: true,
    destructive: true,
    fields: [
      { name: "folder", label: "Folder", type: "text" },
      { name: "file", label: "File", type: "text" },
      { name: "data", label: "Data", type: "textarea" },
      { name: "password", label: "Password", type: "password" },
    ],
    invoke: (api, v) => api.put(v.folder, v.file, v.data, v.password),
  },
  {
    id: "get",
    func: "get",
    label: "Get File",
    category: "Files",
    description: "Fetch a file from the server by path.",
    signature: "get(filePath)",
    session: true,
    fields: [{ name: "filePath", label: "File Path", type: "text" }],
    invoke: (api, v) => api.get(v.filePath),
  },

  // --------------------------------------------------------------- Profiles
  {
    id: "start",
    func: "start",
    label: "Start Profile",
    category: "Profiles",
    description: "Start a bot profile.",
    signature: "start(profile, tag)",
    session: true,
    destructive: true,
    fields: [
      { name: "profile", label: "Profile", type: "text", autofill: "username" },
      { name: "tag", label: "Tag", type: "text" },
    ],
    invoke: (api, v) => api.start(v.profile, v.tag),
  },
  {
    id: "stop",
    func: "stop",
    label: "Stop Profile",
    category: "Profiles",
    description: "Stop a running bot profile.",
    signature: "stop(profile)",
    session: true,
    destructive: true,
    fields: [
      { name: "profile", label: "Profile", type: "text", autofill: "username" },
    ],
    invoke: (api, v) => api.stop(v.profile),
  },
  {
    id: "setTag",
    func: "setTag",
    label: "Set Tag",
    category: "Profiles",
    description: "Set the tag on a bot profile.",
    signature: "setTag(profile, tag)",
    session: true,
    destructive: true,
    fields: [
      { name: "profile", label: "Profile", type: "text", autofill: "username" },
      { name: "tag", label: "Tag", type: "text" },
    ],
    invoke: (api, v) => api.setTag(v.profile, v.tag),
  },

  // ----------------------------------------------------------------- Crypto
  {
    id: "encrypt",
    func: "encrypt",
    label: "Encrypt",
    category: "Crypto",
    description:
      "Encrypt a message. Leave password blank to use the login password.",
    signature: "encrypt(msg, pass?): string",
    local: true,
    fields: [
      { name: "message", label: "Message", type: "textarea" },
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Optional",
      },
    ],
    invoke: (api, v) => api.encrypt(v.message, orUndefined(v.password)),
  },
  {
    id: "decrypt",
    func: "decrypt",
    label: "Decrypt",
    category: "Crypto",
    description:
      "Decrypt a message. Leave password blank to use the login password.",
    signature: "decrypt(transitmessage, pass?): string",
    local: true,
    fields: [
      {
        name: "encryptedMessage",
        label: "Encrypted Message",
        type: "textarea",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Optional",
      },
    ],
    invoke: (api, v) =>
      api.decrypt(v.encryptedMessage, orUndefined(v.password)),
  },

  // ---------------------------------------------------------------- Utility
  {
    id: "md5",
    func: "md5",
    label: "MD5",
    category: "Utility",
    description: "Compute an MD5 hash of the given text.",
    signature: "md5(data): string",
    local: true,
    fields: [{ name: "data", label: "Data", type: "text" }],
    invoke: (api, v) => api.md5(v.data),
  },
  {
    id: "registerEvent",
    func: "registerEvent",
    label: "Register Event",
    category: "Utility",
    description:
      "Register a server-side event listener. The API host is appended automatically.",
    signature: "registerEvent(type)",
    session: true,
    fields: [
      { name: "type", label: "Type", type: "text", defaultValue: "ItemAction" },
    ],
    invoke: (api, v) => api.registerEvent(v.type),
  },
  {
    id: "PING",
    func: "PING",
    label: "PING",
    category: "Utility",
    description: "Ping the server.",
    signature: "PING()",
    fields: [],
    invoke: (api) => api.PING(),
  },

  // -------------------------------------------------------------------- Raw
  {
    id: "$get",
    func: "$get",
    label: "Raw $get",
    category: "Raw",
    description:
      "Send a raw request object to the API. Advanced — you control func/args directly.",
    signature: "$get({ func, args, profile?, session? })",
    fields: [
      { name: "func", label: "Func", type: "text" },
      {
        name: "args",
        label: "Args (JSON array)",
        type: "textarea",
        defaultValue: "[]",
      },
      {
        name: "profile",
        label: "Profile",
        type: "text",
        placeholder: "Optional",
      },
      {
        name: "session",
        label: "Session",
        type: "text",
        autofill: "session",
        placeholder: "Optional",
      },
    ],
    invoke: (api, v) => {
      let args: unknown[];
      try {
        const parsed = JSON.parse(v.args || "[]");
        if (!Array.isArray(parsed))
          throw new Error("Args must be a JSON array");
        args = parsed;
      } catch (error) {
        throw error instanceof Error &&
          error.message === "Args must be a JSON array"
          ? error
          : new Error("Invalid JSON in args");
      }
      return api.$get({
        func: v.func,
        args,
        ...(v.profile ? { profile: v.profile } : {}),
        ...(v.session ? { session: v.session } : {}),
      });
    },
  },
];
