import { Check, Copy, Loader2, Wand2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { D2BotAPI } from "@/lib/D2Bot";
import type { DevEndpoint, DevField } from "@/lib/devApiRegistry";
import type { CallStatus } from "./devConsoleUtils";

export interface ResponseState {
  status: CallStatus;
  ms: number;
  text: string;
}

interface EndpointPanelProps {
  api: D2BotAPI;
  endpoint: DevEndpoint;
  values: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  onSend: () => void;
  sending: boolean;
  response: ResponseState | null;
  hasSession: boolean;
  /** Current realm/account used to seed the gameaction hash generator. */
  hashSeed: { realm: string; account: string };
}

const STATUS_STYLES: Record<CallStatus, string> = {
  // All chosen for >=4.5:1 contrast against the dark surface.
  success: "bg-lime-500/20 text-lime-300 border border-lime-500/50",
  failed: "bg-amber-500/20 text-amber-200 border border-amber-500/50",
  error: "bg-red-500/20 text-red-300 border border-red-500/50",
};

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 font-medium text-xs ${className}`}>
      {text}
    </span>
  );
}

export function EndpointPanel({
  api,
  endpoint,
  values,
  onFieldChange,
  onSend,
  sending,
  response,
  hasSession,
  hashSeed,
}: EndpointPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const baseId = useId();

  const generateHash = async () => {
    // Hash = MD5(realm + account) using the current app-state realm/account.
    const realm = hashSeed.realm.toLowerCase();
    const account = hashSeed.account.toLowerCase();
    try {
      const hash = await api.md5(realm + account);
      onFieldChange("hash", hash);
    } catch {
      // ignore — leave field as-is
    }
  };

  const handleSendClick = () => {
    if (endpoint.destructive && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onSend();
  };

  const copyResponse = () => {
    if (!response) return;
    navigator.clipboard
      .writeText(response.text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Clipboard write can reject (permissions) — nothing actionable here.
      });
  };

  const renderField = (field: DevField) => {
    const fieldId = `${baseId}-${field.name}`;
    const value = values[field.name] ?? "";
    const commonInputClass =
      "border-gray-700 bg-gray-800 text-white placeholder:text-gray-400";

    return (
      <div key={field.name} className="space-y-1">
        <label htmlFor={fieldId} className="block text-gray-300 text-sm">
          {field.label}
        </label>
        {field.name === "hash" && endpoint.id === "gameaction" ? (
          <div className="flex gap-2">
            <Input
              id={fieldId}
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
              className={commonInputClass}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateHash}
              className="shrink-0 border-gray-600 text-gray-200"
            >
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Generate
            </Button>
          </div>
        ) : field.type === "textarea" ? (
          <Textarea
            id={fieldId}
            value={value}
            placeholder={field.placeholder}
            rows={4}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={`${commonInputClass} font-mono text-sm`}
          />
        ) : field.type === "select" ? (
          <>
            <Input
              id={fieldId}
              value={value}
              list={`${fieldId}-options`}
              placeholder={field.placeholder}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
              className={commonInputClass}
            />
            <datalist id={`${fieldId}-options`}>
              {field.options?.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </>
        ) : (
          <Input
            id={fieldId}
            type={field.type === "password" ? "password" : "text"}
            value={value}
            placeholder={field.placeholder}
            autoComplete={field.type === "password" ? "new-password" : "off"}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={commonInputClass}
          />
        )}
      </div>
    );
  };

  const sessionGated = endpoint.session && !hasSession;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      {/* Title row */}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="font-semibold text-lg text-white">{endpoint.label}</h2>
        <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-300 text-xs">
          {endpoint.signature}
        </code>
        {endpoint.session && (
          <Badge text="session" className="bg-sky-500/20 text-sky-200" />
        )}
        {endpoint.destructive && (
          <Badge text="destructive" className="bg-red-500/25 text-red-200" />
        )}
        {endpoint.local && (
          <Badge text="local" className="bg-gray-600/50 text-gray-200" />
        )}
      </div>
      <p className="mb-4 text-gray-300 text-sm">{endpoint.description}</p>

      {sessionGated && (
        <p className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-200 text-xs">
          No active session — this call needs you to log in first.
        </p>
      )}

      {/* Inputs — natural height, pinned to the top */}
      <div className="shrink-0 space-y-3">
        {endpoint.fields.length === 0 && (
          <p className="text-gray-400 text-sm">No parameters.</p>
        )}
        {endpoint.fields.map(renderField)}

        {/* Send / confirm */}
        <div className="pt-1">
          {confirming ? (
            <div className="flex flex-col gap-2 rounded border border-red-500/50 bg-red-500/10 p-3">
              <p className="text-red-200 text-sm">
                This calls <code className="font-mono">{endpoint.func}</code>{" "}
                and changes state — Confirm?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSendClick}
                  disabled={sending}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {sending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirming(false)}
                  disabled={sending}
                  className="border-gray-600 text-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSendClick}
              disabled={sending}
              className="bg-lime-600 text-white hover:bg-lime-700"
            >
              {sending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {sending ? "Sending…" : "Send"}
            </Button>
          )}
        </div>
      </div>

      {/* Response — fills the remaining panel height, scrolls internally */}
      {response && (
        <div className="mt-3 flex min-h-0 flex-col rounded border border-gray-700 bg-gray-950">
          <div className="flex shrink-0 items-center gap-2 border-gray-800 border-b px-3 py-2">
            <span
              className={`rounded px-2 py-0.5 font-medium text-xs ${STATUS_STYLES[response.status]}`}
            >
              {response.status}
            </span>
            <span className="text-gray-400 text-xs">{response.ms} ms</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyResponse}
              className="ml-auto border-gray-600 text-gray-200"
            >
              {copied ? (
                <Check className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <pre className="whitespace-pre-wrap wrap-break-word p-3 font-mono text-gray-200 text-xs">
              {response.text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
