"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Sparkles, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getUserApiKey, removeUserApiKey, setUserApiKey, testGeminiApiKey } from "@/lib/ai/user-key";

interface Props {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ApiKeyDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setUncontrolledOpen;

  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    function syncKey() {
      const saved = getUserApiKey();
      setHasSavedKey(Boolean(saved));
      if (saved) setKeyInput(saved);
    }
    syncKey();
    window.addEventListener("tiercheck:api-key-updated", syncKey);
    return () => window.removeEventListener("tiercheck:api-key-updated", syncKey);
  }, []);

  async function handleSave() {
    const clean = keyInput.trim();
    if (!clean) {
      setFeedback({ type: "error", message: "Ingrese una clave antes de guardar." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const test = await testGeminiApiKey(clean);
    setLoading(false);

    if (test.ok) {
      setUserApiKey(clean);
      setHasSavedKey(true);
      setFeedback({ type: "success", message: `¡Clave verificada y guardada! (${test.model ?? "Gemini"})` });
    } else {
      setFeedback({ type: "error", message: test.message });
    }
  }

  function handleRemove() {
    removeUserApiKey();
    setKeyInput("");
    setHasSavedKey(false);
    setFeedback({ type: "success", message: "Clave eliminada del navegador." });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Configurar clave de Gemini para IA"
            >
              <Sparkles className="size-3.5 text-electric" aria-hidden />
              <span className="hidden md:inline">Configurar IA</span>
              {hasSavedKey && <span className="size-1.5 rounded-full bg-emerald-500" aria-label="IA activa" />}
            </Button>
          }
        />
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-electric/10 text-electric">
              <KeyRound className="size-4" aria-hidden />
            </span>
            <div>
              <DialogTitle>Configurar API de Google Gemini</DialogTitle>
              <DialogDescription className="text-xs">
                Active las explicaciones con IA ingresando su propia clave gratuita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Estado actual */}
          <div className="flex items-center justify-between rounded-lg border bg-accent/40 px-3 py-2 text-xs">
            <span>Estado en este navegador:</span>
            {hasSavedKey ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3" /> Clave activa
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground">
                Sin clave
              </Badge>
            )}
          </div>

          {/* Campo de clave */}
          <div className="space-y-2">
            <label htmlFor="gemini-key-input" className="text-xs font-medium text-foreground">
              Clave de API (Google AI Studio)
            </label>
            <div className="relative">
              <Input
                id="gemini-key-input"
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="pr-10 font-mono text-xs"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Ocultar clave" : "Mostrar clave"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Mensajes de feedback */}
          {feedback && (
            <div
              className={`rounded-lg p-2.5 text-xs ${
                feedback.type === "success"
                  ? "border border-emerald-500/40 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border border-destructive/40 bg-destructive/10 text-destructive dark:text-destructive-foreground"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Instrucciones de ayuda */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">¿Cómo obtener una clave gratuita?</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Inicie sesión en{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-0.5 text-electric underline underline-offset-2 hover:opacity-80"
                >
                  Google AI Studio <ExternalLink className="size-2.5" />
                </a>
              </li>
              <li>Haga clic en <strong>“Create API key”</strong>.</li>
              <li>Copie el código generado y péguelo en el campo superior.</li>
            </ol>
            <p className="pt-1 text-[11px] text-muted-foreground/90">
              🔒 <strong>Privacidad garantizada:</strong> Su clave se almacena exclusivamente en su navegador (<code className="rounded bg-background px-1">localStorage</code>) y se comunica directamente con Google; nunca viaja a ningún servidor intermedio.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {hasSavedKey ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> Eliminar clave
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Probar y Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
