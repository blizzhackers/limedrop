import { Loader2 } from "lucide-react";
import type React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { D2BotAPI } from "@/lib/D2Bot";
import {
  setApiUrl,
  setLoginOpen,
  setPassword,
  setSession,
  setUsername,
} from "@/stores/appStore";
import { Button } from "./ui/button";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface SignInPromptProps {
  api: D2BotAPI;
  fetchAccounts: (session: string) => void;
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  api,
  fetchAccounts,
}) => {
  const [isDemoLoading, startDemoTransition] = useTransition();

  function handleDemoLogin() {
    startDemoTransition(async () => {
      const demoUsername = "demo";
      const demoPassword = "demo";
      const demoApiUrl = import.meta.env.VITE_DEMO_API_URL || DEFAULT_API_URL;

      try {
        const session = await api.login(demoUsername, demoPassword, demoApiUrl);
        const validate = await api.validate(demoUsername, session);
        if (!validate) throw new Error("Failed to validate session");

        setSession(session || null);
        setLoginOpen(false);
        setApiUrl(demoApiUrl);
        setUsername(demoUsername);
        setPassword(demoPassword);

        toast.success("Login successful!", {
          description: "Welcome to LimeDrop!",
        });
        fetchAccounts(session);
      } catch (err: unknown) {
        toast.error(
          "Demo login failed. Please try again. " + (err as Error).message,
        );
      }
    });
  }

  return (
    <div className="bg-gray-900 rounded p-6 border border-gray-700">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-300">
          Sign in to view your inventory
        </h3>
        <p className="text-gray-400">
          Login with your account to access your Diablo 2 items, or try our demo
          to see how it works.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={() => setLoginOpen(true)}
            className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-2"
          >
            Sign In
          </Button>
          <span className="text-gray-500">or</span>
          <Button
            onClick={handleDemoLogin}
            variant="outline"
            disabled={isDemoLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-2 disabled:opacity-50"
          >
            {isDemoLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Try Demo"
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Demo includes sample inventory data to explore features
        </p>
      </div>
    </div>
  );
};
