import MD5 from "crypto-js/md5";

declare global {
  interface Window {
    API: D2BotAPI;
  }
}

interface ApiRequestObject {
  func: string;
  args: unknown[];
  profile?: string;
  session?: string;
  _count?: number;
  [key: string]: unknown; // For any additional dynamic properties
}

export type ApiResponse = { request: string; status: string; body: string };

export interface ApiItemResponse {
  lod: boolean;
  sc: boolean;
  ladder: boolean;
  account: string;
  character: string;
  description: string;
  image: string;
}

interface GameActionData {
  hash: string;
  [key: string]: unknown;
}

export interface D2BotConfig {
  host: string;
  username: string;
  session?: string;
}

export class D2BotAPI {
  config: D2BotConfig = {
    host: "http://localhost:8080",
    username: "public",
  };

  private password?: string;

  constructor() {
    // Only set window.API if window is defined (main thread)
    if (typeof window !== "undefined") {
      window.API = this;
    }
    // Do not set session from localStorage unless password is also available
    // This prevents sending 'null' or stale sessions to the server
    this.password = undefined;
    this.config.session = undefined;
  }

  private async makePostRequest(data: string): Promise<string> {
    const response = await fetch(`${this.config.host}/api`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: data,
    });
    if (!response.ok) throw new Error("Network error");
    return response.text();
  }

  private base64encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }
  private base64decode(str: string): string {
    return decodeURIComponent(escape(atob(str)));
  }

  async $get(requestObject: ApiRequestObject): Promise<ApiResponse> {
    // Track call count for extreme cases
    requestObject._count = requestObject._count || 0;

    // Safety measure to prevent infinite loops
    if (requestObject._count >= 3) {
      throw new Error("Failed after 3 attempts");
    }

    // Set required fields
    if (!requestObject.profile) requestObject.profile = this.config.username;
    if (!requestObject.session || requestObject.session === "null") {
      requestObject.session = this.config.session || "null";
    }

    // Format the request - keep this simple like the original code
    const thejson = JSON.stringify(requestObject);
    const Base64blob = this.base64encode(thejson);

    try {
      const result = await this.makePostRequest(Base64blob);
      const decoded = this.base64decode(result);

      if (!decoded) throw new Error("Unknown Server response");

      const response = JSON.parse(decoded);

      // Only retry once and only for invalid session errors
      if (
        response.status === "failed" &&
        response.body === "invalid session" &&
        requestObject._count < 1
      ) {
        requestObject._count++;

        // Log the retry attempt
        console.log(
          `Session invalid, simple retry attempt ${requestObject._count}`,
        );

        // Original JS doesn't handle invalid sessions with any retry logic
        // It just returns the error. We'll do one retry in case it helps.
        return this.$get(requestObject);
      }

      return response;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  initSessionData(session: string, password: string) {
    this.password = password;
    this.config.session = session;
  }

  async login(
    username: string,
    password: string,
    server: string,
  ): Promise<string> {
    this.config.username = username;
    this.config.host = server;
    this.password = password; // Store password for encryption/decryption
    this.config.session = undefined;

    // Get challenge, matching the original JS code flow
    const msg = await this.challenge();
    console.debug(JSON.stringify(msg, null, 2));
    if (msg.status !== "success") {
      this.password = undefined;
      this.config.session = undefined;
      throw new Error(msg.body);
    }

    // Generate session from challenge using the password
    const sessionValue = await this.encrypt(msg.body, password);
    this.config.session = sessionValue;

    console.log("Login successful, session established");
    return sessionValue;
  }

  async challenge() {
    return this.$get({ func: "challenge", args: [""] });
  }

  // --- CryptoJS-compatible helpers ---
  private hexToBase64(str: string): string {
    // JS: btoa(String.fromCharCode.apply(null, ...))
    const bytes =
      str.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [];
    const bin = String.fromCharCode(...bytes);
    return btoa(bin);
  }
  private base64ToHex(str: string): string {
    const bin = atob(str.replace(/[ \r\n]+$/, ""));
    let hex = "";
    for (let i = 0; i < bin.length; ++i) {
      let tmp = bin.charCodeAt(i).toString(16);
      if (tmp.length === 1) tmp = "0" + tmp;
      hex += tmp;
    }
    return hex;
  }

  // --- CryptoJS-compatible encrypt ---
  async encrypt(msg: string, pass?: string): Promise<string> {
    pass = pass || this.password;
    if (!pass) throw new Error("No password available for encryption");
    const enc = new TextEncoder();
    // Use global crypto (window or self)
    const globalCrypto = (typeof window !== "undefined" ? window : self).crypto;
    // CryptoJS: salt 32 bytes, iv 16 bytes
    const salt = globalCrypto.getRandomValues(new Uint8Array(32));
    const iv = globalCrypto.getRandomValues(new Uint8Array(16));
    // PBKDF2-SHA1, 1000 iterations, 32-byte key
    const keyMaterial = await globalCrypto.subtle.importKey(
      "raw",
      enc.encode(pass),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );
    const key = await globalCrypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 1000,
        hash: "SHA-1",
      },
      keyMaterial,
      { name: "AES-CBC", length: 256 },
      false,
      ["encrypt"],
    );
    const encrypted = await globalCrypto.subtle.encrypt(
      { name: "AES-CBC", iv: iv },
      key,
      enc.encode(msg),
    );
    // CryptoJS: encryptedHex = base64ToHex(encrypted.toString())
    // encrypted.toString() is base64, so we need to get base64 from encrypted, then to hex
    const encryptedBase64 = btoa(
      String.fromCharCode(...new Uint8Array(encrypted)),
    );
    const encryptedHex = this.base64ToHex(encryptedBase64);
    // salt (hex, 64) + iv (hex, 32) + encryptedHex
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const fullHex = saltHex + ivHex + encryptedHex;
    // hexToBase64
    return this.hexToBase64(fullHex);
  }

  // --- CryptoJS-compatible decrypt ---
  async decrypt(transitmessage: string, pass?: string): Promise<string> {
    pass = pass || this.password;
    if (!pass) throw new Error("No password available for decryption");
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    // Use global crypto (window or self)
    const globalCrypto = (typeof window !== "undefined" ? window : self).crypto;
    // base64ToHex
    const hexResult = this.base64ToHex(transitmessage);
    // salt: first 64 hex chars (32 bytes), iv: next 32 hex chars (16 bytes)
    const saltHex = hexResult.substr(0, 64);
    const ivHex = hexResult.substr(64, 32);
    const encryptedHex = hexResult.substring(96);
    // parse hex to Uint8Array
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map((b) => Number.parseInt(b, 16)),
    );
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map((b) => Number.parseInt(b, 16)),
    );
    // encryptedHex is hex, convert to base64, then to Uint8Array
    const encryptedBase64 = this.hexToBase64(encryptedHex);
    const encryptedBytes = new Uint8Array(
      atob(encryptedBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    // PBKDF2-SHA1, 1000 iterations, 32-byte key
    const keyMaterial = await globalCrypto.subtle.importKey(
      "raw",
      enc.encode(pass),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );
    const key = await globalCrypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 1000,
        hash: "SHA-1",
      },
      keyMaterial,
      { name: "AES-CBC", length: 256 },
      false,
      ["decrypt"],
    );
    const decrypted = await globalCrypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv },
      key,
      encryptedBytes,
    );
    return dec.decode(decrypted);
  }

  async accounts() {
    // const args = [];
    // if (account) args.push(account);

    try {
      const response = await this.$get({ func: "accounts", args: [] });

      console.debug(JSON.stringify(response, null, 2));
      if (response.status === "success") {
        return { ...response, body: JSON.parse(response.body) as string[] };
      }
      return response;
    } catch (error: unknown) {
      throw new Error(
        `Failed to fetch accounts: ${(error as Error).message || error}`,
      );
    }
  }

  async profiles() {
    try {
      const response = await this.$get({ func: "profiles", args: [] });

      if (response.status === "success") {
        return { ...response, body: JSON.parse(response.body) as string[] };
      }
      return response;
    } catch (error: unknown) {
      throw new Error(
        `Failed to fetch profiles: ${(error as Error).message || error}`,
      );
    }
  }

  async query(
    item?: string,
    realm?: string,
    account?: string,
    charname?: string,
  ) {
    const args = [
      item || "",
      realm || "",
      account || null,
      charname || null,
    ].filter((el) => el !== null);
    try {
      const response = await this.$get({ func: "query", args });

      if (response.status === "success") {
        // Parse response body as JSON
        return JSON.parse(response.body) as ApiItemResponse[];
      }

      // If the request failed, return the error response
      return response;
    } catch (error: unknown) {
      throw new Error(
        `Failed to query items: ${(error as Error).message || error}`,
      );
    }
  }

  async poll() {
    try {
      const response = await this.$get({ func: "poll", args: [] });
      console.debug(JSON.stringify(response, null, 2));
      if (response.status === "success") {
        if (response.body === "empty") {
          // Return empty response object
          return { status: "success", body: "empty" };
        }
        return { ...response, body: JSON.parse(response.body) as JSON };
      }
      return response;
    } catch (error: unknown) {
      throw new Error(`Poll failed: ${(error as Error).message || error}`);
    }
  }

  async gameaction(data: GameActionData) {
    return this.$get({
      func: "gameaction",
      args: [data.hash, JSON.stringify(data)],
    });
  }

  async validate(username: string, session: string): Promise<boolean> {
    this.config.username = username;
    this.config.session = session;

    try {
      // In the original JS, this would simply make a request and check the response status
      const msg = await this.$get({ func: "validate", args: [] });
      return msg.status === "success";
    } catch (error) {
      console.error("Validation error:", error);
      this.password = undefined;
      this.config.session = undefined;
      return false;
    }
  }

  async put(folder: string, file: string, data: string, pw: string) {
    const encrypted = await this.encrypt(data, pw);
    return this.$get({ func: "put", args: [folder, file, encrypted] });
  }

  async get(filePath: string) {
    return this.$get({ func: "get", args: [filePath] });
  }

  async start(profile: string, tag: string) {
    return this.$get({ func: "start", args: [profile, tag] });
  }

  async stop(profile: string) {
    return this.$get({ func: "stop", args: [profile] });
  }

  async setTag(profile: string, tag: string) {
    return this.$get({ func: "setTag", args: [profile, tag] });
  }

  async registerEvent(type: string) {
    const args = [type, this.config.host + "/api"];
    return this.$get({ func: "registerEvent", args });
  }

  async PING() {
    return this.$get({ func: "PING", args: [] });
  }

  async md5(data: string): Promise<string> {
    // Use the npm crypto-js package for MD5
    return MD5(data).toString();
  }
}
