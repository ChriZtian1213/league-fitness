import type { Route } from "./+types/leaderboard";
import { useEffect } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { requireUserId } from "~/server/session.server";
import { getUserById } from "~/server/user.server";
import {
    getLeaderboard,
    getExerciseCatalog,
    getLiftingExerciseOverview,
    getCardioExerciseOverview,
    getCardioLeaderboard,
    type LeaderboardPeriod,
    type LeaderboardScope,
    type CardioMetric,
} from "~/server/workout.server";
import { NavBar } from "~/components/NavBar";
import type {Category} from "~/types/workout";

function rankLabel(index: number): string {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function loader({ request }: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    const url = new URL(request.url);
    const overviewSearch = url.searchParams.get("q") ?? "";

    const requestedPeriod = url.searchParams.get("period");
    const period: LeaderboardPeriod =
        requestedPeriod === "month" || requestedPeriod === "all"
            ? requestedPeriod
            : "week";

    const requestedScope = url.searchParams.get("scope");
    const scope: LeaderboardScope =
        requestedScope === "following" || requestedScope === "mutual" ? requestedScope : "global";

    const requestedMode = url.searchParams.get("mode");
    const mode: "lifting" | "cardio" = requestedMode === "cardio" ? "cardio" : "lifting";

    const category = url.searchParams.get("category");
    const muscle = url.searchParams.get("muscle");
    const exercise = url.searchParams.get("exercise");

    const requestedCardioMetric = url.searchParams.get("cardioMetric");

    const catalog = await getExerciseCatalog();

    const categories = Array.from(
        new Set(
            catalog
                .map((c) => c.category)
                .filter((c): c is Category => !!c && c !== "cardio")
        )
    ).sort();

    const musclesForCategory = category
        ? Array.from(
            new Set(
                catalog
                    .filter((c) => c.category === category && c.muscle)
                    .map((c) => c.muscle as string)
            )
        ).sort()
        : [];

    const exercisesForFilter = catalog
        .filter((c) => {
            if (c.category === "cardio") return false;
            if (category && c.category !== category) return false;
            if (muscle && c.muscle !== muscle) return false;
            return true;
        })
        .map((c) => c.exercise);
    const uniqueExercises = Array.from(new Set(exercisesForFilter)).sort();

    let leaderboard: any[] = [];
    let liftingOverview: any[] = [];
    let cardioOverview: any[] = [];
    let cardioMetric: CardioMetric = "distance";

    if (mode === "lifting") {
        if (exercise) {
            leaderboard = await getLeaderboard(period, scope, userId, category, muscle, exercise);
        } else {
            liftingOverview = await getLiftingExerciseOverview(period, scope, userId, category, muscle);
            if (overviewSearch.trim()) {
                liftingOverview = liftingOverview.filter((e) =>
                    e.exercise.toLowerCase().includes(overviewSearch.toLowerCase())
                );
            }
        }
    } else {
        if (exercise) {
            const isStairMaster = exercise === "Stair Master";
            cardioMetric = isStairMaster
                ? "steps"
                : requestedCardioMetric === "speed"
                    ? "speed"
                    : "distance";
            leaderboard = await getCardioLeaderboard(period, scope, userId, exercise, cardioMetric);
        } else {
            cardioOverview = await getCardioExerciseOverview(period, scope, userId);
            if (overviewSearch.trim()) {
                cardioOverview = cardioOverview.filter((e) =>
                    e.exercise.toLowerCase().includes(overviewSearch.toLowerCase())
                );
            }
        }
    }

    return {
        leaderboard, liftingOverview, cardioOverview, cardioMetric,
        period, scope, mode,
        category, muscle, exercise,
        categories, musclesForCategory, exercises: uniqueExercises, overviewSearch
    };
}

function buildLink(
    current: Record<string, string>,
    changes: Partial<Record<string, string>>
) {
    const merged = { ...current, ...changes };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
        if (value) params.set(key, value);
    }
    return `?${params.toString()}`;
}

export default function Leaderboard() {
    const {
        leaderboard, liftingOverview, cardioOverview, cardioMetric,
        period, scope, mode,
        category, muscle, exercise,
        categories, musclesForCategory, exercises, overviewSearch
    } = useLoaderData<typeof loader>();

    const [searchParams, setSearchParams] = useSearchParams();

    const current = {
        period, scope, mode,
        category: category ?? "", muscle: muscle ?? "", exercise: exercise ?? "",
        q: overviewSearch,
    };

    const isStairMaster = exercise === "Stair Master";

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                Leaderboard
            </div>

            <div className="flex justify-center gap-4 mb-3">
                <Link to={buildLink(current, {period: "week"})} className={period === "week" ? "underline font-bold" : ""}>This Week</Link>
                <Link to={buildLink(current, {period: "month"})} className={period === "month" ? "underline font-bold" : ""}>This Month</Link>
                <Link to={buildLink(current, {period: "all"})} className={period === "all" ? "underline font-bold" : ""}>All Time</Link>
            </div>

            <div className="flex justify-center gap-2 mb-3 text-sm">
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link to={buildLink(current, {scope: "global"})} className={`px-3 py-1 text-center ${scope === "global" ? "bg-neutral-500" : ""}`}>Global</Link>
                    <Link to={buildLink(current, {scope: "following"})} className={`px-3 py-1 text-center ${scope === "following" ? "bg-neutral-500" : ""}`}>Following</Link>
                    <Link to={buildLink(current, {scope: "mutual"})} className={`px-3 py-1 text-center ${scope === "mutual" ? "bg-neutral-500" : ""}`}>Friends</Link>
                </div>
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link to={buildLink(current, {mode: "lifting", exercise: ""})} className={`px-3 py-1 text-center ${mode === "lifting" ? "bg-neutral-500" : ""}`}>Lifting</Link>
                    <Link to={buildLink(current, {mode: "cardio", exercise: ""})} className={`px-3 py-1 text-center ${mode === "cardio" ? "bg-neutral-500" : ""}`}>Cardio</Link>
                </div>
            </div>

            {mode === "lifting" && !exercise && (
                <>
                    <div className="flex justify-center gap-2 mb-2 text-sm flex-wrap px-4 items-center">
                        <div className="flex border border-neutral-500 rounded-md overflow-hidden text-sm">
                            <Link
                                to={buildLink(current, {category: "", muscle: ""})}
                                className={`px-3 py-1.5 ${!category ? "bg-neutral-500" : ""}`}
                            >
                                All
                            </Link>
                            <Link
                                to={buildLink(current, {category: "upper", muscle: ""})}
                                className={`px-3 py-1.5 ${category === "upper" ? "bg-neutral-500" : ""}`}
                            >
                                Upper
                            </Link>
                            <Link
                                to={buildLink(current, {category: "lower", muscle: ""})}
                                className={`px-3 py-1.5 ${category === "lower" ? "bg-neutral-500" : ""}`}
                            >
                                Lower
                            </Link>
                        </div>

                        <select
                            className={`bg-neutral-700 border border-neutral-500 rounded-md px-2 py-1 w-40 ${
                                !category || musclesForCategory.length === 0 ? "invisible pointer-events-none" : ""
                            }`}
                            value={muscle ?? ""}
                            onChange={(e) => {
                                window.location.href = buildLink(current, {muscle: e.target.value});
                            }}
                        >
                            <option value="">All Muscles</option>
                            {musclesForCategory.map((m) => <option key={m} value={m}>{capitalize(m)}</option>)}
                        </select>

                        <Link
                            to={buildLink(current, {category: "", muscle: "", q: ""})}
                            className={`text-xs text-neutral-400 underline ${
                                !(category || muscle || overviewSearch) ? "invisible pointer-events-none" : ""
                            }`}
                        >
                            Clear
                        </Link>
                    </div>
                    <div className="flex justify-center px-4 mb-3">
                        <input
                            key={overviewSearch}
                            defaultValue={overviewSearch}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                if (e.target.value) params.set("q", e.target.value);
                                else params.delete("q");
                                setSearchParams(params, {replace: true});
                            }}
                            placeholder="Search exercises..."
                            className="w-full max-w-md border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex justify-between w-full max-w-md mx-auto text-xs text-neutral-400 mb-1">
                        <span>Exercise</span>
                        <span>User — Weight lifted</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 px-4">
                        {liftingOverview.length === 0 && <p>No matching logs for this filter.</p>}
                        {liftingOverview.map((entry) => (
                            <Link
                                key={entry.exercise}
                                to={buildLink(current, {exercise: entry.exercise})}
                                className="flex justify-between w-full max-w-md border-b border-neutral-600 py-2 hover:bg-neutral-700"
                            >
                                <span className="font-bold">{entry.exercise}</span>
                                <span>{entry.displayName} — {entry.value} lbs</span>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {mode === "lifting" && exercise && (
                <div className="flex flex-col items-center gap-2 px-4">
                    <div className="flex justify-between w-full max-w-md items-center mb-2">
                        <p className="font-bold text-lg">{exercise}</p>
                        <Link to={buildLink(current, {exercise: ""})} className="text-xs text-neutral-400 underline">
                            Back to all exercises
                        </Link>
                    </div>
                    {leaderboard.length === 0 && <p>No logs for this exercise yet.</p>}
                    {leaderboard.map((entry: any, index: number) => (
                        <Link
                            key={entry.userId}
                            to={`/profile/${entry.userId}`}
                            className="flex justify-between w-full max-w-md border-b border-neutral-600 py-2 hover:bg-neutral-700"
                        >
                            <span>{rankLabel(index)} {entry.displayName}</span>
                            <span>{entry.value.toLocaleString()} lbs</span>
                        </Link>
                    ))}
                </div>
            )}

            {mode === "cardio" && !exercise && (
                <>
                    <div className="flex justify-center px-4 mb-3">
                        <input
                            defaultValue={overviewSearch}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                if (e.target.value) params.set("q", e.target.value);
                                else params.delete("q");
                                setSearchParams(params, {replace: true});
                            }}
                            placeholder="Search exercises..."
                            className="w-full max-w-md border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex justify-between w-full max-w-md mx-auto px-4 text-xs text-neutral-400 mb-1">
                        <span>Exercise</span>
                        <span>User — Best</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 px-4">
                        {cardioOverview.length === 0 && <p>No cardio logs yet.</p>}
                        {cardioOverview.map((entry: any) => (
                            <Link
                                key={entry.exercise}
                                to={buildLink(current, {exercise: entry.exercise})}
                                className="flex justify-between w-full max-w-md border-b border-neutral-600 py-2 hover:bg-neutral-700"
                            >
                                <span className="font-bold">{entry.exercise}</span>
                                <span>{entry.displayName} — {entry.displayValue}</span>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {mode === "cardio" && exercise && (
                <div className="flex flex-col items-center gap-2 px-4">
                    <div className="flex justify-between w-full max-w-md items-center mb-2">
                        <p className="font-bold text-lg">{exercise}</p>
                        <Link to={buildLink(current, {exercise: ""})} className="text-xs text-neutral-400 underline">
                            Back to all exercises
                        </Link>
                    </div>

                    {!isStairMaster && (
                        <div className="flex border border-neutral-500 rounded-md overflow-hidden mb-2 text-sm">
                            <Link to={buildLink(current, {cardioMetric: "distance"})} className={`px-3 py-1 ${cardioMetric === "distance" ? "bg-neutral-500" : ""}`}>Distance</Link>
                            <Link to={buildLink(current, {cardioMetric: "speed"})} className={`px-3 py-1 ${cardioMetric === "speed" ? "bg-neutral-500" : ""}`}>Speed</Link>
                        </div>
                    )}

                    {leaderboard.length === 0 && <p>No logs for this exercise yet.</p>}
                    {leaderboard.map((entry: any, index: number) => (
                        <Link
                            key={entry.userId}
                            to={`/profile/${entry.userId}`}
                            className="flex justify-between w-full max-w-md border-b border-neutral-600 py-2 hover:bg-neutral-700"
                        >
                            <span>{rankLabel(index)} {entry.displayName}</span>
                            <span>{entry.displayValue}</span>
                        </Link>
                    ))}
                </div>
            )}

            <NavBar />
        </div>
    );
}