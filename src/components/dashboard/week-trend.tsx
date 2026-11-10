"use client";

import { useState } from "react";
import { Delta } from "@/components/app/delta";
import { MutedText, Panel, PanelTitle } from "@/components/app/panel";
import { chartScale, chartTicks } from "@/lib/chart";
import { weekdayName } from "@/lib/dates";
import { juta, persen, ratio, rupiah } from "@/lib/format";
import type { DashboardData } from "@/types/dashboard";

// Penjualan per hari minggu ini (batang hitam) dibanding minggu lalu (batang
// berongga). Hari yang belum terjadi hanya menampilkan batang minggu lalu.
export function WeekTrend({
  week,
  today,
}: {
  week: DashboardData["week"];
  today: string;
}) {
  const todayIndex = Math.max(
    0,
    week.findIndex((day) => day.date === today),
  );
  const [selected, setSelected] = useState(todayIndex);

  const elapsed = week.filter((day) => day.current !== null);
  const weekToDate = elapsed.reduce((sum, day) => sum + (day.current ?? 0), 0);
  const lastWeekSameDays = elapsed.reduce((sum, day) => sum + day.previous, 0);
  const scale = chartScale(
    Math.max(...week.map((day) => Math.max(day.current ?? 0, day.previous))),
  );
  const ticks = chartTicks(scale);
  const active = week[Math.min(selected, week.length - 1)];
  const firstDay = weekdayName(week[0].date);
  const lastElapsedDay = weekdayName(elapsed[elapsed.length - 1]?.date ?? today);

  return (
    <Panel aria-labelledby="dashboard-week-title">
      <div className="grid gap-2">
        <PanelTitle id="dashboard-week-title">
          Minggu ini vs minggu lalu
        </PanelTitle>
        <p className="font-mono text-[25px] leading-[1.2] [overflow-wrap:anywhere]">
          {rupiah(weekToDate)}
        </p>
        {lastWeekSameDays > 0 ? (
          <Delta
            diff={weekToDate - lastWeekSameDays}
            amount={persen(
              ratio(Math.abs(weekToDate - lastWeekSameDays), lastWeekSameDays),
            )}
          >
            dari{" "}
            {firstDay === lastElapsedDay
              ? firstDay
              : `${firstDay}–${lastElapsedDay}`}{" "}
            minggu lalu ({rupiah(lastWeekSameDays)})
          </Delta>
        ) : (
          <MutedText>Minggu lalu belum ada penjualan</MutedText>
        )}
      </div>

      <ul
        aria-label="Keterangan grafik"
        className="flex flex-wrap gap-4 text-[13px] text-muted-foreground"
      >
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-foreground" />
          Minggu ini
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded-sm border border-muted-foreground bg-card"
          />
          Minggu lalu
        </li>
      </ul>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 pt-2">
        <div
          aria-hidden="true"
          className="relative h-[180px] min-w-[6ch] font-mono text-xs leading-none text-muted-foreground"
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

        <div className="relative min-w-0">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[180px]">
            {ticks.map((tick) => (
              <span
                key={tick.value}
                className="absolute inset-x-0 border-t"
                style={{ top: `${tick.top}%` }}
              />
            ))}
          </div>
          <div
            role="group"
            aria-label="Penjualan harian minggu ini dan minggu lalu"
            className="relative grid grid-cols-7"
          >
            {week.map((day, index) => (
              <button
                key={day.date}
                type="button"
                aria-pressed={selected === index}
                aria-label={`${weekdayName(day.date)}: minggu ini ${
                  day.current === null ? "belum ada data" : rupiah(day.current)
                }, minggu lalu ${rupiah(day.previous)}`}
                onClick={() => setSelected(index)}
                className="group relative grid min-w-0 justify-items-center outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-foreground/5 aria-pressed:after:absolute aria-pressed:after:inset-x-0 aria-pressed:after:bottom-0 aria-pressed:after:h-1 aria-pressed:after:bg-primary"
              >
                <span className="flex h-[180px] w-full items-end justify-center gap-1">
                  <span
                    className="w-[30%] max-w-4 rounded-t-sm border border-b-0 border-muted-foreground bg-card"
                    style={{ height: `${ratio(day.previous, scale.max)}%` }}
                  />
                  <span
                    className="w-[30%] max-w-4 rounded-t-sm bg-foreground"
                    style={{ height: `${ratio(day.current ?? 0, scale.max)}%` }}
                  />
                </span>
                <span className="pt-2 pb-3 text-xs leading-[1.33] text-muted-foreground group-aria-pressed:font-semibold group-aria-pressed:text-foreground">
                  {weekdayName(day.date, "short")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-md bg-muted px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">
            {weekdayName(active.date)}
            {active.date === today && " (hari ini)"}
          </p>
          {active.current === null ? (
            <MutedText>Belum ada data minggu ini</MutedText>
          ) : active.previous > 0 ? (
            <Delta
              diff={active.current - active.previous}
              amount={persen(
                ratio(Math.abs(active.current - active.previous), active.previous),
              )}
            >
              dari minggu lalu
            </Delta>
          ) : (
            <MutedText>Minggu lalu Rp 0</MutedText>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <dt className="text-[13px] text-muted-foreground">Minggu ini</dt>
            <dd className="font-mono [overflow-wrap:anywhere]">
              {active.current === null ? "—" : rupiah(active.current)}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-[13px] text-muted-foreground">Minggu lalu</dt>
            <dd className="font-mono [overflow-wrap:anywhere]">
              {rupiah(active.previous)}
            </dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}
