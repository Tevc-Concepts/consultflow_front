"use client";

import * as React from "react";

export type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const SNOOZE_KEY = "consultflow:pwa:snooze-until";

export function useInstallPrompt(snoozeDays = 7) {
    const [canInstall, setCanInstall] = React.useState(false);
    const deferredRef = React.useRef<BeforeInstallPromptEvent | null>(null);

    const isSnoozed = React.useCallback(() => {
        try {
            const raw = localStorage.getItem(SNOOZE_KEY);
            if (!raw) return false;
            const until = Number(raw);
            return !Number.isNaN(until) && Date.now() < until;
        } catch {
            return false;
        }
    }, []);

    const snooze = React.useCallback(() => {
        try {
            const until = Date.now() + snoozeDays * 24 * 60 * 60 * 1000;
            localStorage.setItem(SNOOZE_KEY, String(until));
        } catch { }
        setCanInstall(false);
    }, [snoozeDays]);

    React.useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault?.();
            if (isSnoozed()) return;
            deferredRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
        };
        window.addEventListener("beforeinstallprompt", handler as EventListener);
        return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
    }, [isSnoozed]);

    const promptInstall = React.useCallback(async () => {
        const evt = deferredRef.current;
        if (!evt) return { outcome: "dismissed" as const };
        await evt.prompt();
        try {
            const choice = await evt.userChoice;
            if (choice.outcome === "accepted") {
                setCanInstall(false);
                deferredRef.current = null;
            }
            return choice;
        } catch {
            setCanInstall(false);
            deferredRef.current = null;
            return { outcome: "dismissed", platform: "unknown" } as const;
        }
    }, []);

    return { canInstall, promptInstall, snooze, isSnoozed };
}
