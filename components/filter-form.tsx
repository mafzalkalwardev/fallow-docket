"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESET_FILTERS, US_STATES } from "@/lib/filters";
import type { AuthorityStatus, CarrierKind, RunFilters } from "@/lib/types";

const STATUSES: { value: AuthorityStatus; label: string }[] = [
  { value: "inactive", label: "Inactive" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Application pending" },
  { value: "revocation_pending", label: "Revocation pending" },
  { value: "any", label: "Any status" },
];

const KINDS: { value: CarrierKind; label: string }[] = [
  { value: "property", label: "Property" },
  { value: "passenger", label: "Passenger" },
  { value: "household", label: "Household goods" },
  { value: "broker", label: "Broker" },
  { value: "any", label: "Any kind" },
];

export function FilterForm({
  filters,
  onChange,
  onSubmit,
  disabled,
  error,
}: {
  filters: RunFilters;
  onChange: (filters: RunFilters) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;
}) {
  function set<K extends keyof RunFilters>(key: K, value: RunFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() =>
            onChange({
              ...PRESET_FILTERS,
              state: filters.state || PRESET_FILTERS.state,
            })
          }
        >
          Inactive legacy property carriers
        </Button>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Pre-MOTUS MC numbers with no active common, contract, or broker authority.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="state">State</Label>
        <Select
          value={filters.state || "ANY"}
          onValueChange={(value) => set("state", !value || value === "ANY" ? "" : value)}
        >
          <SelectTrigger id="state" className="w-full">
            <SelectValue placeholder="Any state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any state</SelectItem>
            {US_STATES.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="status">Authority status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => value && set("status", value as AuthorityStatus)}
        >
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="kind">Carrier kind</Label>
        <Select
          value={filters.kind}
          onValueChange={(value) => value && set("kind", value as CarrierKind)}
        >
          <SelectTrigger id="kind" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((kind) => (
              <SelectItem key={kind.value} value={kind.value}>
                {kind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="min-power">Min power units</Label>
          <Input
            id="min-power"
            inputMode="numeric"
            value={filters.minPowerUnits ?? ""}
            onChange={(event) =>
              set("minPowerUnits", event.target.value === "" ? null : Number(event.target.value))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="max-power">Max power units</Label>
          <Input
            id="max-power"
            inputMode="numeric"
            value={filters.maxPowerUnits ?? ""}
            onChange={(event) =>
              set("maxPowerUnits", event.target.value === "" ? null : Number(event.target.value))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="year">Census added before</Label>
          <Input
            id="year"
            inputMode="numeric"
            placeholder="Year"
            value={filters.addedBeforeYear ?? ""}
            onChange={(event) =>
              set("addedBeforeYear", event.target.value === "" ? null : Number(event.target.value))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cap">Keep at most</Label>
          <Input
            id="cap"
            inputMode="numeric"
            value={filters.cap}
            onChange={(event) => set("cap", Number(event.target.value))}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        250 is the usual desk. 2,000 is the most one search will keep.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={filters.requirePhone}
          onCheckedChange={(checked) => set("requirePhone", checked === true)}
        />
        Must have a phone number
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={filters.requireEmail}
          onCheckedChange={(checked) => set("requireEmail", checked === true)}
        />
        Must have an email
      </label>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={disabled} className="w-full">
        {disabled ? "Search running…" : "Run search"}
      </Button>
    </form>
  );
}
