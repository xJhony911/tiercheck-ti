"use client";

import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ENTITY_TYPE_OPTIONS, FACILITY_TYPE_OPTIONS } from "@/lib/validation/entity";

export interface EntityDraft {
  organizationName?: string;
  entityType?: string;
  facilityType?: string;
  observations?: string;
}

interface Props {
  value: EntityDraft;
  onChange: (next: EntityDraft) => void;
  errors: Record<string, string>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

export function EntityForm({ value, onChange, errors }: Props) {
  const set = (patch: Partial<EntityDraft>) => onChange({ ...value, ...patch });
  const obs = value.observations ?? "";

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-electric" aria-hidden />
        <p>
          No ingrese información sensible o confidencial (contraseñas, claves, direcciones IP internas, planos).
          El nombre y las observaciones <strong>no se envían a la IA</strong>.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organizationName">Nombre de la organización <span className="text-muted-foreground">(opcional)</span></Label>
        <Input
          id="organizationName"
          value={value.organizationName ?? ""}
          maxLength={100}
          autoComplete="off"
          aria-invalid={Boolean(errors.organizationName)}
          aria-describedby="err-organizationName"
          onChange={(e) => set({ organizationName: e.target.value })}
          placeholder="Ej.: Universidad de Ejemplo"
        />
        <FieldError id="err-organizationName" message={errors.organizationName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="entityType">Tipo de entidad</Label>
          <NativeSelect
            id="entityType"
            value={value.entityType ?? ""}
            aria-invalid={Boolean(errors.entityType)}
            aria-describedby="err-entityType"
            onChange={(e) => set({ entityType: e.target.value })}
          >
            <option value="" disabled>Seleccione…</option>
            {ENTITY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
          <FieldError id="err-entityType" message={errors.entityType} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="facilityType">Tipo de instalación evaluada</Label>
          <NativeSelect
            id="facilityType"
            value={value.facilityType ?? ""}
            aria-invalid={Boolean(errors.facilityType)}
            aria-describedby="err-facilityType"
            onChange={(e) => set({ facilityType: e.target.value })}
          >
            <option value="" disabled>Seleccione…</option>
            {/* Si un escenario de ejemplo trae un tipo distinto, se conserva como opción. */}
            {value.facilityType && !FACILITY_TYPE_OPTIONS.some((f) => f === value.facilityType) && (
              <option value={value.facilityType}>{value.facilityType}</option>
            )}
            {FACILITY_TYPE_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </NativeSelect>
          <FieldError id="err-facilityType" message={errors.facilityType} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observations">Observaciones <span className="text-muted-foreground">(opcional)</span></Label>
        <Textarea
          id="observations"
          rows={3}
          maxLength={500}
          value={obs}
          aria-invalid={Boolean(errors.observations)}
          aria-describedby="err-observations"
          onChange={(e) => set({ observations: e.target.value })}
          placeholder="Contexto general de la instalación, sin datos confidenciales."
        />
        <div className="flex justify-between">
          <FieldError id="err-observations" message={errors.observations} />
          <span className="ml-auto text-xs text-muted-foreground">{obs.length}/500</span>
        </div>
      </div>
    </div>
  );
}
