import {NavLink} from "react-router";


export function NavBar(){

    const linkClass = ({isActive}: {isActive: boolean}) =>
        `flex flex-1 flex-col items-center border-r border-gray-600 ${
            isActive ? "text-white" : "text-gray-400"
        }`;

    return (
        <div className="fixed bottom-0 left-0 w-full flex bg-gray-900 p-4 border-t border-black">

            <NavLink to="/home" className={linkClass}>
                <span>🏠</span>
                <span>Home</span>
            </NavLink>

            <NavLink to="/log" className={linkClass}>
                <span>📝</span>
                <span>Add Log</span>
            </NavLink>

            <NavLink to="/create-post" className={linkClass}>
                <span>✚</span>
                <span>Create Post</span>
            </NavLink>

            <NavLink to="/search" className={linkClass}>
                <span>🔍</span>
                <span>Search</span>
            </NavLink>

            <NavLink to="/leaderboard" className={linkClass}>
                <span>🏆</span>
                <span>Leaderboard</span>
            </NavLink>

            <NavLink
                to="/profile"
                className={({isActive}) =>
                    `flex flex-1 flex-col items-center ${
                        isActive ? "text-white" : "text-gray-400"
                    }`
                }
            >
                <span>👤</span>
                <span>Profile</span>
            </NavLink>

        </div>
    );
}