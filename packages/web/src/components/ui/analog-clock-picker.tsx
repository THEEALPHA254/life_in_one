import { useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

// Material-style analog clock. Two modes: pick hour → auto-advance to minute.
// Click anywhere on the face — the picker snaps to the nearest hour (30° arcs)
// or minute (6° arcs), so numbered dots are just visual guides, not required
// hit targets.

const SIZE = 220;
const CENTER = SIZE / 2;
const NUMBER_RADIUS = 84;
const HAND_DOT_R = 18;

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + Math.cos(rad) * r, y: CENTER + Math.sin(rad) * r };
}

interface Props {
  hour: number;   // 0-23
  minute: number; // 0-59
  onChange: (v: { hour: number; minute: number }) => void;
}

export function AnalogClockPicker({ hour, minute, onChange }: Props) {
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const isPm = hour >= 12;
  const hour12 = ((hour + 11) % 12) + 1;

  const setHour12 = (h12: number) => {
    const h24 = (h12 % 12) + (isPm ? 12 : 0);
    onChange({ hour: h24, minute });
    setMode("minute");
  };
  const setMinuteVal = (m: number) => onChange({ hour, minute: m });
  const setPm = (pm: boolean) => {
    const h24 = (hour12 % 12) + (pm ? 12 : 0);
    onChange({ hour: h24, minute });
  };

  const handleFaceClick = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const px = (e.clientX - rect.left) * scaleX - CENTER;
    const py = (e.clientY - rect.top) * scaleY - CENTER;
    if (Math.hypot(px, py) < 20) return; // dead zone at center
    const angle = ((Math.atan2(py, px) * 180) / Math.PI + 90 + 360) % 360;
    if (mode === "hour") {
      const h = Math.round(angle / 30) % 12;
      setHour12(h === 0 ? 12 : h);
    } else {
      setMinuteVal(Math.round(angle / 6) % 60);
    }
  };

  const handAngle = mode === "hour" ? (hour12 % 12) * 30 : minute * 6;
  const handEnd = polar(handAngle, NUMBER_RADIUS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-0.5 text-3xl font-semibold tabular-nums">
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              mode === "hour" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Set hour"
          >
            {String(hour12).padStart(2, "0")}
          </button>
          <span className="text-muted-foreground">:</span>
          <button
            type="button"
            onClick={() => setMode("minute")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              mode === "minute" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Set minute"
          >
            {String(minute).padStart(2, "0")}
          </button>
        </div>
        <div className="flex flex-col gap-0.5 text-[10px] font-medium uppercase">
          <button
            type="button"
            onClick={() => setPm(false)}
            className={cn(
              "rounded px-2 py-0.5",
              !isPm ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >AM</button>
          <button
            type="button"
            onClick={() => setPm(true)}
            className={cn(
              "rounded px-2 py-0.5",
              isPm ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >PM</button>
        </div>
      </div>

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto cursor-pointer touch-none select-none"
        onClick={handleFaceClick}
      >
        <circle cx={CENTER} cy={CENTER} r={CENTER - 4} className="fill-muted" />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={handEnd.x}
          y2={handEnd.y}
          className="stroke-primary"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={handEnd.x} cy={handEnd.y} r={HAND_DOT_R} className="fill-primary" />
        {mode === "hour"
          ? Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
              const p = polar((h % 12) * 30, NUMBER_RADIUS);
              const selected = h === hour12;
              return (
                <text
                  key={h}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn(
                    "pointer-events-none select-none text-sm",
                    selected ? "fill-primary-foreground font-semibold" : "fill-foreground",
                  )}
                >
                  {h}
                </text>
              );
            })
          : Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
              const p = polar(m * 6, NUMBER_RADIUS);
              return (
                <text
                  key={m}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none fill-foreground text-sm"
                >
                  {String(m).padStart(2, "0")}
                </text>
              );
            })}
        <circle cx={CENTER} cy={CENTER} r={3} className="fill-primary" />
      </svg>

      <p className="text-center text-xs text-muted-foreground">
        {mode === "hour" ? "Tap to set the hour" : "Tap to set the minute"}
      </p>
    </div>
  );
}
