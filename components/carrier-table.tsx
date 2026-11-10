"use client";

import { Badge } from "@/components/ui/badge";
import type { CarrierRecord } from "@/lib/types";

function count(value: number | null): string {
  return value == null ? "—" : value.toLocaleString("en-US");
}

export function carrierKey(carrier: CarrierRecord): string {
  return `${carrier.mcNumber}-${carrier.usdot}`;
}

export function statusClass(status: string): string {
  if (status === "Active") return "border-emerald-800/25 bg-emerald-800/10 text-emerald-950";
  if (status === "Pending") return "border-amber-800/25 bg-amber-700/10 text-amber-950";
  if (status === "Revocation pending") return "border-red-900/25 bg-red-800/10 text-red-950";
  if (status === "Inactive") return "border-stone-500/30 bg-stone-300/40 text-stone-800";
  return "";
}

function placeOf(carrier: CarrierRecord): string {
  return [carrier.city, carrier.state].filter(Boolean).join(", ") || "—";
}

export function CarrierTable({
  carriers,
  selectedKey,
  onSelect,
}: {
  carriers: CarrierRecord[];
  selectedKey: string | null;
  onSelect: (carrier: CarrierRecord) => void;
}) {
  if (carriers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
        Nothing in this list matches that find box. Clear it to see the full search.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2 md:hidden">
        {carriers.map((carrier) => {
          const key = carrierKey(carrier);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(carrier)}
                className={`carrier-row w-full rounded-lg border bg-card px-3 py-3 text-left ${
                  selectedKey === key ? "border-primary" : "border-border"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-medium">{carrier.legalName}</span>
                  <Badge variant="outline" className={statusClass(carrier.authorityStatus)}>
                    {carrier.authorityStatus}
                  </Badge>
                </span>
                <span className="mt-1 block font-mono text-xs text-muted-foreground">
                  {carrier.mcNumber} · USDOT {carrier.usdot || "—"}
                </span>
                <span className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <span>{placeOf(carrier)}</span>
                  <span className="text-right tabular-nums">{carrier.phone || "No phone"}</span>
                  <span className="col-span-2 truncate text-muted-foreground">
                    {carrier.email || (carrier.censusMatched ? "No email on file" : "No census row")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count(carrier.powerUnits)} power units · {count(carrier.totalDrivers)} drivers
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
            <tr>
              <th className="h-10 px-3 text-left font-medium">Legal name</th>
              <th className="h-10 px-2 text-left font-medium">MC</th>
              <th className="h-10 px-2 text-left font-medium">USDOT</th>
              <th className="h-10 px-2 text-left font-medium">Status</th>
              <th className="h-10 px-2 text-left font-medium">Place</th>
              <th className="h-10 px-2 text-left font-medium">Phone</th>
              <th className="h-10 px-2 text-left font-medium">Email</th>
              <th className="h-10 px-2 text-right font-medium">Units</th>
              <th className="h-10 px-3 text-right font-medium">Drivers</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((carrier) => {
              const key = carrierKey(carrier);
              return (
                <tr
                  key={key}
                  data-state={selectedKey === key ? "selected" : undefined}
                  className="carrier-row cursor-pointer border-t border-border hover:bg-accent/70 data-[state=selected]:bg-accent"
                  onClick={() => onSelect(carrier)}
                >
                  <td className="max-w-56 truncate px-3 py-2 font-medium">{carrier.legalName}</td>
                  <td className="px-2 py-2 font-mono text-xs">{carrier.mcNumber}</td>
                  <td className="px-2 py-2 font-mono text-xs">{carrier.usdot || "—"}</td>
                  <td className="px-2 py-2">
                    <Badge variant="outline" className={statusClass(carrier.authorityStatus)}>
                      {carrier.authorityStatus}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">{placeOf(carrier)}</td>
                  <td className="px-2 py-2 tabular-nums">{carrier.phone || "—"}</td>
                  <td className="max-w-48 truncate px-2 py-2">
                    {carrier.email || (carrier.censusMatched ? "—" : "No census row")}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{count(carrier.powerUnits)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{count(carrier.totalDrivers)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
