import { createWidget, widget, prop, align, show_level } from "@zos/ui";
import { Time } from "@zos/sensor";

const COLOR = 0x888888;
const W = 480;
const SHIFT_PX = 16;
const DEBUG = true; // faster orbit

function toRad(d) {
    return (d * Math.PI) / 180;
}

function vec(deg, amp) {
    const r = toRad(deg);
    return { dx: Math.round(Math.sin(r) * amp), dy: Math.round(-Math.cos(r) * amp) };
}

function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
}

function createWidgetFromBase(base, size) {
    return createWidget(widget.TEXT, {
        ...base,
        text_size: size, color: COLOR,
        align_h: align.CENTER_H, align_v: align.CENTER_V,
        show_level: show_level.ONLY_NORMAL | show_level.ONLY_AOD,
    });
}

WatchFace({
    build() {
        const time = new Time();

        const base_time = { x: 0, y: 180, w: W, h: 100 };
        const base_weekday = { x: 0, y: 120, w: W, h: 80 };
        const base_date = { x: 0, y: 280, w: W, h: 40 };

        const timeText = createWidgetFromBase(base_time, 100);
        const weekdayText = createWidgetFromBase(base_weekday, 32);
        const dateText = createWidgetFromBase(base_date, 24);

        let lastDx = 0, lastDy = 0;
        let lastMin = -1, lastWd = -1;

        const wdNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        const tick = () => {
            let h = time.getFormatHour?.() ?? time.getHours();
            const m = time.getMinutes();
            const s = time.getSeconds?.() ?? 0;

            let am = true;

            if (h > 12) {
                h -= 12;
                am = false;
            }

            let angleDeg;
            if (DEBUG) {
                angleDeg = (s * 30) % 360; // 30° per second
            } else {
                const minutes = h * 60 + m;
                angleDeg = (minutes * 6) % 360; // 6° per minute (360°/60min)
            }

            const { dx, dy } = vec(angleDeg, SHIFT_PX);
            if (dx !== lastDx || dy !== lastDy) {
                timeText.setProperty(prop.MORE, {
                    x: base_time.x + dx, y: base_time.y + dy,
                    w: base_time.w, h: base_time.h
                });
                weekdayText.setProperty(prop.MORE, {
                    x: base_weekday.x + dx, y: base_weekday.y + dy,
                    w: base_weekday.w, h: base_weekday.h
                });
                dateText.setProperty(prop.MORE, {
                    x: base_date.x + dx, y: base_date.y + dy,
                    w: base_date.w, h: base_date.h
                });
                lastDx = dx; lastDy = dy;
            }

            if (m !== lastMin) {
                lastMin = m;
                timeText.setProperty(prop.TEXT, `${pad2(h)}:${pad2(m)}`);
            }

            const wd = time.getDay(); // 1=Mon..7=Sun
            if (wd !== lastWd) {
                lastWd = wd;
                weekdayText.setProperty(prop.TEXT, wdNames[wd - 1]);
            }

            const d = time.getDate();
            const mo = time.getMonth() + 1;
            const y = time.getFullYear();
            dateText.setProperty(prop.TEXT, `${pad2(mo)}/${pad2(d)}/${pad2(y)}`);
        };

        this._timer = setInterval(tick, DEBUG ? 1000 : 60000);
        tick();
    },

    onDestroy() {
        if (this._timer) clearInterval(this._timer);
    }
});
