"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, type PlatformResource } from "./api";

type Ctx = { resources: PlatformResource[] | null; error: string };
const PlatformContext = createContext<Ctx>({ resources: null, error: "" });

/** Platforma bölmələrinin (mağaza, istifadəçi, rol, ...) təsvirini backend-dən bir dəfə yükləyir. */
export function PlatformProvider({ children }: { children: ReactNode }) {
    const [resources, setResources] = useState<PlatformResource[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.platformResources().then(setResources).catch(() => setError("Platforma bölmələri yüklənmədi."));
    }, []);

    return <PlatformContext.Provider value={{ resources, error }}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
    return useContext(PlatformContext);
}
