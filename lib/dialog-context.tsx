"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { Modal } from "@/components/Modal";

/**
 * Brauzerin yerli alert()/confirm()/prompt() pəncərələri çirkin görünür və
 * dizaynla uyğun gəlmir. Bunun əvəzinə hər yerdə eyni görünüşlü, tətbiqin öz
 * Modal komponentindən istifadə edən bildiriş/sual pəncərəsi — useDialog() hook-u
 * ilə çağırılır: const { alert, confirm, prompt } = useDialog();
 */

type AlertOptions = { title?: string; confirmLabel?: string };
type ConfirmOptions = { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type PromptOptions = {
    title?: string; label?: string; placeholder?: string;
    confirmLabel?: string; cancelLabel?: string; inputType?: string; defaultValue?: string;
};

type DialogState =
    | { kind: "alert"; message: string; title: string; confirmLabel: string; resolve: () => void }
    | { kind: "confirm"; message: string; title: string; confirmLabel: string; cancelLabel: string; danger?: boolean; resolve: (ok: boolean) => void }
    | {
    kind: "prompt"; message: string; title: string; label?: string; placeholder?: string;
    confirmLabel: string; cancelLabel: string; inputType?: string; resolve: (v: string | null) => void;
}
    | null;

type DialogApi = {
    alert: (message: string, opts?: AlertOptions) => Promise<void>;
    confirm: (message: string, opts?: ConfirmOptions) => Promise<boolean>;
    prompt: (message: string, opts?: PromptOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DialogState>(null);
    const [inputValue, setInputValue] = useState("");

    const alert = useCallback((message: string, opts?: AlertOptions) => {
        return new Promise<void>((resolve) => {
            setState({ kind: "alert", message, title: opts?.title ?? "Bildiriş", confirmLabel: opts?.confirmLabel ?? "Tamam", resolve });
        });
    }, []);

    const confirm = useCallback((message: string, opts?: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({
                kind: "confirm", message, title: opts?.title ?? "Təsdiq",
                confirmLabel: opts?.confirmLabel ?? "Bəli", cancelLabel: opts?.cancelLabel ?? "Ləğv et",
                danger: opts?.danger, resolve,
            });
        });
    }, []);

    const prompt = useCallback((message: string, opts?: PromptOptions) => {
        setInputValue(opts?.defaultValue ?? "");
        return new Promise<string | null>((resolve) => {
            setState({
                kind: "prompt", message, title: opts?.title ?? "Daxil edin",
                label: opts?.label, placeholder: opts?.placeholder,
                confirmLabel: opts?.confirmLabel ?? "Təsdiqlə", cancelLabel: opts?.cancelLabel ?? "Ləğv et",
                inputType: opts?.inputType, resolve,
            });
        });
    }, []);

    function close() {
        setState(null);
        setInputValue("");
    }

    return (
        <DialogContext.Provider value={{ alert, confirm, prompt }}>
            {children}
            {state && (
                <Modal
                    title={state.title}
                    maxWidth="max-w-sm"
                    onClose={() => {
                        if (state.kind === "alert") state.resolve();
                        else if (state.kind === "confirm") state.resolve(false);
                        else state.resolve(null);
                        close();
                    }}
                >
                    <p className="text-sm text-ink2 whitespace-pre-line">{state.message}</p>
                    {state.kind === "prompt" && (
                        <div className="fld">
                            {state.label && <label>{state.label}</label>}
                            <div className="inp">
                                <input
                                    autoFocus
                                    type={state.inputType ?? "text"}
                                    value={inputValue}
                                    placeholder={state.placeholder}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { state.resolve(inputValue); close(); }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 justify-end mt-1">
                        {(state.kind === "confirm" || state.kind === "prompt") && (
                            <button
                                className="btn"
                                onClick={() => {
                                    if (state.kind === "confirm") state.resolve(false);
                                    else if (state.kind === "prompt") state.resolve(null);
                                    close();
                                }}
                            >
                                {state.cancelLabel}
                            </button>
                        )}
                        <button
                            className={`btn ${state.kind === "confirm" && state.danger ? "danger" : "pri"}`}
                            onClick={() => {
                                if (state.kind === "alert") state.resolve();
                                else if (state.kind === "confirm") state.resolve(true);
                                else state.resolve(inputValue);
                                close();
                            }}
                        >
                            {state.confirmLabel}
                        </button>
                    </div>
                </Modal>
            )}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error("useDialog() mütləq <DialogProvider> daxilində istifadə olunmalıdır.");
    return ctx;
}