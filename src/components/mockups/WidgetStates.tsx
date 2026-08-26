import { STATE_VARIANTS, type WidgetState } from "@/lib/widget-tokens";
import { WidgetMock4x2 } from "./WidgetMock4x2";

const STATES: WidgetState[] = ["ok", "refreshing", "stale", "offline", "no-location"];

export function WidgetStates({ zoom = 1 }: { zoom?: number }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {STATES.map((s) => {
        const v = STATE_VARIANTS[s];
        return (
          <figure key={s} className="terminal-box p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <figcaption className="font-display text-xl crt-glow">{`$${s}`}</figcaption>
              <code className="text-[10px] uppercase tracking-widest" style={{ color: v.dot }}>
                {v.code}
              </code>
            </div>
            <div className="overflow-x-auto pb-1">
              <WidgetMock4x2 state={s} zoom={zoom} />
            </div>
          </figure>
        );
      })}
    </div>
  );
}
