import {useEffect, useState} from "react";
import {Form} from "react-router";

export function CooldownTimer({initialSeconds}: {initialSeconds: number}) {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    useEffect(() => {
        setSecondsLeft(initialSeconds);
        if (initialSeconds <= 0) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [initialSeconds]);

    if (secondsLeft <= 0) {
        return (
            <Form method="post" action="/resend-verification">
                <button type="submit" className="underline">Resend verification email</button>
            </Form>
        );
    }

    return <p className="text-xs text-neutral-200">Resend available in {secondsLeft}s</p>;
}