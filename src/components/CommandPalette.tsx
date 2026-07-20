import {
  FlaskConical,
  History,
  LogOut,
  PackagePlus,
  Search,
  ShoppingCart,
  SwitchCamera,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  setCartOpen,
  setRecentDropsOpen,
  useAppStore,
} from "@/stores/appStore";
import { useConvertNLDialogStore } from "@/stores/convertNLDialogStore";
import { useDevScreenStore } from "@/stores/devScreenStore";
import { useItemPacksDialogStore } from "@/stores/itemPacksDialogStore";

/**
 * Focus the Topbar search input (id set on the desktop field). The palette's
 * close animation (~200ms) can restore focus elsewhere, so keep reclaiming it
 * until the input actually holds focus, then stop.
 */
function focusSearch(tries = 8) {
  const el = document.getElementById("topbar-search");
  el?.focus();
  if (tries > 0 && document.activeElement !== el) {
    setTimeout(() => focusSearch(tries - 1), 50);
  }
}

interface CommandPaletteProps {
  onSignOut: () => void;
}

/**
 * Global command palette. Opens with Cmd/Ctrl+K (also closes on the same
 * chord). Actions mirror what the Topbar exposes; session- and dev-gated
 * entries match where those triggers are available elsewhere in the app.
 */
export function CommandPalette({ onSignOut }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const session = useAppStore((s) => s.session);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // metaKey (⌘ on macOS) || ctrlKey (Windows/Linux) — never hardcode one.
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close the palette first, then run the action so its dialog/drawer owns
  // focus and body scroll-lock cleanly after this one releases them.
  const runCommand = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => setCartOpen(true))}>
            <ShoppingCart />
            Open cart
          </CommandItem>

          {session && (
            <>
              <CommandItem
                onSelect={() => runCommand(() => setRecentDropsOpen(true))}
              >
                <History />
                Recent drops
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() =>
                    useItemPacksDialogStore.getState().setOpen(true),
                  )
                }
              >
                <PackagePlus />
                Manage item packs
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() =>
                    useConvertNLDialogStore.getState().setOpen(true),
                  )
                }
              >
                <SwitchCamera />
                Convert ladder to NL
              </CommandItem>
              <CommandItem onSelect={() => runCommand(focusSearch)}>
                <Search />
                Focus search
              </CommandItem>
            </>
          )}
        </CommandGroup>

        {session && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem onSelect={() => runCommand(onSignOut)}>
                <LogOut />
                Sign out
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {session && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Developer">
              <CommandItem
                onSelect={() =>
                  runCommand(() => useDevScreenStore.getState().setOpen(true))
                }
              >
                <FlaskConical />
                Open dev screen
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
