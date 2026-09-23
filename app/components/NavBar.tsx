import {NavLink} from "react-router";

type Props = {
    isGuest?: boolean;
}

export function NavBar({ isGuest = false }: Props) {

    const linkClass = ({isActive}: {isActive: boolean}) =>
        `flex flex-1 flex-col items-center justify-center gap-1 border-r border-gray-600 text-center py-1 ${
            isActive ? "text-white" : "text-gray-400"
        }`;

    const lockedClass = "flex flex-1 flex-col items-center justify-center gap-1 border-r border-gray-600 text-center py-1 text-gray-600 opacity-50";

    function LockedTab({icon, label}: {icon: string; label: string}) {
        return (
            <button
                onClick={() => alert("Sign up to unlock this feature.")}
                className={lockedClass}
            >
                <span className="text-2xl">🔒</span>
                <span className="text-xs leading-tight">{label}</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 w-full flex bg-gray-900 px-1 py-3 border-t border-black">

            <NavLink to="/home" className={isGuest ? lockedClass : linkClass} onClick={isGuest ? (e) => { e.preventDefault(); alert("Sign up to unlock Home."); } : undefined}>
                <span className="text-2xl">{isGuest ? "🔒" : "🏠"}</span>
                <span className="text-xs leading-tight">Home</span>
            </NavLink>

            <NavLink to="/log" className={linkClass}>
                <span className="text-2xl">📝</span>
                <span className="text-xs leading-tight">Log</span>
            </NavLink>

            <NavLink to="/create-post" className={isGuest ? lockedClass : linkClass} onClick={isGuest ? (e) => { e.preventDefault(); alert("Sign up to unlock posting."); } : undefined}>
                <span className="text-2xl">{isGuest ? "🔒" : "✚"}</span>
                <span className="text-xs leading-tight">Post</span>
            </NavLink>

            <NavLink to="/search" className={isGuest ? lockedClass : linkClass} onClick={isGuest ? (e) => { e.preventDefault(); alert("Sign up to unlock Search."); } : undefined}>
                <span className="text-2xl">{isGuest ? "🔒" : "🔍"}</span>
                <span className="text-xs leading-tight">Search</span>
            </NavLink>

            <NavLink to="/leaderboard" className={isGuest ? lockedClass : linkClass} onClick={isGuest ? (e) => { e.preventDefault(); alert("Sign up to unlock the Leaderboard."); } : undefined}>
                <span className="text-2xl">{isGuest ? "🔒" : "🏆"}</span>
                <span className="text-xs leading-tight">Ranks</span>
            </NavLink>

            <NavLink to="/profile" className={isGuest ? lockedClass : linkClass} onClick={isGuest ? (e) => { e.preventDefault(); alert("Sign up to unlock your Profile."); } : undefined}>
                <span className="text-2xl">{isGuest ? "🔒" : "👤"}</span>
                <span className="text-xs leading-tight">Profile</span>
            </NavLink>

        </div>
    );
}