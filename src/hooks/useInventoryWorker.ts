import type React from "react";
import { useEffect, useTransition } from "react";
import type { D2BotAPI } from "@/lib/D2Bot";
import { appendUniqueItems, type InventoryItem } from "@/lib/utils";
import {
  setFullyLoaded,
  setInventory,
  setLoadingInventory,
  useAppStore,
} from "@/stores/appStore";

interface UseInventoryWorkerOptions {
  api: D2BotAPI;
  accountsToLoad: string[];
  session: string | null;
  apiUrl: string;
  workerRef: React.RefObject<Worker | null>;
}

export function useInventoryWorker({
  api,
  accountsToLoad,
  session,
  apiUrl,
  workerRef,
}: UseInventoryWorkerOptions) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!session || accountsToLoad.length === 0) {
      setLoadingInventory(false);
      setFullyLoaded(true);
      return;
    }

    (async () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      const worker = new Worker(
        new URL("../workers/inventoryWorker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;

        if (msg.type === "account-items") {
          console.log(msg);

          const { selectedCharacter, realm, gameType, gameMode, gameClass } =
            useAppStore.getState();

          const currentFilters = {
            gameType,
            gameMode,
            gameClass,
            realm,
            selectedCharacter,
          };

          if (msg.items.length > 0) {
            const itemsByAccount = msg.items.reduce(
              (acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
                if (!acc[item.account]) acc[item.account] = [];
                acc[item.account].push(item);
                return acc;
              },
              {},
            );

            for (const [account, items] of Object.entries(itemsByAccount)) {
              useAppStore.setState((state) => {
                const cacheKey = `${account}:${realm}`;
                return {
                  inventoryCache: {
                    ...state.inventoryCache,
                    [cacheKey]: {
                      items: items as InventoryItem[],
                      timestamp: Date.now(),
                      filters: currentFilters,
                    },
                  },
                };
              });
            }
          }

          const prevInvo = useAppStore.getState().inventory;
          const newInvo = appendUniqueItems(prevInvo, msg.items);
          startTransition(() => {
            setInventory(newInvo);
          });

          if (prevInvo.length === 0) {
            setLoadingInventory(false);
          }
        } else if (msg.type === "done") {
          console.log(msg);
          setLoadingInventory(false);
          setFullyLoaded(true);
        } else if (msg.type === "error") {
          console.error(msg);
        } else if (msg.type === "started") {
          setFullyLoaded(false);
        }
      };

      const {
        accounts,
        selectedCharacter,
        realm,
        gameClass,
        gameType,
        gameMode,
        username,
        password,
      } = useAppStore.getState();

      worker.postMessage({
        type: "load-accounts",
        session: api.config.session,
        accounts: accountsToLoad,
        accountsMap: accounts,
        selectedCharacter,
        realm,
        gameClass,
        gameType,
        gameMode,
        apiUrl,
        username,
        password,
      });
    })();
  }, [api, accountsToLoad, session, apiUrl, workerRef]);
}
