import type { Route } from "./+types/leaderboard";
import { Link, useLoaderData } from "react-router";
import { requireUserId } from "~/server/session.server";
import {
    getLeaderboard,
    getLoggedExerciseNames,
    type LeaderboardPeriod,
    type LeaderboardScope,
    type LeaderboardMetric,
} from "~/server/workout.server";
import { NavBar } from "~/components/NavBar";

export async function loader({ request }: Route.LoaderArgs) {
    const userId = await requireUserId(request);

    const url = new URL(request.url);

    const requestedPeriod = url.searchParams.get("period");
    const period: LeaderboardPeriod =
        requestedPeriod === "week" || requestedPeriod === "month"
            ? requestedPeriod
            : "all";

    const requestedScope = url.searchParams.get("scope");
    const scope: LeaderboardScope =
        requestedScope === "friends" ? "friends" : "global";

    const requestedMetric = url.searchParams.get("metric");
    const metric: LeaderboardMetric =
        requestedMetric === "heaviest" ? "heaviest" : "volume";

    const exercise = url.searchParams.get("exercise"); // null = all exercises

    const [leaderboard, exerciseNames] = await Promise.all([
        getLeaderboard(period, scope, metric, userId, exercise),
        getLoggedExerciseNames(),
    ]);

    return { leaderboard, period, scope, metric, exercise, exerciseNames };
}

function buildLink(
    current: { period: string; scope: string; metric: string; exercise: string },
    changes: Partial<{ period: string; scope: string; metric: string; exercise: string }>
) {
    const merged = { ...current, ...changes };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
        if (value) params.set(key, value);
    }
    return `?${params.toString()}`;
}

export default function Leaderboard() {
    const { leaderboard, period, scope, metric, exercise, exerciseNames } =
        useLoaderData<typeof loader>();
    const current = { period, scope, metric, exercise: exercise ?? "" };

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                Leaderboard
            </div>

            <div className="flex justify-center gap-4 mb-3">
                <Link
                    to={buildLink(current, { period: "week" })}
                    className={period === "week" ? "underline font-bold" : ""}
                >
                    This Week
                </Link>
                <Link
                    to={buildLink(current, { period: "month" })}
                    className={period === "month" ? "underline font-bold" : ""}
                >
                    This Month
                </Link>
                <Link
                    to={buildLink(current, { period: "all" })}
                    className={period === "all" ? "underline font-bold" : ""}
                >
                    All Time
                </Link>
            </div>

            <div className="flex justify-center gap-6 mb-3 text-sm">
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link
                        to={buildLink(current, { scope: "global" })}
                        className={`px-3 py-1 ${scope === "global" ? "bg-neutral-500" : ""}`}
                    >
                        Global
                    </Link>
                    <Link
                        to={buildLink(current, { scope: "friends" })}
                        className={`px-3 py-1 ${scope === "friends" ? "bg-neutral-500" : ""}`}
                    >
                        Friends
                    </Link>
                </div>

                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link
                        to={buildLink(current, { metric: "volume" })}
                        className={`px-3 py-1 ${metric === "volume" ? "bg-neutral-500" : ""}`}
                    >
                        Total Volume
                    </Link>
                    <Link
                        to={buildLink(current, { metric: "heaviest" })}
                        className={`px-3 py-1 ${metric === "heaviest" ? "bg-neutral-500" : ""}`}
                    >
                        Heaviest Lift
                    </Link>
                </div>
            </div>

            {/* Exercise filter — a plain <select> navigates via a small client script below */}
            <div className="flex justify-center mb-6 text-sm">
                <select
                    className="bg-neutral-700 border border-neutral-500 rounded-md px-2 py-1"
                    value={exercise ?? ""}
                    onChange={(e) => {
                        window.location.href = buildLink(current, { exercise: e.target.value });
                    }}
                >
                    <option value="">All Exercises</option>
                    {exerciseNames.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col items-center gap-2 px-4">
                {leaderboard.length === 0 && (
                    <p>
                        {exercise
                            ? `No ${exercise} logs yet for this period.`
                            : scope === "friends"
                                ? "No friend activity for this period yet."
                                : "No logged lifts yet for this period."}
                    </p>
                )}

                {leaderboard.map((entry, index) => (
                    <div
                        key={entry.userId}
                        className="flex justify-between w-full max-w-md border-b border-neutral-600 py-2"
                    >
                        <span>#{index + 1} {entry.displayName}</span>
                        <span>{entry.value.toLocaleString()} lbs</span>
                    </div>
                ))}
            </div>

            <NavBar />
        </div>
    );
}