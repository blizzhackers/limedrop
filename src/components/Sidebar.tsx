import {
  ChevronLeft,
  ChevronRight,
  MenuIcon,
  RefreshCw,
  XIcon,
} from "lucide-react";
import type React from "react";
import { memo, useMemo, useState } from "react";
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
  type GameRealm,
  naturalSort,
  REALMS,
} from "@/lib/utils";
import {
  setGameClass,
  setGameMode,
  setGameType,
  setSelectedAccount,
  setSelectedCharacter,
  useAppStore,
} from "@/stores/appStore";
import { Button } from "./ui/button";
import { DialogTitle } from "./ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader } from "./ui/drawer";

interface SidebarProps {
  session: string | null;
  loadingAccounts: boolean;
  fetchAccounts: (session: string) => void;
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
    const [collapsed, setCollapsed] = useState(false);

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

    const handleRealmChange = async (realm: GameRealm) => {
      useAppStore.setState({
        realm,
        selectedAccount: "Show All",
        selectedCharacter: "Show All",
      });

      if (session) {
        fetchAccounts(session);
      }
    };

    const collapsedContent = (
      <>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-gray-400">Type</div>
          <div className="text-sm font-bold text-lime-400">
            {gameType === "Expansion" ? "LoD" : "Classic"}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-gray-400">Mode</div>
          <div className="text-sm font-bold text-lime-400">
            {gameMode === "Softcore" ? "SC" : "HC"}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-gray-400">Class</div>
          <div className="text-sm font-bold text-lime-400">
            {gameClass === "Ladder" ? "Ladder" : "Non-L"}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-gray-400">Realm</div>
          <div className="text-sm font-bold text-lime-400">{realm}</div>
        </div>
        {session && (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-gray-400">Acct</div>
              <div
                className="text-sm font-bold text-lime-400 truncate max-w-full"
                title={selectedAccount}
              >
                {selectedAccount === "Show All" ? "All" : selectedAccount}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-gray-400">Char</div>
              <div
                className="text-sm font-bold text-lime-400 truncate max-w-full"
                title={selectedCharacter}
              >
                {selectedCharacter === "Show All" ? "All" : selectedCharacter}
              </div>
            </div>
          </>
        )}
      </>
    );

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
          <Select
            value={realm}
            onValueChange={(v) => handleRealmChange(v as GameRealm)}
          >
            <SelectTrigger className="w-full bg-gray-900 border border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border border-gray-700 text-white">
              {REALMS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

    const isDemo = useAppStore(
      (s) => s.username === "demo" && s.session !== null,
    );

    return (
      <>
        <Button
          className={`md:hidden fixed left-2 z-40 bg-gray-900 text-white rounded p-2 shadow-lg focus:outline-none transition-[top] duration-150 ${isDemo ? "top-10" : "top-3"}`}
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          size="icon"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        <aside
          className={`hidden md:flex bg-gray-800 p-4 flex-col gap-4 min-h-0 min-w-0 transition-all duration-500 ease-in-out relative overflow-hidden ${collapsed ? "w-20" : "w-64"}`}
        >
          <Button
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 z-10"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <div
            className={`flex flex-col gap-6 mt-8 items-center overflow-y-auto transition-opacity duration-300 ease-in-out absolute inset-x-0 top-0 pt-12 px-2 ${collapsed ? "opacity-100 delay-200 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          >
            {collapsedContent}
          </div>

          <div
            className={`flex flex-col gap-4 transition-opacity duration-300 ease-in-out ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100 delay-200 pointer-events-auto"}`}
          >
            {sidebarContent}
          </div>
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
