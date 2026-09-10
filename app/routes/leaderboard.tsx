import type { Route } from "./+types/leaderboard";
import { Link, useLoaderData } from "react-router";
import { requireUserId } from "~/server/session.server";
import {
    getLeaderboard,
    getExerciseCatalog,
    type LeaderboardPeriod,
    type LeaderboardScope,
    type LeaderboardMetric,
} from "~/server/workout.server";
import { NavBar } from "~/components/NavBar";
import type {Category} from "~/types/workout";

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
        requestedScope === "following" || requestedScope === "mutual" ? requestedScope : "global";

    const requestedMetric = url.searchParams.get("metric");
    const metric: LeaderboardMetric =
        requestedMetric === "volume" ? "volume" : "heaviest";

    const category = url.searchParams.get("category");
    const muscle = url.searchParams.get("muscle");
    const exercise = url.searchParams.get("exercise");

    const [leaderboard, catalog] = await Promise.all([
        getLeaderboard(period, scope, metric, userId, category, muscle, exercise),
        getExerciseCatalog(),
    ]);

    const categories = Array.from(new Set(catalog.map((c) => c.category).filter((c): c is Category => !!c))).sort();

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
            if (category && c.category !== category) return false;
            if (muscle && c.muscle !== muscle) return false;
            return true;
        })
        .map((c) => c.exercise);
    const uniqueExercises = Array.from(new Set(exercisesForFilter)).sort();

    return {
        leaderboard, period, scope, metric,
        category, muscle, exercise,
        categories, musclesForCategory, exercises: uniqueExercises,
    };
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
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
        leaderboard, period, scope, metric,
        category, muscle, exercise,
        categories, musclesForCategory, exercises,
    } = useLoaderData<typeof loader>();

    const current = {
        period, scope, metric,
        category: category ?? "", muscle: muscle ?? "", exercise: exercise ?? "",
    };

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

            <div className="flex justify-center gap-6 mb-3 text-sm">
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link to={buildLink(current, {scope: "global"})} className={`px-3 py-1 ${scope === "global" ? "bg-neutral-500" : ""}`}>Global</Link>
                    <Link to={buildLink(current, {scope: "following"})} className={`px-3 py-1 ${scope === "following" ? "bg-neutral-500" : ""}`}>Following</Link>
                    <Link to={buildLink(current, {scope: "mutual"})} className={`px-3 py-1 ${scope === "mutual" ? "bg-neutral-500" : ""}`}>Friends</Link>
                </div>
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link to={buildLink(current, {metric: "heaviest"})} className={`px-3 py-1 ${metric === "heaviest" ? "bg-neutral-500" : ""}`}>Heaviest Lift</Link>
                    <Link to={buildLink(current, {metric: "volume"})} className={`px-3 py-1 ${metric === "volume" ? "bg-neutral-500" : ""}`}>Total Volume</Link>
                </div>
            </div>

            {/* Cascading category -> muscle -> exercise filter */}
            <div className="flex justify-center gap-2 mb-2 text-sm flex-wrap px-4">
                <select
                    className="bg-neutral-700 border border-neutral-500 rounded-md px-2 py-1"
                    value={category ?? ""}
                    onChange={(e) => {
                        window.location.href = buildLink(current, {category: e.target.value, muscle: "", exercise: ""});
                    }}
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
                </select>

                {category && musclesForCategory.length > 0 && (
                    <select
                        className="bg-neutral-700 border border-neutral-500 rounded-md px-2 py-1"
                        value={muscle ?? ""}
                        onChange={(e) => {
                            window.location.href = buildLink(current, {muscle: e.target.value, exercise: ""});
                        }}
                    >
                        <option value="">All Muscles</option>
                        {musclesForCategory.map((m) => <option key={m} value={m}>{capitalize(m)}</option>)}
                    </select>
                )}

                <select
                    className="bg-neutral-700 border border-neutral-500 rounded-md px-2 py-1"
                    value={exercise ?? ""}
                    onChange={(e) => {
                        window.location.href = buildLink(current, {exercise: e.target.value});
                    }}
                >
                    <option value="">All Exercises</option>
                    {exercises.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>

            {(category || muscle || exercise) && (
                <div className="flex justify-center mb-6">
                    <Link
                        to={buildLink(current, {category: "", muscle: "", exercise: ""})}
                        className="text-xs text-neutral-400 underline"
                    >
                        Clear filters
                    </Link>
                </div>
            )}

            <div className="flex flex-col items-center gap-2 px-4">
                {leaderboard.length === 0 && <p>No matching logs for this filter.</p>}

                {leaderboard.map((entry, index) => (
                    <Link
                        key={entry.userId}
                        to={`/profile/${entry.userId}`}
                        className="flex justify-between w-full max-w-md border-b border-neutral-600 py-2 hover:bg-neutral-700"
                    >
                        <span>#{index + 1} {entry.displayName}</span>
                        <span>
                            {entry.value.toLocaleString()} lbs
                            {metric === "heaviest" && entry.exercise && (
                                <span className="text-neutral-400 text-sm"> — {entry.exercise}</span>
                            )}
                        </span>
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}