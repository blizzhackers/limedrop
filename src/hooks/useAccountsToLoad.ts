import type React from "react";
import { useEffect, useState, useTransition } from "react";
import { shallow } from "zustand/shallow";
import type { InventoryItem } from "@/lib/utils";
import { naturalSort } from "@/lib/utils";
import {
  setFullyLoaded,
  setInventory,
  setLoadingInventory,
  useAppStore,
} from "@/stores/appStore";

interface UseAccountsToLoadOptions {
  workerRef: React.RefObject<Worker | null>;
}

export function useAccountsToLoad({ workerRef }: UseAccountsToLoadOptions) {
  const [accountsToLoad, setAccountsToLoad] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (s) => [
        s.gameType,
        s.gameMode,
        s.gameClass,
        s.realm,
        s.selectedAccount,
        s.accountDataCache,
      ],
      ([
        gameType,
        gameMode,
        gameClass,
        realm,
        selectedAccount,
        accountDataCache,
      ]) => {
        if (typeof accountDataCache === "string") return;

        const checks = {
          ladder: gameClass === "Ladder",
          lod: gameType === "Expansion",
          sc: gameMode === "Softcore",
        };

        const validAccounts = accountDataCache
          .filter(
            (el) =>
              el.lod === checks.lod &&
              el.sc === checks.sc &&
              el.ladder === checks.ladder &&
              el.realm === realm &&
              (selectedAccount === "Show All" ||
                selectedAccount === el.accountName),
          )
          .map((el) => el.accountName)
          .sort(naturalSort);

        const accountSet = new Set(validAccounts);
        workerRef.current?.terminate();

        console.log("Determining accounts to load...", validAccounts);

        const { selectedCharacter, inventoryCache } = useAppStore.getState();
        const cachedItems: InventoryItem[] = [];
        const currentFilters = {
          gameType,
          gameMode,
          gameClass,
          realm,
          selectedCharacter,
        };

        for (const account of accountSet) {
          const cacheKey = `${account}:${realm}`;
          const cached = inventoryCache[cacheKey];

          const isCacheValid =
            cached &&
            Date.now() - cached.timestamp < 5 * 60 * 1000 &&
            JSON.stringify(cached.filters) === JSON.stringify(currentFilters);

          if (isCacheValid) {
            console.log(`Using cached data for ${account}`);
            accountSet.delete(account);
            cachedItems.push(...cached.items);
          } else {
            console.log(`Need to load data for ${account}`);
          }
        }

        if (cachedItems.length > 0) {
          startTransition(() => {
            setInventory(cachedItems);
          });
          setLoadingInventory(false);

          if (accountSet.size === 0) {
            setFullyLoaded(true);
            return;
          }
        } else {
          setLoadingInventory(true);
          setInventory([]);
        }

        setFullyLoaded(false);
        setAccountsToLoad(Array.from(accountSet));
      },
      { equalityFn: shallow },
    );

    return unsubscribe;
  }, [workerRef]);

  const resetAccountLoading = () => {
    const { selectedAccount, accounts } = useAppStore.getState();
    const accs =
      selectedAccount === "Show All"
        ? Object.keys(accounts).sort(naturalSort)
        : [selectedAccount];
    setAccountsToLoad(accs);
  };

  return { accountsToLoad, resetAccountLoading };
}
