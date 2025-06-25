import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GAME_CLASSES,
  GAME_MODES,
  GAME_TYPES,
  REALMS,
  naturalSort,
} from "@/lib/utils";
import {
  setGameClass,
  setGameMode,
  setGameType,
  setSelectedAccount,
  setSelectedCharacter,
  useAppStore,
} from "@/stores/appStore";
import { MenuIcon, RefreshCw, XIcon } from "lucide-react";
import type React from "react";
import { memo, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { DialogTitle } from "./ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader } from "./ui/drawer";

interface SidebarProps {
  session: string | null;
  loadingAccounts: boolean;
  fetchAccounts: (session: string) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = memo(
  ({ session, loadingAccounts, fetchAccounts }) => {
    const realm = useAppStore((s) => s.realm);
    const gameType = useAppStore((s) => s.gameType);
    const gameMode = useAppStore((s) => s.gameMode);
    const gameClass = useAppStore((s) => s.gameClass);
    const selectedAccount = useAppStore((s) => s.selectedAccount);
    const selectedCharacter = useAppStore((s) => s.selectedCharacter);
    const accountsCache = useAppStore((s) => s.accountDataCache);
    const [mobileOpen, setMobileOpen] = useState(false);

    const filteredAccounts = useMemo(() => {
      const checks = {
        ladder: gameClass === "Ladder",
        lod: gameType === "Expansion",
        sc: gameMode === "Softcore",
      };

      return accountsCache.filter(
        (el) =>
          el.lod === checks.lod &&
          el.sc === checks.sc &&
          el.ladder === checks.ladder,
      );
    }, [gameType, gameMode, gameClass, accountsCache]);

    const visibleAccounts = useMemo(() => {
      const accountSet: Set<string> = new Set();

      for (const acc of filteredAccounts) {
        accountSet.add(acc.accountName);
      }

      return Array.from(accountSet).sort(naturalSort);
    }, [filteredAccounts]);

    const visibleCharacters = useMemo(() => {
      return filteredAccounts
        .filter((el) => el.accountName === selectedAccount)
        .map((el) => el.charName)
        .sort(naturalSort);
    }, [filteredAccounts, selectedAccount]);

    const handleRealmChange = async (realm: string) => {
      useAppStore.setState({
        realm,
        selectedAccount: "Show All",
        selectedCharacter: "Show All",
      });

      if (session) {
        await fetchAccounts(session);
      }
    };

    const sidebarContent = (
      <>
        <div>
          <div className="font-semibold mb-2">Game Type</div>
          <RadioGroup
            value={gameType}
            onValueChange={setGameType}
            className="flex flex-row gap-2"
          >
            {GAME_TYPES.map((type) => (
              <label
                key={type}
                htmlFor={type}
                className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded transition-colors ${gameType === type ? "bg-lime-500 text-black font-bold shadow" : "bg-gray-700 text-white hover:bg-lime-700/40"}`}
              >
                <RadioGroupItem value={type} id={type} className="hidden" />
                <span>{type}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div>
          <div className="font-semibold mb-2">Game Mode</div>
          <RadioGroup
            value={gameMode}
            onValueChange={setGameMode}
            className="flex flex-row gap-2"
          >
            {GAME_MODES.map((mode) => (
              <label
                key={mode}
                htmlFor={mode}
                className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded transition-colors ${gameMode === mode ? "bg-lime-500 text-black font-bold shadow" : "bg-gray-700 text-white hover:bg-lime-700/40"}`}
              >
                <RadioGroupItem id={mode} value={mode} className="hidden" />
                <span>{mode}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div>
          <div className="font-semibold mb-2">Game Class</div>
          <RadioGroup
            value={gameClass}
            onValueChange={setGameClass}
            className="flex flex-row gap-2"
          >
            {GAME_CLASSES.map((cls) => (
              <label
                key={cls}
                htmlFor={cls}
                className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded transition-colors ${gameClass === cls ? "bg-lime-500 text-black font-bold shadow" : "bg-gray-700 text-white hover:bg-lime-700/40"}`}
              >
                <RadioGroupItem id={cls} value={cls} className="hidden" />
                <span>{cls}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div>
          <div className="font-semibold mb-2">Realm</div>
          <select
            className="w-full p-2 rounded bg-gray-900 border border-gray-700"
            value={realm}
            onChange={(e) => handleRealmChange(e.target.value)}
          >
            {REALMS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {session && (
          <>
            <div>
              <div className="font-semibold mb-2 flex justify-between items-center">
                <span>Account</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:text-lime-500"
                  onClick={() => fetchAccounts(session)}
                >
                  <RefreshCw />
                </Button>
              </div>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
                disabled={loadingAccounts}
              >
                <SelectTrigger className="w-full bg-gray-900 border border-gray-700 text-white">
                  <SelectValue
                    placeholder={loadingAccounts ? "Loading..." : "Show All"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border border-gray-700 text-white">
                  <SelectItem value="Show All">Show All</SelectItem>
                  {visibleAccounts.map((accountName) => (
                    <SelectItem key={accountName} value={accountName}>
                      {accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="font-semibold mb-2">Character</div>
              <Select
                value={selectedCharacter}
                onValueChange={setSelectedCharacter}
                disabled={loadingAccounts}
              >
                <SelectTrigger className="w-full bg-gray-900 border border-gray-700 text-white">
                  <SelectValue
                    placeholder={loadingAccounts ? "Loading..." : "Show All"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border border-gray-700 text-white">
                  <SelectItem value="Show All">Show All</SelectItem>
                  {selectedAccount !== "Show All" &&
                    visibleCharacters.map((character) => (
                      <SelectItem key={character} value={character}>
                        {character}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </>
    );

    return (
      <>
        <Button
          className="md:hidden fixed top-3 left-2 z-40 bg-gray-900 text-white rounded p-2 shadow-lg focus:outline-none"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          size="icon"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        <aside className="hidden md:flex w-64 bg-gray-800 p-4 flex-col gap-4 min-h-0 min-w-0">
          {sidebarContent}
        </aside>

        <Drawer direction="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerContent className="bg-gray-800 p-4 text-white flex flex-col gap-4">
            <DrawerHeader className="absolute top-0 right-0">
              <DialogTitle className="hidden">Sidebar</DialogTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close sidebar">
                  <XIcon className="h-5 w-5 text-white" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            {sidebarContent}
          </DrawerContent>
        </Drawer>
      </>
    );
  },
);
