import {Link} from "react-router";

type Props = {
    year: number;
    month: number; // 1-12
    loggedDates: string[]; // "YYYY-MM-DD" strings
};

function pad(n: number) {
    return String(n).padStart(2, "0");
}

export function WorkoutCalendar({year, month, loggedDates}: Props) {
    const loggedSet = new Set(loggedDates);

    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeekday = firstOfMonth.getDay(); // 0 = Sunday

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const todayDate = today.getDate();

    const monthLabel = firstOfMonth.toLocaleString("default", {month: "long", year: "numeric"});

    // Build prev/next month params
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const cells: (number | null)[] = [
        ...Array(startWeekday).fill(null),
        ...Array.from({length: daysInMonth}, (_, i) => i + 1),
    ];

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2 px-2">
                <Link
                    to={`?year=${prevYear}&month=${prevMonth}`}
                    className="px-2 py-1 border rounded-md"
                >
                    ‹
                </Link>
                <p className="font-bold">{monthLabel}</p>
                <Link
                    to={`?year=${nextYear}&month=${nextMonth}`}
                    className="px-2 py-1 border rounded-md"
                >
                    ›
                </Link>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i}>{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (day === null) return <div key={i} />;

                    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
                    const isLogged = loggedSet.has(dateStr);
                    const isToday = isCurrentMonth && day === todayDate;

                    return (
                        <div
                            key={i}
                            className={`aspect-square flex items-center justify-center rounded-md text-sm
                                ${isLogged ? "bg-green-700 text-white font-bold" : "bg-neutral-700 text-neutral-300"}
                                ${isToday ? "ring-2 ring-blue-400" : ""}
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}