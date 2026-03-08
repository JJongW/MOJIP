import { useMemo } from "react";
import type { WorkspaceTask } from "@/lib/types";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const MONTHS = ["3월", "4월", "5월", "6월", "7월", "8월"];

/** 해당 닉네임의 완료일별 건수 { "YYYY-MM-DD": count } */
function getCompletionCountByDate(tasks: WorkspaceTask[], nickname: string): Record<string, number> {
  const map: Record<string, number> = {};
  tasks
    .filter((t) => t.status === "completed" && t.completedBy === nickname && t.completedAt)
    .forEach((t) => {
      const date = t.completedAt!.slice(0, 10);
      map[date] = (map[date] || 0) + 1;
    });
  return map;
}

/** 날짜의 요일 (0=일, 1=월, ...) */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDay();
}

/** 그리드용: 3~8월, 주별로 해당 요일 셀에 값 넣기. [monthIndex][weekIndex][dayOfWeek] = count */
function buildGrid(countByDate: Record<string, number>): number[][][] {
  const grid: number[][][] = MONTHS.map(() =>
    Array(5)
      .fill(0)
      .map(() => Array(7).fill(0))
  );
  Object.entries(countByDate).forEach(([dateStr, count]) => {
    const [y, m] = dateStr.split("-").map(Number);
    const monthIndex = m - 3; // 3월=0, 8월=5
    if (monthIndex < 0 || monthIndex > 5) return;
    const dayOfWeek = getDayOfWeek(dateStr); // 0~6
    const d = new Date(y, m - 1, parseInt(dateStr.slice(8, 10), 10)).getDate();
    const weekIndex = Math.min(Math.floor((d - 1) / 7), 4);
    grid[monthIndex][weekIndex][dayOfWeek] = (grid[monthIndex][weekIndex][dayOfWeek] || 0) + count;
  });
  return grid;
}

function getIntensity(maxVal: number, val: number): number {
  if (maxVal <= 0) return 0;
  if (val <= 0) return 0;
  const ratio = val / maxVal;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

interface Props {
  nickname: string;
  tasks: WorkspaceTask[];
  color: string;
  onColorChange: (color: string) => void;
}

export default function IndividualHeatmap({ nickname, tasks, color, onColorChange }: Props) {
  const countByDate = useMemo(() => getCompletionCountByDate(tasks, nickname), [tasks, nickname]);
  const totalCompleted = useMemo(
    () => tasks.filter((t) => t.status === "completed" && t.completedBy === nickname).length,
    [tasks, nickname]
  );
  const grid = useMemo(() => buildGrid(countByDate), [countByDate]);
  const maxVal = useMemo(() => {
    let m = 0;
    grid.forEach((month) =>
      month.forEach((week) =>
        week.forEach((v) => {
          if (v > m) m = v;
        })
      )
    );
    return m;
  }, [grid]);

  return (
    <div className="glass rounded-xl p-4 border-white/10">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-medium text-foreground">
          {nickname} ({totalCompleted}건 완료) 히트맵
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">색상</span>
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-7 h-7 rounded border border-white/20 cursor-pointer bg-transparent"
            title={`${nickname} 히트맵 색상`}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-normal pr-1"></th>
              {MONTHS.map((m) => (
                <th key={m} className="text-center text-muted-foreground font-normal px-0.5">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((_, dayIndex) => (
              <tr key={dayIndex}>
                <td className="text-muted-foreground pr-1 align-middle">{WEEKDAYS[dayIndex]}</td>
                {MONTHS.map((_, monthIndex) => (
                  <td key={monthIndex} className="p-0.5">
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((weekIndex) => {
                        const val = grid[monthIndex]?.[weekIndex]?.[dayIndex] ?? 0;
                        const intensity = getIntensity(maxVal, val);
                        const opacity = intensity === 0 ? 0.15 : 0.25 + intensity * 0.2;
                        return (
                          <div
                            key={weekIndex}
                            className="w-3 h-3 rounded-sm border border-white/10 flex-shrink-0"
                            style={{
                              backgroundColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
                            }}
                            title={val > 0 ? `${val}건` : ""}
                          />
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-muted-foreground text-xs">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => {
          const opacity = i === 0 ? 0.15 : 0.3 + i * 0.2;
          const hexAlpha = Math.round(opacity * 255).toString(16).padStart(2, "0");
          return (
            <div
              key={i}
              className="w-3 h-3 rounded-sm border border-white/10"
              style={{ backgroundColor: `${color}${hexAlpha}` }}
            />
          );
        })}
        <span>More</span>
      </div>
    </div>
  );
}
