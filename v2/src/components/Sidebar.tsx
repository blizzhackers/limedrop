import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  setGameClass,
  setGameMode,
  setGameType,
  setRealm,
} from "@/stores/useAppStore";
import { RefreshCw } from "lucide-react";
import type React from "react";
import { Button } from "./ui/button";

const REALMS = ["USEast", "USWest", "Europe", "Asia"];
const GAME_TYPES = ["Expansion", "Classic"];
const GAME_MODES = ["Softcore", "Hardcore"];
const GAME_CLASSES = ["Ladder", "NonLadder"];

interface SidebarProps {
  realm: string;
  gameType: string;
  gameMode: string;
  gameClass: string;
  session: string | null;
  loadingAccounts: boolean;
  accounts: Record<string, string[]>;
  selectedAccount: string;
  setSelectedAccount: (v: string) => void;
  selectedCharacter: string;
  setSelectedCharacter: (v: string) => void;
  fetchAccounts: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  realm,
  gameType,
  gameMode,
  gameClass,
  session,
  accounts,
  selectedAccount,
  setSelectedAccount,
  selectedCharacter,
  setSelectedCharacter,
  loadingAccounts,
  fetchAccounts,
}) => (
  <aside className="w-64 bg-gray-800 p-4 flex flex-col gap-4">
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
            className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded transition-colors ${gameMode === mode ? "bg-lime-500 text-black font-bold shadow" : "bg-gray-700 text-white hover:bg-lime-700/40"}`}
          >
            <RadioGroupItem value={mode} className="hidden" />
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
            className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded transition-colors ${gameClass === cls ? "bg-lime-500 text-black font-bold shadow" : "bg-gray-700 text-white hover:bg-lime-700/40"}`}
          >
            <RadioGroupItem value={cls} className="hidden" />
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
        onChange={(e) => setRealm(e.target.value)}
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
              className="h-5 w-5"
              onClick={fetchAccounts}
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
              {Object.keys(accounts).map((account) => (
                <SelectItem key={account} value={account}>
                  {account}
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
                accounts[selectedAccount]?.map((character) => (
                  <SelectItem key={character} value={character}>
                    {character}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </>
    )}
  </aside>
);
