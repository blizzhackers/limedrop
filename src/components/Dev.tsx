import { ApiConsole } from "@/components/dev/ApiConsole";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { D2BotAPI } from "@/lib/D2Bot";
import { useDevScreenStore } from "@/stores/devScreenStore";

interface DevScreenProps {
  api: D2BotAPI;
}

/**
 * D2Bot API Console — a sidebar-explorer over the full {@link D2BotAPI}
 * surface. Rendered inside the shared dev dialog.
 */
export const DevScreen: React.FC<DevScreenProps> = ({ api }) => {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-gray-700 border-b px-4 py-3">
        <h1 className="font-bold text-white text-xl">D2Bot API Console</h1>
        <p className="text-gray-400 text-xs">
          Explore and invoke every D2Bot API endpoint.
        </p>
      </header>
      <ApiConsole api={api} />
    </div>
  );
};

export const DevScreenDialog: React.FC<DevScreenProps> = ({ api }) => {
  const open = useDevScreenStore((s) => s.open);
  const setOpen = useDevScreenStore((s) => s.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[85vh] flex-col overflow-hidden border-gray-700 bg-gray-900 p-0 text-white sm:max-w-6xl">
        <DialogTitle className="sr-only">D2Bot API Console</DialogTitle>
        <DevScreen api={api} />
      </DialogContent>
    </Dialog>
  );
};
