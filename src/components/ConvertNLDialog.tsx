import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { D2BotAPI } from "@/lib/D2Bot";
import { useAppStore } from "@/stores/useAppStore";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FixedSizeList } from "react-window";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

interface ConvertNLDialogProps {
  api: D2BotAPI;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AccountGroup {
  accountName: string;
  characters: {
    charName: string;
    realm: string;
    accountName: string;
    ladder: boolean;
  }[];
}

type SelectedCharacter = {
  realm: string;
  account: string;
  character: string;
};

const getCharacterKey = (account: string, character: string) =>
  `${account}:${character}`;

const CharacterItem = memo(
  ({
    char,
    isSelected,
    onToggle,
  }: {
    char: { charName: string; realm: string; accountName: string };
    isSelected: boolean;
    onToggle: (checked: boolean) => void;
  }) => {
    return (
      <div className="flex items-center space-x-2 p-1 hover:bg-gray-800 rounded">
        <Checkbox
          id={`${char.accountName}-${char.charName}`}
          checked={isSelected}
          onCheckedChange={onToggle}
        />
        <label
          htmlFor={`${char.accountName}-${char.charName}`}
          className="text-sm"
        >
          {char.charName}
        </label>
      </div>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.char.charName === next.char.charName &&
    prev.char.accountName === next.char.accountName,
);

CharacterItem.displayName = "CharacterItem";

const AccountGroup = memo(
  ({
    group,
    expanded,
    toggleExpand,
    selectedCharMap,
    updateSelection,
  }: {
    group: AccountGroup;
    expanded: boolean;
    toggleExpand: () => void;
    selectedCharMap: Map<string, boolean>;
    updateSelection: (
      accountName: string,
      checked: boolean,
      characters?: { character: string; realm: string }[],
    ) => void;
  }) => {
    const isFullySelected = group.characters.every((char) =>
      selectedCharMap.get(getCharacterKey(char.accountName, char.charName)),
    );
    const isPartiallySelected =
      !isFullySelected &&
      group.characters.some((char) =>
        selectedCharMap.get(getCharacterKey(char.accountName, char.charName)),
      );

    const handleCharToggle = useCallback(
      (char: (typeof group.characters)[0], checked: boolean) => {
        const charInfo = {
          character: char.charName,
          realm: char.realm,
        };
        updateSelection(char.accountName, checked, [charInfo]);
      },
      [updateSelection],
    );

    return (
      <div className="border border-gray-700 rounded-md mb-2">
        <div
          className="flex items-center p-2 bg-gray-800 rounded-t-md cursor-pointer"
          onClick={toggleExpand}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleExpand();
          }}
        >
          <button
            type="button"
            className="mr-2 text-gray-400"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <Checkbox
            id={`account-${group.accountName}`}
            checked={isFullySelected}
            data-state={
              isPartiallySelected
                ? "indeterminate"
                : isFullySelected
                  ? "checked"
                  : "unchecked"
            }
            onCheckedChange={(checked) => {
              updateSelection(group.accountName, !!checked);
            }}
            className="mr-2"
            onClick={(e) => e.stopPropagation()}
          />

          <label
            htmlFor={`account-${group.accountName}`}
            className="font-semibold"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleExpand();
            }}
          >
            {group.accountName}
          </label>
          <span className="ml-2 text-sm text-gray-400">
            ({group.characters.length} characters)
          </span>
        </div>

        {expanded && group.characters.length > 0 && (
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {group.characters.length <= 30 ? (
                group.characters.map((char) => (
                  <CharacterItem
                    key={`${char.accountName}-${char.charName}`}
                    char={char}
                    isSelected={
                      !!selectedCharMap.get(
                        getCharacterKey(char.accountName, char.charName),
                      )
                    }
                    onToggle={(checked) => handleCharToggle(char, checked)}
                  />
                ))
              ) : (
                <div className="h-[200px] w-full">
                  <FixedSizeList
                    height={200}
                    itemCount={group.characters.length}
                    itemSize={30}
                    width="100%"
                    itemKey={(index) => {
                      const char = group.characters[index];
                      return `${char.accountName}-${char.charName}`;
                    }}
                  >
                    {({ index, style }) => {
                      const char = group.characters[index];
                      return (
                        <div style={style}>
                          <CharacterItem
                            char={char}
                            isSelected={
                              !!selectedCharMap.get(
                                getCharacterKey(
                                  char.accountName,
                                  char.charName,
                                ),
                              )
                            }
                            onToggle={(checked) =>
                              handleCharToggle(char, checked)
                            }
                          />
                        </div>
                      );
                    }}
                  </FixedSizeList>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

AccountGroup.displayName = "AccountGroup";

export function ConvertNLDialog({
  api,
  open,
  onOpenChange,
}: ConvertNLDialogProps) {
  const username = useAppStore((s) => s.username);
  const realm = useAppStore((s) => s.realm);
  const accountDataCache = useAppStore((s) => s.accountDataCache);
  const [filterText, setFilterText] = useState("");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCharactersMap, setSelectedCharactersMap] = useState<
    Map<string, SelectedCharacter>
  >(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountGroups = useMemo(() => {
    const ladderCharacters = accountDataCache.filter(
      (acc) => !acc.ladder && acc.realm === realm,
    );

    const filtered = filterText
      ? ladderCharacters.filter(
          (char) =>
            char.charName.toLowerCase().includes(filterText.toLowerCase()) ||
            char.accountName.toLowerCase().includes(filterText.toLowerCase()),
        )
      : ladderCharacters;

    const groups: Record<string, AccountGroup> = {};

    for (const char of filtered) {
      if (!groups[char.accountName]) {
        groups[char.accountName] = {
          accountName: char.accountName,
          characters: [],
        };
      }
      groups[char.accountName].characters.push(char);
    }

    return Object.values(groups);
  }, [accountDataCache, realm, filterText]);

  useEffect(() => {
    if (open) {
      const allAccounts = new Set(
        accountGroups.map((group) => group.accountName),
      );
      setExpandedAccounts(allAccounts);
    }
  }, [open, accountGroups]);

  useEffect(() => {
    if (!open) {
      setSelectedCharactersMap(new Map());
    }
  }, [open]);

  const totalCharCount = useMemo(
    () =>
      accountGroups.reduce(
        (total, group) => total + group.characters.length,
        0,
      ),
    [accountGroups],
  );

  const toggleAccount = useCallback((accountName: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountName)) {
        newSet.delete(accountName);
      } else {
        newSet.add(accountName);
      }
      return newSet;
    });
  }, []);

  const updateSelection = useCallback(
    (
      accountName: string,
      checked: boolean,
      specificCharacters?: { character: string; realm: string }[],
    ) => {
      setSelectedCharactersMap((current) => {
        const newMap = new Map(current);
        if (specificCharacters) {
          for (const char of specificCharacters) {
            const key = getCharacterKey(accountName, char.character);
            if (checked) {
              newMap.set(key, {
                realm: char.realm,
                account: accountName,
                character: char.character,
              });
            } else {
              newMap.delete(key);
            }
          }
        } else {
          const accountGroup = accountGroups.find(
            (g) => g.accountName === accountName,
          );
          if (!accountGroup) return current;
          for (const char of accountGroup.characters) {
            const key = getCharacterKey(accountName, char.charName);
            if (checked) {
              newMap.set(key, {
                realm: char.realm,
                account: char.accountName,
                character: char.charName,
              });
            } else {
              newMap.delete(key);
            }
          }
        }
        return newMap;
      });
    },
    [accountGroups],
  );

  const selectAllCharacters = useCallback(() => {
    const allCharacters = accountGroups.flatMap((group) =>
      group.characters.map((char): [string, SelectedCharacter] => [
        getCharacterKey(char.accountName, char.charName),
        {
          realm: char.realm,
          account: char.accountName,
          character: char.charName,
        },
      ]),
    );
    setSelectedCharactersMap(new Map(allCharacters));
  }, [accountGroups]);

  const deselectAllCharacters = useCallback(() => {
    setSelectedCharactersMap(new Map());
  }, []);

  const handleSubmit = async () => {
    const selectedCharacters = Array.from(selectedCharactersMap.values());
    if (selectedCharacters.length === 0) {
      toast.error("No characters selected", {
        description: "Please select at least one character to convert",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const hash = await api.md5("doConvertNL");
      const GameInfo = {
        hash,
        profile: username,
        action: "doConvertNL",
        data: JSON.stringify(selectedCharacters),
      };

      await api.gameaction(GameInfo);

      toast.success("Conversion initiated", {
        description: `Converting ${selectedCharacters.length} character(s) to non-ladder`,
      });
      setSelectedCharactersMap(new Map());
    } catch (err) {
      toast.error("Conversion failed", {
        description: `Error: ${String(err)}`,
      });
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Convert Ladder to Non-Ladder</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select the characters you want to convert from ladder to non-ladder.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Filter by account or character name..."
                className="pl-8"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText("")}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {selectedCharactersMap.size}/{totalCharCount} selected
              </span>
              {selectedCharactersMap.size > 0 ? (
                <button
                  type="button"
                  className="text-sm text-red-400 hover:text-red-300"
                  onClick={deselectAllCharacters}
                >
                  Deselect All
                </button>
              ) : (
                <button
                  type="button"
                  className="text-sm text-green-400 hover:text-green-300"
                  onClick={selectAllCharacters}
                >
                  Select All
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="space-y-2">
              {accountGroups.length > 0 ? (
                <div>
                  {accountGroups.map((group) => {
                    const groupSelectionMap = new Map(
                      group.characters.map((char) => [
                        getCharacterKey(group.accountName, char.charName),
                        selectedCharactersMap.has(
                          getCharacterKey(group.accountName, char.charName),
                        ),
                      ]),
                    );
                    return (
                      <AccountGroup
                        key={group.accountName}
                        group={group}
                        expanded={expandedAccounts.has(group.accountName)}
                        toggleExpand={() => toggleAccount(group.accountName)}
                        selectedCharMap={groupSelectionMap}
                        updateSelection={updateSelection}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">
                  {filterText
                    ? "No matches found."
                    : "No ladder characters found."}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gray-700 pt-4">
            <span className="text-sm text-gray-400">
              {selectedCharactersMap.size} character(s) selected
            </span>
            <button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white rounded p-2 font-semibold disabled:opacity-50"
              disabled={selectedCharactersMap.size === 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? "Converting..."
                : selectedCharactersMap.size > 0
                  ? `Convert ${selectedCharactersMap.size} Character${selectedCharactersMap.size > 1 ? "s" : ""}`
                  : "Select Characters"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
