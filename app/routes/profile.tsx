import type { Route } from "./+types/profile";
import {Form, useLoaderData} from "react-router";
import {NavBar} from "~/components/NavBar";
import { requireUserId } from "~/server/session.server";
import {getUserById} from "~/server/user.server";

// Redirects to "/" if there's no logged-in session.
export async function loader({ request }: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    return {user};
}

export default function Profile(){
    const {user} = useLoaderData<typeof loader>();
    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200">
            <div className="flex items-center mb-4">

                <div className="flex-1"></div>

                <div className="flex-1 text-center font-bold text-4xl p-3">
                    League Fitness
                </div>

                <div className="flex-1 flex justify-end">
                    <Form method="post" action="/logout">
                        <button type="submit">
                            Logout
                        </button>
                    </Form>
                </div>

            </div>

            <div className="flex flex-row justify-center">
                <img
                    className="w-32 h-32 rounded-full m-2 border-2 border-black"
                    src="/favicon.ico"/>
                <div className="flex flex-col p-8">
                    <p className="text-3xl font-bold">{user?.displayName}</p>
                    <div className="flex flex-row gap-2">
                        <p>0 posts</p>
                        <p>0 followers</p>
                        <p>0 following</p>
                    </div>
                </div>
                <button className="text-3xl">⛭ Edit</button>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-4">
                <div className="flex flex-col items-center">
                    <img
                        className="w-16 h-16 rounded-full m-2 border-2 border-black"
                        src="/favicon.ico"/>
                    <p className="">+ Story</p>
                </div>
            </div>

            <div className="flex flex-row gap-4 pb-4 justify-center text-xl border-b border-black">
                <button>Posts</button>
                <button>Saved</button>
                <button>Reposts</button>
            </div>

            <NavBar/>
        </div>
    )
}