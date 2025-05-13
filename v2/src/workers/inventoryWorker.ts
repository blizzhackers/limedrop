// Web Worker for background inventory loading
import { type InventoryItem, extractItemInfo } from "@/lib/utils";
import { D2BotAPI } from "@/lib/D2Bot";

// Message types
interface LoadAccountsMessage {
  type: "load-accounts";
  accounts: string[];
  accountsMap: Record<string, string[]>;
  selectedCharacter: string;
  realm: string;
  gameClass: string;
  gameType: string;
  gameMode: string;
  apiUrl: string;
  session: string;
  username: string;
  password: string; // Accept password from main thread
}

interface ApiItemResponse {
  lod: boolean;
  sc: boolean;
  ladder: boolean;
  account: string;
  character: string;
  description: string;
  image: string;
}

// Helper to fetch items for an account using D2BotAPI
async function fetchAccountItems(
  api: D2BotAPI,
  realm: string,
  acc: string,
  charList: string[],
  gameClass: string,
  gameType: string,
  gameMode: string,
): Promise<InventoryItem[]> {
  const checks = {
    ladder: gameClass === "Ladder",
    lod: gameType === "Expansion",
    sc: gameMode === "Softcore",
  };
  let allResults: ApiItemResponse[] = [];
  for (const charname of charList) {
    const resp = await api.query("", realm, acc, charname);
    if (Array.isArray(resp)) {
      allResults = allResults.concat(resp);
    } else if (resp && resp.status === "failed" && resp.body === "invalid session") {
      throw new Error("invalid session");
    }
  }
  return allResults
    .filter(
      (item) =>
        item.ladder === checks.ladder &&
        item.lod === checks.lod &&
        item.sc === checks.sc,
    )
    .map((el) => {
      const [desc, id] = el.description.split("$");
      const { quality, classid } = extractItemInfo(id, desc);
      return {
        ...el,
        title: desc.split("\n")[0],
        description: desc,
        itemid: id,
        realm: realm.toLowerCase(),
        quality,
        classid,
      };
    });
}

self.onmessage = async (e: MessageEvent) => {
  self.postMessage("started");
  const msg = e.data as LoadAccountsMessage;
  if (msg.type === "load-accounts") {
    const {
      accounts,
      accountsMap,
      selectedCharacter,
      realm,
      gameClass,
      gameType,
      gameMode,
      apiUrl,
      session,
      username,
      password, // Get password
    } = msg;
    // Create D2BotAPI instance in worker
    const api = new D2BotAPI();
    api.config.host = apiUrl;
    api.config.username = username;
    api.initSessionData(session, password);
    // Set password for encryption/renewal
    for (const acc of accounts) {
      let charList: string[] = [];
      if (selectedCharacter === "Show All") {
        charList = accountsMap[acc] || [];
      } else {
        charList = [selectedCharacter];
      }
      try {
        const items = await fetchAccountItems(
          api,
          realm,
          acc,
          charList,
          gameClass,
          gameType,
          gameMode,
        );
        // Post items for this account
        self.postMessage({ type: "account-items", account: acc, items });
      } catch (err) {
        self.postMessage({ type: "error", account: acc, error: String(err) });
      }
    }
    self.postMessage({ type: "done" });
  }
};
