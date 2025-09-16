import { createWidget, widget, prop, align, show_level } from "@zos/ui";
import { Time } from "@zos/sensor";

const COLOR = 0x888888;
const W = 480;
const SHIFT_PX = 16;
const DEBUG = false;

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
        const base_ampm = { x: 380, y: 180, w: W, h: 100 };

        const timeText = createWidgetFromBase(base_time, 100);
        const weekdayText = createWidgetFromBase(base_weekday, 32);
        const dateText = createWidgetFromBase(base_date, 32);

        const ampmText = createWidget(widget.TEXT, {
            ...base_ampm,
            text_size: 32, color: COLOR,
            align_h: align.LEFT, align_v: align.CENTER_V,
            show_level: show_level.ONLY_NORMAL | show_level.ONLY_AOD,
        });

        let lastDy = 0;
        let lastMin = -1;
        let lastWd = -1;

        const wdNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        const tick = () => {
            let h = time.getFormatHour?.() ?? time.getHours();
            const m = time.getMinutes();
            const s = time.getSeconds?.() ?? 0;
            let am = time.am;

            if (h > 12) {
                h -= 12;
                am = false;
            }

            const cycle = DEBUG ? 5 : 3600;
            const totalSec = time.getHours() * 3600 + m * 60 + s;
            const t = (totalSec % cycle) / cycle;
            const tri = t < 0.5 ? (t * 2) : (2 - t * 2);
            const dy = Math.round((tri * 2 - 1) * SHIFT_PX);

            if (dy !== lastDy) {
                timeText.setProperty(prop.MORE, { x: base_time.x, y: base_time.y + dy, w: base_time.w, h: base_time.h });
                weekdayText.setProperty(prop.MORE, { x: base_weekday.x, y: base_weekday.y + dy, w: base_weekday.w, h: base_weekday.h });
                dateText.setProperty(prop.MORE, { x: base_date.x, y: base_date.y + dy, w: base_date.w, h: base_date.h });
                ampmText.setProperty(prop.MORE, { x: base_ampm.x, y: base_ampm.y + dy, w: base_ampm.w, h: base_ampm.h });
                lastDy = dy;
            }

            if (m !== lastMin) {
                lastMin = m;
                timeText.setProperty(prop.TEXT, `${pad2(h)}:${pad2(m)}`);
                ampmText.setProperty(prop.TEXT, am ? "AM" : "PM");
            }

            const wd = time.getDay(); // 1=Mon..7=Sun
            if (wd !== lastWd) {
                lastWd = wd;
                weekdayText.setProperty(prop.TEXT, wdNames[wd - 1]);
            }

            const d = time.getDate();
            const mo = time.getMonth();
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
