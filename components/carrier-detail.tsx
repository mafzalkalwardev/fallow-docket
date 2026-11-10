"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CarrierRecord, VehicleCounts } from "@/lib/types";
import { statusClass } from "@/components/carrier-table";

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 border-b border-border/70 py-2 text-sm sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words whitespace-pre-line">
        {value && href ? (
          <a className="underline decoration-border underline-offset-2" href={href}>
            {value}
          </a>
        ) : (
          value || "—"
        )}
      </dd>
    </div>
  );
}

function vehicleLine(counts: VehicleCounts): string {
  const line = (label: string, owned: number, term: number, trip: number) => {
    const total = owned + term + trip;
    if (total === 0) return null;
    return `${label}: ${total.toLocaleString("en-US")} (${owned} owned, ${term} term, ${trip} trip)`;
  };
  return [
    line("Tractors", counts.tractorsOwned, counts.tractorsTerm, counts.tractorsTrip),
    line("Straight trucks", counts.trucksOwned, counts.trucksTerm, counts.trucksTrip),
    line("Trailers", counts.trailersOwned, counts.trailersTerm, counts.trailersTrip),
  ]
    .filter(Boolean)
    .join("\n");
}

export function CarrierDetail({
  carrier,
  onClose,
}: {
  carrier: CarrierRecord | null;
  onClose: () => void;
}) {
  const vehicles = carrier?.vehicles ? vehicleLine(carrier.vehicles) : "";

  return (
    <Sheet open={carrier != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        {carrier ? (
          <>
            <SheetHeader className="pr-10">
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                {carrier.mcNumber || "No MC"} · USDOT {carrier.usdot || "—"}
              </p>
              <SheetTitle className="font-display text-2xl leading-tight">
                {carrier.legalName}
              </SheetTitle>
              <SheetDescription>
                {carrier.dbaName ? `Doing business as ${carrier.dbaName}. ` : ""}
                {[carrier.city, carrier.state].filter(Boolean).join(", ")}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className={statusClass(carrier.authorityStatus)}>
                  {carrier.authorityStatus}
                </Badge>
                {carrier.kinds.map((kind) => (
                  <Badge key={kind} variant="secondary">
                    {kind}
                  </Badge>
                ))}
              </div>
            </SheetHeader>

            <div className="px-4 pb-8">
              {carrier.censusMatched ? null : (
                <p className="mb-4 rounded-md border border-amber-800/20 bg-amber-700/10 px-3 py-2 text-sm text-amber-950">
                  The company census has no row for this USDOT, so email, officer, cargo, and fleet
                  counts are blank. The name, phone, and authority flags still come from the legacy
                  MC file.
                </p>
              )}

              <h3 className="mt-2 font-display text-lg">Contact</h3>
              <dl>
                <Field label="Phone" value={carrier.phone} href={carrier.phone ? `tel:${carrier.phone.replace(/\D/g, "")}` : undefined} />
                <Field label="Fax" value={carrier.fax} />
                <Field label="Email" value={carrier.email} href={carrier.email ? `mailto:${carrier.email}` : undefined} />
                <Field label="Officer" value={carrier.officer} />
                <Field label="Physical" value={carrier.physicalAddress} />
                <Field label="Mailing" value={carrier.mailingAddress} />
              </dl>

              <h3 className="mt-5 font-display text-lg">Authority</h3>
              <dl>
                <Field label="Status" value={carrier.authorityDetail} />
                <Field label="Operation" value={carrier.operation} />
                <Field label="Census status" value={carrier.censusStatus} />
                <Field label="Added" value={carrier.addDate} />
                <Field label="MCS-150" value={carrier.mcs150Date} />
              </dl>

              <h3 className="mt-5 font-display text-lg">Fleet and drivers</h3>
              <p className="text-xs text-muted-foreground">
                FMCSA publishes these counts, not unit numbers or VINs. Driver names are not in the
                public file.
              </p>
              <dl>
                <Field
                  label="Power units"
                  value={carrier.powerUnits == null ? "" : carrier.powerUnits.toLocaleString("en-US")}
                />
                <Field
                  label="Truck units"
                  value={carrier.truckUnits == null ? "" : carrier.truckUnits.toLocaleString("en-US")}
                />
                <Field label="Vehicle mix" value={vehicles} />
                <Field
                  label="Drivers"
                  value={carrier.totalDrivers == null ? "" : carrier.totalDrivers.toLocaleString("en-US")}
                />
                <Field
                  label="CDL drivers"
                  value={carrier.cdlDrivers == null ? "" : carrier.cdlDrivers.toLocaleString("en-US")}
                />
                <Field
                  label="Interstate"
                  value={
                    carrier.interstateDrivers == null
                      ? ""
                      : carrier.interstateDrivers.toLocaleString("en-US")
                  }
                />
                <Field
                  label="Intrastate"
                  value={
                    carrier.intrastateDrivers == null
                      ? ""
                      : carrier.intrastateDrivers.toLocaleString("en-US")
                  }
                />
              </dl>

              <h3 className="mt-5 font-display text-lg">Cargo</h3>
              <p className="text-sm">{carrier.cargo.length ? carrier.cargo.join(", ") : "—"}</p>

              <h3 className="mt-5 font-display text-lg">Insurance on the legacy file</h3>
              <dl>
                <Field label="Minimum required" value={carrier.minCoverage} />
                <Field label="BIPD on file" value={carrier.bipdOnFile} />
                <Field label="Cargo filing" value={carrier.cargoOnFile} />
                <Field label="Bond filing" value={carrier.bondOnFile} />
              </dl>

              <h3 className="mt-5 font-display text-lg">Sources</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {carrier.motusUrl ? (
                  <li>
                    <a
                      className="underline decoration-border underline-offset-2"
                      href={carrier.motusUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Public MOTUS company page
                    </a>
                  </li>
                ) : null}
                <li>
                  <a
                    className="underline decoration-border underline-offset-2"
                    href="https://data.transportation.gov/d/6eyk-hxee"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Legacy carrier file
                  </a>
                </li>
                <li>
                  <a
                    className="underline decoration-border underline-offset-2"
                    href="https://data.transportation.gov/d/az4n-8mr2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Company census file
                  </a>
                </li>
              </ul>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
