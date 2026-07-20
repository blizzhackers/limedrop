import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { D2BotAPI } from "@/lib/D2Bot";
import type { REALMS } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useDevScreenStore } from "@/stores/devScreenStore";

interface DevScreenProps {
  api: D2BotAPI;
}

export const DevScreen: React.FC<DevScreenProps> = ({ api }) => {
  const session = useAppStore((s) => s.session);
  const username = useAppStore((s) => s.username);
  const realm = useAppStore((s) => s.realm);

  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});

  // Form states for various API calls
  const [queryParams, setQueryParams] = useState({
    item: "",
    realm: realm || "USEast",
    account: "",
    charname: "",
  });

  const [putParams, setPutParams] = useState({
    folder: "",
    file: "",
    data: "",
    password: "",
  });

  const [getParams, setGetParams] = useState({
    filePath: "",
  });

  const [profileParams, setProfileParams] = useState({
    profile: "",
    tag: "",
  });

  const [encryptParams, setEncryptParams] = useState({
    message: "",
    password: "",
  });

  const [decryptParams, setDecryptParams] = useState({
    encryptedMessage: "",
    password: "",
  });

  // Game action params
  const [gameActionParams, setGameActionParams] = useState({
    hash: "",
    profile: username || "",
    action: "doDrop",
    gameName: "",
    gamePass: "",
    customData: '{"items": []}',
  });

  const [md5Input, setMd5Input] = useState("");
  const [eventType, setEventType] = useState("ItemAction");

  const handleApiCall = async (
    apiCall: () => Promise<unknown>,
    callName: string,
  ) => {
    setLoading(callName);
    try {
      const result = await apiCall();
      setResults((prev) => ({ ...prev, [callName]: result }));
      toast.success(`${callName} successful`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setResults((prev) => ({ ...prev, [callName]: { error: errorMessage } }));
      toast.error(`${callName} failed: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  if (!session) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">Please log in to use the dev screen</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">
        D2Bot API Dev Screen
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic API Calls */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Basic API Calls
          </h2>
          <div className="space-y-2">
            <Button
              onClick={() => handleApiCall(() => api.accounts(), "accounts")}
              disabled={loading === "accounts"}
              className="w-full"
            >
              {loading === "accounts" ? "Loading..." : "Get Accounts"}
            </Button>

            <Button
              onClick={() => handleApiCall(() => api.profiles(), "profiles")}
              disabled={loading === "profiles"}
              className="w-full"
            >
              {loading === "profiles" ? "Loading..." : "Get Profiles"}
            </Button>

            <Button
              onClick={() => handleApiCall(() => api.poll(), "poll")}
              disabled={loading === "poll"}
              className="w-full"
            >
              {loading === "poll" ? "Loading..." : "Poll"}
            </Button>

            <Button
              onClick={() => handleApiCall(() => api.PING(), "ping")}
              disabled={loading === "ping"}
              className="w-full"
            >
              {loading === "ping" ? "Loading..." : "PING"}
            </Button>
          </div>
        </div>

        {/* Game Action */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">Game Action</h2>
          <div className="space-y-2">
            <Input
              placeholder="Hash (realm+account MD5)"
              value={gameActionParams.hash}
              onChange={(e) =>
                setGameActionParams((prev) => ({
                  ...prev,
                  hash: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Profile"
              value={gameActionParams.profile}
              onChange={(e) =>
                setGameActionParams((prev) => ({
                  ...prev,
                  profile: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Action (e.g., doDrop)"
              value={gameActionParams.action}
              onChange={(e) =>
                setGameActionParams((prev) => ({
                  ...prev,
                  action: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Game Name"
              value={gameActionParams.gameName}
              onChange={(e) =>
                setGameActionParams((prev) => ({
                  ...prev,
                  gameName: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Game Password (optional)"
              value={gameActionParams.gamePass}
              onChange={(e) =>
                setGameActionParams((prev) => ({
                  ...prev,
                  gamePass: e.target.value,
                }))
              }
            />
            <textarea
              className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white text-sm"
              placeholder='Custom Data JSON (e.g., {"items": []})'
              value={gameActionParams.customData}
              onChange={(e) =>
                setGameActionParams((prev) => ({
                  ...prev,
                  customData: e.target.value,
                }))
              }
              rows={3}
            />
            <Button
              onClick={() => {
                try {
                  const parsedData = JSON.parse(gameActionParams.customData);
                  const gameActionData = {
                    hash: gameActionParams.hash,
                    profile: gameActionParams.profile,
                    action: gameActionParams.action,
                    data: JSON.stringify({
                      gameName: gameActionParams.gameName,
                      gamePass: gameActionParams.gamePass,
                      ...parsedData,
                    }),
                  };
                  handleApiCall(
                    () => api.gameaction(gameActionData),
                    "gameaction",
                  );
                } catch (_err) {
                  toast.error("Invalid JSON in custom data");
                }
              }}
              disabled={loading === "gameaction"}
              className="w-full"
            >
              {loading === "gameaction" ? "Loading..." : "Send Game Action"}
            </Button>

            {/* Helper button to generate hash */}
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">
                Generate hash for current realm + account:
              </p>
              <Input
                placeholder="Account name"
                // value={gameActionParams.hash.split("_")[1] || ""}
                onChange={(e) => {
                  const account = e.target.value.toLowerCase();
                  const realmLower = (realm || "useast").toLowerCase();
                  api.md5(realmLower + account).then((hash) => {
                    setGameActionParams((prev) => ({ ...prev, hash }));
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Query Items */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">Query Items</h2>
          <div className="space-y-2">
            <Input
              placeholder="Item name (optional)"
              value={queryParams.item}
              onChange={(e) =>
                setQueryParams((prev) => ({ ...prev, item: e.target.value }))
              }
            />
            <Input
              placeholder="Realm (default: USEast)"
              value={queryParams.realm}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  realm: e.target.value as (typeof REALMS)[number],
                }))
              }
            />
            <Input
              placeholder="Account (optional)"
              value={queryParams.account}
              onChange={(e) =>
                setQueryParams((prev) => ({ ...prev, account: e.target.value }))
              }
            />
            <Input
              placeholder="Character name (optional)"
              value={queryParams.charname}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  charname: e.target.value,
                }))
              }
            />
            <Button
              onClick={() =>
                handleApiCall(
                  () =>
                    api.query(
                      queryParams.item,
                      queryParams.realm,
                      queryParams.account,
                      queryParams.charname,
                    ),
                  "query",
                )
              }
              disabled={loading === "query"}
              className="w-full"
            >
              {loading === "query" ? "Loading..." : "Query Items"}
            </Button>
          </div>
        </div>

        {/* File Operations */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">
            File Operations
          </h2>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Put File</h3>
            <Input
              placeholder="Folder"
              value={putParams.folder}
              onChange={(e) =>
                setPutParams((prev) => ({ ...prev, folder: e.target.value }))
              }
            />
            <Input
              placeholder="File name"
              value={putParams.file}
              onChange={(e) =>
                setPutParams((prev) => ({ ...prev, file: e.target.value }))
              }
            />
            <Input
              placeholder="Data"
              value={putParams.data}
              onChange={(e) =>
                setPutParams((prev) => ({ ...prev, data: e.target.value }))
              }
            />
            <Input
              placeholder="Password"
              type="password"
              value={putParams.password}
              onChange={(e) =>
                setPutParams((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <Button
              onClick={() =>
                handleApiCall(
                  () =>
                    api.put(
                      putParams.folder,
                      putParams.file,
                      putParams.data,
                      putParams.password,
                    ),
                  "put",
                )
              }
              disabled={loading === "put"}
              className="w-full"
            >
              {loading === "put" ? "Loading..." : "Put File"}
            </Button>

            <h3 className="text-sm font-medium text-gray-300 mt-4">Get File</h3>
            <Input
              placeholder="File path"
              value={getParams.filePath}
              onChange={(e) =>
                setGetParams((prev) => ({ ...prev, filePath: e.target.value }))
              }
            />
            <Button
              onClick={() =>
                handleApiCall(() => api.get(getParams.filePath), "get")
              }
              disabled={loading === "get"}
              className="w-full"
            >
              {loading === "get" ? "Loading..." : "Get File"}
            </Button>
          </div>
        </div>

        {/* Profile Management */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Profile Management
          </h2>
          <div className="space-y-2">
            <Input
              placeholder="Profile name"
              value={profileParams.profile}
              onChange={(e) =>
                setProfileParams((prev) => ({
                  ...prev,
                  profile: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Tag"
              value={profileParams.tag}
              onChange={(e) =>
                setProfileParams((prev) => ({ ...prev, tag: e.target.value }))
              }
            />
            <Button
              onClick={() =>
                handleApiCall(
                  () => api.start(profileParams.profile, profileParams.tag),
                  "start",
                )
              }
              disabled={loading === "start"}
              className="w-full"
            >
              {loading === "start" ? "Loading..." : "Start Profile"}
            </Button>
            <Button
              onClick={() =>
                handleApiCall(() => api.stop(profileParams.profile), "stop")
              }
              disabled={loading === "stop"}
              className="w-full"
            >
              {loading === "stop" ? "Loading..." : "Stop Profile"}
            </Button>
            <Button
              onClick={() =>
                handleApiCall(
                  () => api.setTag(profileParams.profile, profileParams.tag),
                  "setTag",
                )
              }
              disabled={loading === "setTag"}
              className="w-full"
            >
              {loading === "setTag" ? "Loading..." : "Set Tag"}
            </Button>
          </div>
        </div>

        {/* Crypto Operations */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Crypto Operations
          </h2>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Encrypt</h3>
            <Input
              placeholder="Message to encrypt"
              value={encryptParams.message}
              onChange={(e) =>
                setEncryptParams((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Password (optional, uses login password)"
              type="password"
              value={encryptParams.password}
              onChange={(e) =>
                setEncryptParams((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
            <Button
              onClick={() =>
                handleApiCall(
                  () =>
                    api.encrypt(
                      encryptParams.message,
                      encryptParams.password || undefined,
                    ),
                  "encrypt",
                )
              }
              disabled={loading === "encrypt"}
              className="w-full"
            >
              {loading === "encrypt" ? "Loading..." : "Encrypt"}
            </Button>

            <h3 className="text-sm font-medium text-gray-300 mt-4">Decrypt</h3>
            <Input
              placeholder="Encrypted message"
              value={decryptParams.encryptedMessage}
              onChange={(e) =>
                setDecryptParams((prev) => ({
                  ...prev,
                  encryptedMessage: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Password (optional, uses login password)"
              type="password"
              value={decryptParams.password}
              onChange={(e) =>
                setDecryptParams((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
            <Button
              onClick={() =>
                handleApiCall(
                  () =>
                    api.decrypt(
                      decryptParams.encryptedMessage,
                      decryptParams.password || undefined,
                    ),
                  "decrypt",
                )
              }
              disabled={loading === "decrypt"}
              className="w-full"
            >
              {loading === "decrypt" ? "Loading..." : "Decrypt"}
            </Button>
          </div>
        </div>

        {/* Utility Functions */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Utility Functions
          </h2>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">MD5 Hash</h3>
            <Input
              placeholder="Text to hash"
              value={md5Input}
              onChange={(e) => setMd5Input(e.target.value)}
            />
            <Button
              onClick={() => handleApiCall(() => api.md5(md5Input), "md5")}
              disabled={loading === "md5"}
              className="w-full"
            >
              {loading === "md5" ? "Loading..." : "Generate MD5"}
            </Button>

            <h3 className="text-sm font-medium text-gray-300 mt-4">
              Register Event
            </h3>
            <Input
              placeholder="Event type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            />
            <Button
              onClick={() =>
                handleApiCall(
                  () => api.registerEvent(eventType),
                  "registerEvent",
                )
              }
              disabled={loading === "registerEvent"}
              className="w-full"
            >
              {loading === "registerEvent" ? "Loading..." : "Register Event"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      <div className="mt-6 bg-gray-800 p-4 rounded">
        <h2 className="text-lg font-semibold mb-4 text-white">Results</h2>
        <div className="max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {Object.keys(results).length === 0
              ? "No results yet. Make some API calls to see responses here."
              : JSON.stringify(results, null, 2)}
          </pre>
        </div>
        {Object.keys(results).length > 0 && (
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => {
                const resultsText = JSON.stringify(results, null, 2);
                navigator.clipboard
                  .writeText(resultsText)
                  .then(() => {
                    toast.success("Results copied to clipboard!");
                  })
                  .catch((err) => {
                    toast.error("Failed to copy to clipboard", {
                      description: String(err),
                    });
                  });
              }}
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button onClick={() => setResults({})} variant="outline">
              Clear Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const DevScreenDialog: React.FC<DevScreenProps> = ({ api }) => {
  const open = useDevScreenStore((s) => s.open);
  const setOpen = useDevScreenStore((s) => s.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-gray-700 bg-gray-900 p-0 text-white sm:max-w-5xl">
        <DialogTitle className="sr-only">Dev Screen</DialogTitle>
        <DevScreen api={api} />
      </DialogContent>
    </Dialog>
  );
};
