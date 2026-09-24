import { Link } from "react-router";
import { NavBar } from "~/components/NavBar";
import { GuestPostCard } from "~/components/GuestPostCard";

export function GuestHome({posts}: {posts: any[]}) {
    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="text-center font-bold text-4xl p-3">
                League Fitness
            </div>

            <div className="bg-blue-900/40 border border-blue-700 rounded-md mx-4 p-3 mb-4 text-sm text-center">
                <p className="mb-1">You're viewing as a guest — sign up to like, comment, and see posts from friends.</p>
                <Link to="/welcome" className="text-blue-400 underline font-bold">
                    Sign up
                </Link>
            </div>

            {posts.length === 0 && (
                <p className="text-center py-8">No announcements yet.</p>
            )}

            {posts.map((post) => (
                <GuestPostCard key={post.id} post={post} />
            ))}

            <NavBar isGuest={true} />
        </div>
    );
}