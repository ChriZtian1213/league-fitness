import {useState, useEffect} from "react";

function computeLocalToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Returns "today" as a YYYY-MM-DD string in the browser's local timezone.
// Starts from the server's guess (passed in, usually UTC-based) to avoid
// a flash of wrong content, then corrects itself once mounted client-side.
export function useLocalToday(serverGuess: string): string {
    const [today, setToday] = useState(serverGuess);

    useEffect(() => {
        setToday(computeLocalToday());
    }, []);

    return today;
}