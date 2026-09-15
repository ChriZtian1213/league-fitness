import { useState, useRef } from "react"
import type { Exercise } from "../types/exercise.ts";
import type {WorkoutEntry} from "../types/workoutEntry.ts";

type Props = {
    exercise: Exercise
    personalBest: WorkoutEntry | null
    onSubmit: (workout: WorkoutEntry) => void
    onBack: () => void
    onHome: () => void
}

function formatBest(best: WorkoutEntry): string {
    if (best.weight != null && best.reps != null) {
        return `${best.weight} lbs × ${best.reps}`;
    }
    if (best.steps != null) {
        return `${best.steps} steps`;
    }
    return `${best.distance} mi in ${best.time}`;
}

export function LogStep({exercise, onSubmit, onBack, onHome, personalBest}: Props) {
    const isStairMaster = exercise.name === "Stair Master";

    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");

    const [distance, setDistance] = useState("");
    const [time, setTime] = useState("");
    const [steps, setSteps] = useState("");
    const [usePlateCalc, setUsePlateCalc] = useState(false);
    const [barWeight, setBarWeight] = useState("45");
    const [perSideWeight, setPerSideWeight] = useState("");

    const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5];

    const [plateCounts, setPlateCounts] = useState<Record<number, number>>({});

    function addPlate(size: number) {
        setPlateCounts((prev) => ({ ...prev, [size]: (prev[size] ?? 0) + 1 }));
    }

    function removePlate(size: number) {
        setPlateCounts((prev) => {
            const current = prev[size] ?? 0;
            if (current <= 0) return prev;
            return { ...prev, [size]: current - 1 };
        });
    }

    function resetPlates() {
        setPlateCounts({});
    }

    const perSideFromPlates = Object.entries(plateCounts).reduce(
        (sum, [size, count]) => sum + Number(size) * count,
        0
    );

    const weightInputRef = useRef<HTMLInputElement>(null);
    const repsInputRef = useRef<HTMLInputElement>(null);
    const distanceInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);
    const stepsInputRef = useRef<HTMLInputElement>(null);

    function normalizeTime(input: string){
        const trimmed = input.trim();
        if (/^\d+$/.test(trimmed)) {
            return `${trimmed}:00`;
        }
        if (/^\d+:\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        if (/^\d+:\d{2}:\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        return null;
    }

    function handleSubmit(): boolean {
        if (isStairMaster) {
            const stepsNumber = Number(steps);
            if (!steps) {
                alert("Please enter steps");
                return false;
            }
            if (stepsNumber <= 0) {
                alert("Steps must be greater than 0");
                return false;
            }

            const workout: WorkoutEntry = {
                id: crypto.randomUUID(),
                exercise: exercise.name,
                category: exercise.category,
                muscle: exercise.muscle,
                steps: stepsNumber,
                createdAt: new Date()
            }

            onSubmit(workout);
            setSteps("");
            return true;
        }

        if (exercise.category === "cardio"){
            const normalizedTime = normalizeTime(time);
            const distanceNumber = Number(distance);
            if (!distance || !time){
                alert("Please fill in all fields");
                return false;
            }
            if (distanceNumber <= 0){
                alert("Distance must be greater than 0");
                return false;
            }
            if (!normalizedTime){
                alert("Time must be mm or mm:ss");
                return false;
            }

            const workout: WorkoutEntry = {
                id: crypto.randomUUID(),
                exercise: exercise.name,
                category: exercise.category,
                muscle: exercise.muscle,
                distance: Number(distance),
                time: normalizedTime,
                createdAt: new Date()
            }

            onSubmit(workout);

            setDistance("");
            setTime("");
            return true;

        } else {
            const effectiveWeight = usePlateCalc
                ? (Number(barWeight) || 0) + perSideFromPlates * 2
                : Number(weight);

            const repsNumber = Number(reps);

            if (usePlateCalc ? perSideFromPlates === 0 : !weight) {
                alert("Please fill in all fields");
                return false;
            }

            if (!reps) {
                alert("Please fill in all fields");
                return false;
            }

            if (effectiveWeight <= 0 || repsNumber <= 0){
                alert("Weight and reps must be greater than 0");
                return false;
            }

            const workout: WorkoutEntry = {
                id: crypto.randomUUID(),
                exercise: exercise.name,
                category: exercise.category,
                muscle: exercise.muscle,
                weight: effectiveWeight,
                reps: Number(reps),
                createdAt: new Date()
            }

            onSubmit(workout);

            setWeight("")
            setReps("")
            setPerSideWeight("")
            setPlateCounts({});
            return true;
        }
    }

    function handleWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            repsInputRef.current?.focus();
        }
    }

    function handleRepsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (handleSubmit()) {
                weightInputRef.current?.focus();
            }
        }
    }

    function handleBarWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            repsInputRef.current?.focus();
        }
    }

    function handleDistanceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            timeInputRef.current?.focus();
        }
    }

    function handleTimeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (handleSubmit()) {
                distanceInputRef.current?.focus();
            }
        }
    }

    function handleStepsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (handleSubmit()) {
                stepsInputRef.current?.focus();
            }
        }
    }

    function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6); // up to hhmmss
        let formatted = digitsOnly;

        if (digitsOnly.length > 4) {
            // h:mm:ss
            const hours = digitsOnly.slice(0, digitsOnly.length - 4);
            const minutes = digitsOnly.slice(-4, -2);
            const seconds = digitsOnly.slice(-2);
            formatted = `${hours}:${minutes}:${seconds}`;
        } else if (digitsOnly.length > 2) {
            // mm:ss
            formatted = `${digitsOnly.slice(0, digitsOnly.length - 2)}:${digitsOnly.slice(-2)}`;
        }

        setTime(formatted);
    }

    const inputClass = "border rounded-md px-3 py-2 bg-transparent text-neutral-200 w-32 text-center";

    return (
        <div className={"flex flex-col items-center gap-2"}>

            <h2 className={"text-2xl font-bold"}>{exercise.name}</h2>

            {personalBest && (
                <p className="text-sm text-yellow-400 text-center">
                    🏆 Personal best: {formatBest(personalBest)}
                </p>
            )}

            {isStairMaster ? (
                <div className="flex gap-2">
                    <input
                        ref={stepsInputRef}
                        type="number"
                        placeholder="Steps"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        onKeyDown={handleStepsKeyDown}
                        className={inputClass}
                    />
                </div>
            ) : exercise.category === "cardio" ? (
                <div className="flex gap-2">
                    <input
                        ref={distanceInputRef}
                        type="number"
                        inputMode="decimal"
                        placeholder="Distance (mi)"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        onKeyDown={handleDistanceKeyDown}
                        className={inputClass}
                    />

                    <input
                        ref={timeInputRef}
                        inputMode="numeric"
                        type="text"
                        placeholder="Time (h:mm:ss)"
                        value={time}
                        onChange={handleTimeChange}
                        onKeyDown={handleTimeKeyDown}
                        className={inputClass}
                    />
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setUsePlateCalc((v) => !v)}
                        className="text-xs text-blue-400 underline"
                    >
                        {usePlateCalc ? "Enter total weight instead" : "Use plate calculator"}
                    </button>

                    {usePlateCalc ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex flex-col sm:flex-row gap-2 items-center sm:items-end">
                                <div className="flex flex-col items-center">
                                    <label className="text-xs text-neutral-400">Bar/base</label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={barWeight}
                                        onChange={(e) => setBarWeight(e.target.value)}
                                        onKeyDown={handleBarWeightKeyDown}
                                        onFocus={(e) => e.target.select()}
                                        className={inputClass}
                                    />
                                </div>
                                <p className="font-bold sm:pb-2">+</p>
                                <div className="flex flex-col items-center">
                                    <label className="text-xs text-neutral-400">Per side</label>
                                    <input
                                        type="number"
                                        value={perSideFromPlates}
                                        readOnly
                                        className={`${inputClass} bg-neutral-700`}
                                    />
                                </div>
                                <p className="font-bold sm:pb-2">x2 =</p>
                                <div className="flex flex-col items-center">
                                    <label className="text-xs text-yellow-400">Total</label>
                                    <div className={`${inputClass} bg-neutral-700 text-yellow-400 font-bold flex items-center justify-center`}>
                                        {(Number(barWeight) || 0) + perSideFromPlates * 2}
                                    </div>
                                </div>
                                <p className="font-bold sm:pb-2">x</p>
                                <div className="flex flex-col items-center">
                                    <label className="text-xs text-neutral-400">Reps</label>
                                    <input
                                        ref={repsInputRef}
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="Reps"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        onKeyDown={handleRepsKeyDown}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-neutral-400">Plates (per side)</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {PLATE_SIZES.map((size) => (
                                    <div key={size} className="flex flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => addPlate(size)}
                                            className="size-14 border rounded-md bg-neutral-700 font-bold text-sm hover:bg-neutral-600"
                                        >
                                            {size}
                                        </button>
                                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                                            <button
                                                type="button"
                                                onClick={() => removePlate(size)}
                                                className="px-1 border rounded"
                                                disabled={!plateCounts[size]}
                                            >
                                                −
                                            </button>
                                            <span>x{plateCounts[size] ?? 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={resetPlates}
                                disabled={!Object.values(plateCounts).some((c) => c > 0)}
                                className="text-xs text-red-400 underline disabled:opacity-0 disabled:cursor-default h-4"
                            >
                                Reset plates
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">
                            <input
                                ref={weightInputRef}
                                type="number"
                                inputMode="decimal"
                                placeholder="Weight (lbs)"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                onKeyDown={handleWeightKeyDown}
                                className={inputClass}
                            />

                            <p className="font-bold">x</p>

                            <input
                                ref={repsInputRef}
                                type="number"
                                inputMode="numeric"
                                placeholder="Reps"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                onKeyDown={handleRepsKeyDown}
                                className={inputClass}
                            />
                        </div>
                    )}
                </>
            )}
            <button
                className={"size-24 border bg-green-700"}
                onClick={handleSubmit}>
                Save Workout
            </button>

            <div className="flex flex-row">
                <button
                    className={"mt-4 size-16 border"}
                    onClick={onBack}>
                    🔙 Return
                </button>
                <button
                    className="mt-4 size-16 border"
                    onClick={onHome}
                >
                    Home
                </button>
            </div>
        </div>
    )
}