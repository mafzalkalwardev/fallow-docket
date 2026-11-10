"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarrierDetail } from "@/components/carrier-detail";
import { carrierKey, CarrierTable } from "@/components/carrier-table";
import { FilterForm } from "@/components/filter-form";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRESET_FILTERS } from "@/lib/filters";
import type { CarrierRecord, RunFilters, RunProgress } from "@/lib/types";

const PAGE = 100;

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function runLabel(run: RunProgress): string {
  const place = run.filters.state || "Any state";
  const status = run.filters.status === "any" ? "Any status" : run.filters.status.replaceAll("_", " ");
  return `${place} · ${status} · ${run.rowsKept.toLocaleString("en-US")} kept`;
}

export function Console() {
  const [filters, setFilters] = useState<RunFilters>(PRESET_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [runs, setRuns] = useState<RunProgress[]>([]);
  const [active, setActive] = useState<RunProgress | null>(null);
  const [carriers, setCarriers] = useState<CarrierRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<CarrierRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  const shownCount = useRef(PAGE);

  const loadCarriers = useCallback(async (id: string, offset: number, append: boolean, limit = PAGE) => {
    const response = await fetch(`/api/runs/${id}/carriers?offset=${offset}&limit=${limit}`);
    if (!response.ok) return;
    const body = (await response.json()) as { carriers: CarrierRecord[]; total: number };
    setTotal(body.total);
    setCarriers((current) => {
      const next = append ? [...current, ...body.carriers] : body.carriers;
      shownCount.current = next.length;
      return next;
    });
  }, []);

  const refreshRuns = useCallback(async () => {
    const response = await fetch("/api/runs");
    if (!response.ok) return;
    const body = (await response.json()) as { runs: RunProgress[] };
    setRuns(body.runs);
  }, []);

  const openRunId = useRef<string | null>(null);
  const signature = useRef("");

  const openRun = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/runs/${id}`);
      if (!response.ok) return;
      const run = (await response.json()) as RunProgress;
      setActive(run);
      const stamp = `${run.status}:${run.pagesRead}:${run.rowsKept}:${run.rowsDropped}:${run.note ?? ""}`;
      const sameRun = openRunId.current === id;
      if (sameRun && signature.current === stamp) return;
      signature.current = stamp;
      const limit = sameRun ? Math.max(PAGE, shownCount.current) : PAGE;
      openRunId.current = id;
      if (!sameRun) setQuery("");
      await loadCarriers(id, 0, false, limit);
    },
    [loadCarriers],
  );

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/runs");
      if (!response.ok) return;
      const body = (await response.json()) as { runs: RunProgress[] };
      setRuns(body.runs);
      const next = body.runs.find((run) => run.status === "running") ?? body.runs[0];
      if (next) await openRun(next.id);
    })();
  }, [openRun]);

  const activeId = active?.id;
  const activeStatus = active?.status;

  useEffect(() => {
    if (!activeId || activeStatus !== "running") return;
    const timer = window.setInterval(() => {
      void openRun(activeId);
      void refreshRuns();
    }, 1200);
    return () => window.clearInterval(timer);
  }, [activeId, activeStatus, openRun, refreshRuns]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (response.status === 409 && body.id) {
        setError(body.error ?? "A search is already running.");
        await openRun(body.id);
        return;
      }
      if (!response.ok || !body.id) {
        setError(body.error ?? "The search could not start.");
        return;
      }
      setSelected(null);
      setCarriers([]);
      setTotal(0);
      await openRun(body.id);
      await refreshRuns();
      setFiltersOpen(false);
    } catch {
      setError("The browser could not reach the search.");
    } finally {
      setSubmitting(false);
    }
  }

  const running = active?.status === "running" || submitting;
  const place = [active?.filters.state, active?.filters.status].filter(Boolean).join(" · ");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return carriers;
    return carriers.filter((carrier) =>
      [
        carrier.legalName,
        carrier.dbaName,
        carrier.mcNumber,
        carrier.usdot,
        carrier.phone,
        carrier.email,
        carrier.city,
        carrier.officer,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [carriers, query]);
  const progress =
    active && active.filters.cap > 0
      ? Math.min(100, Math.round((active.rowsKept / active.filters.cap) * 100))
      : 0;

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <Logo size={40} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl leading-none font-medium tracking-tight sm:text-3xl">
              Fallow Docket
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              Older motor-carrier dockets from the public FMCSA files.
            </p>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="overflow-y-auto border-b border-border lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-3 lg:hidden">
            <p className="text-sm font-medium">Filters</p>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen((open) => !open)}>
              {filtersOpen ? "Hide" : "Show"}
            </Button>
          </div>
          <div className={`${filtersOpen ? "block" : "hidden"} px-4 pb-5 lg:block lg:px-5 lg:py-5`}>
            <FilterForm
              filters={filters}
              onChange={setFilters}
              onSubmit={() => void submit()}
              disabled={running}
              error={error}
            />
            {runs.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Earlier searches
                </h2>
                <ul className="mt-2 space-y-1">
                  {runs.map((run) => (
                    <li key={run.id}>
                      <button
                        type="button"
                        className={`w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                          active?.id === run.id ? "bg-accent" : ""
                        }`}
                        onClick={() => {
                          setSelected(null);
                          void openRun(run.id);
                        }}
                      >
                        <span className="block capitalize">{runLabel(run)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatWhen(run.createdAt)} · {run.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto px-4 py-4 sm:px-6">
          {!active ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 px-5 py-10">
              <h2 className="font-display text-2xl">No search yet</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Inactive property carriers in Texas are filled in. Change the state if you want a
                different desk, then run the search. Each row is a legacy MC number joined to the
                company census for phone, email, fleet counts, and drivers.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full bg-primary ${active.status === "running" && progress === 0 ? "w-1/3 animate-pulse" : ""}`}
                    style={progress > 0 ? { width: `${progress}%` } : undefined}
                  />
                </div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl capitalize">{place || "Search"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active.status === "running"
                      ? `Reading page ${active.pagesRead.toLocaleString("en-US")} · scanned ${active.rowsScanned.toLocaleString("en-US")} legacy dockets · kept ${active.rowsKept.toLocaleString("en-US")} · set aside ${active.rowsDropped.toLocaleString("en-US")}`
                      : active.error || active.note}
                  </p>
                </div>
                {total === 0 ? (
                  <Button variant="outline" disabled>
                    Export CSV
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<a href={`/api/runs/${active.id}/export`} />}
                  >
                    Export CSV
                  </Button>
                )}
                </div>
                {total > 0 ? (
                  <Input
                    className="mt-3 bg-card"
                    value={query}
                    placeholder="Find a name, MC, USDOT, phone, or email"
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Find in these results"
                  />
                ) : null}
              </div>

              {active.status === "error" ? (
                <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {active.error}
                </p>
              ) : null}

              {active.status !== "running" && total === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
                  Nothing matched those filters. Try another state, or turn off “Must have an email”.
                </div>
              ) : (
                <>
                  <CarrierTable
                    carriers={visible}
                    selectedKey={selected ? carrierKey(selected) : null}
                    onSelect={setSelected}
                  />
                  {carriers.length < total ? (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        onClick={() => void loadCarriers(active.id, carriers.length, true)}
                      >
                        Show more ({carriers.length.toLocaleString("en-US")} of{" "}
                        {total.toLocaleString("en-US")})
                      </Button>
                    </div>
                  ) : total > 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {query
                        ? `${visible.length.toLocaleString("en-US")} match the find box, of ${total.toLocaleString("en-US")} in this search.`
                        : `${total.toLocaleString("en-US")} ${total === 1 ? "carrier" : "carriers"} in this search.`}
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}

          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Phone numbers and email addresses are the business contacts carriers filed on the
            company census. Fleet figures are counts by type — tractors, straight trucks, and
            trailers — not individual truck numbers. Confirm authority on the public MOTUS page
            before you rely on a row.
          </p>
        </main>
      </div>

      <CarrierDetail carrier={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
