"use client";

import { useRef, useState } from "react";
import { Delta } from "@/components/app/delta";
import { MutedText, Panel, PanelTitle } from "@/components/app/panel";
import { chartScale, chartTicks } from "@/lib/chart";
import { formatDayDate, formatShortDate } from "@/lib/dates";
import { juta, persen, ratio, rupiah } from "@/lib/format";
import type { DashboardData } from "@/types/dashboard";

// Grafik area penjualan harian 30 hari terakhir. Grafiknya berperan sebagai
// slider: arahkan mouse, sentuh, atau pakai tombol panah untuk membaca angka
// per tanggal.
export function DailyTrend({
  daily,
  today,
}: {
  daily: DashboardData["daily"];
  today: string;
}) {
  const last = daily.length - 1;
  const [active, setActive] = useState(last);
  const plotRef = useRef<HTMLDivElement>(null);

  const index = Math.min(active, last);
  const total = daily.reduce((sum, day) => sum + day.amount, 0);
  const average = total / Math.max(1, daily.length);
  const scale = chartScale(Math.max(...daily.map((day) => day.amount)));
  const ticks = chartTicks(scale);
  const points = daily.map((day, position) => ({
    x: last > 0 ? (position / last) * 100 : 50,
    y: 100 - ratio(day.amount, scale.max),
  }));
  const line = points
    .map(
      (point, position) =>
        `${position === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const current = daily[index];
  const marker = points[index];
  // Label sumbu-X: awal, tengah, akhir; dua label tambahan di panel lebar.
  const axis = [0, 7, 14, 21, last].filter(
    (position, order, list) =>
      position <= last && list.indexOf(position) === order,
  );

  function clamp(next: number) {
    return Math.min(last, Math.max(0, next));
  }

  function scrub(event: React.PointerEvent<HTMLDivElement>) {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setActive(
      clamp(Math.round(((event.clientX - rect.left) / rect.width) * last)),
    );
  }

  function handleKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      PageDown: index - 7,
      PageUp: index + 7,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    setActive(clamp(moves[event.key]));
  }

  return (
    <Panel aria-labelledby="dashboard-daily-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <PanelTitle id="dashboard-daily-title">
            Tren penjualan harian
          </PanelTitle>
          <p className="font-mono text-[25px] leading-[1.2] [overflow-wrap:anywhere]">
            {rupiah(total)}
          </p>
          <MutedText>
            Total {daily.length} hari terakhir · rata-rata {rupiah(average)} per
            hari
          </MutedText>
        </div>
        <div className="grid w-full max-w-[320px] gap-1 rounded-md bg-muted px-4 py-3">
          <MutedText>
            {formatDayDate(current.date)}
            {current.date === today && " (hari ini)"}
          </MutedText>
          <p className="font-mono text-lg leading-[1.33]">
            {rupiah(current.amount)}
          </p>
          {average > 0 ? (
            <Delta
              diff={current.amount - average}
              amount={persen(ratio(Math.abs(current.amount - average), average))}
            >
              dari rata-rata harian
            </Delta>
          ) : (
            <MutedText>Belum ada penjualan di rentang ini</MutedText>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 pt-2">
        <div
          aria-hidden="true"
          className="relative h-[200px] min-w-[6ch] font-mono text-xs leading-none text-muted-foreground"
        >
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
              style={{ top: `${tick.top}%` }}
            >
              {juta(tick.value)}
            </span>
          ))}
        </div>

        <div className="min-w-0">
          <div
            ref={plotRef}
            role="slider"
            tabIndex={0}
            aria-label="Tanggal pada grafik penjualan harian"
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={index}
            aria-valuetext={`${formatDayDate(current.date)}: ${rupiah(current.amount)}`}
            onKeyDown={handleKey}
            onPointerDown={scrub}
            onPointerMove={scrub}
            className="relative h-[200px] cursor-crosshair touch-pan-y outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 size-full overflow-visible"
            >
              <path d={`${line} L100 100 L0 100 Z`} className="fill-muted" />
              {ticks.map((tick) => (
                <line
                  key={tick.value}
                  x1="0"
                  x2="100"
                  y1={tick.top}
                  y2={tick.top}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-border"
                  strokeWidth={1}
                />
              ))}
              <path
                d={line}
                vectorEffect="non-scaling-stroke"
                className="fill-none stroke-foreground"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 border-l border-muted-foreground"
              style={{ left: `${marker.x}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-primary"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            />
          </div>

          <div
            aria-hidden="true"
            className="relative mt-2 h-4 text-xs leading-[1.33] text-muted-foreground"
          >
            {axis.map((position) => (
              <span
                key={position}
                className={
                  "absolute whitespace-nowrap " +
                  (position === 0
                    ? ""
                    : position === last
                      ? "-translate-x-full"
                      : "-translate-x-1/2") +
                  // Label ke-2 dan ke-4 hanya muat di panel lebar.
                  (position === 7 || position === 21
                    ? " hidden @min-[561px]/panel:inline"
                    : "")
                }
                style={{ left: `${last > 0 ? (position / last) * 100 : 0}%` }}
              >
                {formatShortDate(daily[position].date)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
