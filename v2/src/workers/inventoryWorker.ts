import { D2BotAPI } from "@/lib/D2Bot";
import { type InventoryItem, mapApiItemToInventoryItem } from "@/lib/utils";

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
  password: string;
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
    } else if (
      resp &&
      resp.status === "failed" &&
      resp.body === "invalid session"
    ) {
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
    .map((el) => mapApiItemToInventoryItem(el, realm));
}

self.onmessage = async (e: MessageEvent) => {
  self.postMessage({ type: "started" });

  const msg = e.data as LoadAccountsMessage;

  if (msg.type === "load-accounts") {
    const {
      accounts,
      selectedCharacter,
      realm,
      gameClass,
      gameType,
      gameMode,
      apiUrl,
      session,
      username,
      password,
    } = msg;

    if (
      !session ||
      !username ||
      !password ||
      !apiUrl ||
      !realm ||
      !accounts.length ||
      !gameClass ||
      !gameType ||
      !gameMode
    ) {
      self.postMessage({ type: "error", error: "Missing required parameters" });
      return;
    }

    const api = new D2BotAPI();
    api.config.host = apiUrl;
    api.config.username = username;
    api.initSessionData(session, password);

    for (const acc of accounts) {
      let charList: string[] = [];
      if (selectedCharacter === "Show All") {
        charList = [""];
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
        self.postMessage({ type: "account-items", account: acc, items });
      } catch (err) {
        self.postMessage({ type: "error", account: acc, error: String(err) });
      }
    }
    self.postMessage({ type: "done" });
  }
};
