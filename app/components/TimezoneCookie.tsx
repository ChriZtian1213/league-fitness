import { useEffect } from "react";
import { useRevalidator } from "react-router";

export function TimezoneCookie() {
    const revalidator = useRevalidator();

    useEffect(() => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (!timezone) return;

        const encodedTimezone = encodeURIComponent(timezone);

        if (!document.cookie.includes(`timezone=${encodedTimezone}`)) {
            document.cookie =
                `timezone=${encodedTimezone}; path=/; max-age=31536000; SameSite=Lax`;

            revalidator.revalidate();
        }
    }, [revalidator]);

    return null;
}