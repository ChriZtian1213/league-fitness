import {NavLink} from "react-router";

export function NavBar(){

    const linkClass = ({isActive}: {isActive: boolean}) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 border-r border-gray-600 text-center ${
            isActive ? "text-white" : "text-gray-400"
        }`;

    return (
        <div className="fixed bottom-0 left-0 w-full flex bg-gray-900 px-1 py-2 border-t border-black">

            <NavLink to="/home" className={linkClass}>
                <span className="text-lg">🏠</span>
                <span className="text-[10px] leading-tight">Home</span>
            </NavLink>

            <NavLink to="/log" className={linkClass}>
                <span className="text-lg">📝</span>
                <span className="text-[10px] leading-tight">Log</span>
            </NavLink>

            <NavLink to="/create-post" className={linkClass}>
                <span className="text-lg">✚</span>
                <span className="text-[10px] leading-tight">Post</span>
            </NavLink>

            <NavLink to="/search" className={linkClass}>
                <span className="text-lg">🔍</span>
                <span className="text-[10px] leading-tight">Search</span>
            </NavLink>

            <NavLink to="/leaderboard" className={linkClass}>
                <span className="text-lg">🏆</span>
                <span className="text-[10px] leading-tight">Ranks</span>
            </NavLink>

            <NavLink
                to="/profile"
                className={({isActive}) =>
                    `flex flex-1 flex-col items-center justify-center gap-0.5 text-center ${
                        isActive ? "text-white" : "text-gray-400"
                    }`
                }
            >
                <span className="text-lg">👤</span>
                <span className="text-[10px] leading-tight">Profile</span>
            </NavLink>

        </div>
    );
}