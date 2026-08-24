import type {Route} from "./+types/home"
import {Form, useLoaderData} from "react-router"
import {requireUserId} from "~/server/session.server";
import {NavBar} from "~/components/NavBar";
import {getUserById} from "~/server/user.server";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    return {user};
}

export default function Home() {
    const {user} = useLoaderData<typeof loader>();

    return (
        <>
            <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
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


                <h2>Welcome back, {user?.displayName}!</h2>

                <div className="flex gap-8 overflow-x-auto pb-4">
                    <div className="flex flex-col items-center">
                        <img
                            className="w-16 h-16 rounded-full m-2 border-2 border-black"
                            src="/favicon.ico"/>
                        <p>Your Story</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <img
                            className="w-16 h-16 m-2 border-2 border-black rounded-full"
                            src="/favicon.ico"/>
                        <p>Test</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 border-t-2 border-black p-4">
                    <div className="flex flex-row gap-4">
                        <p>ChriZtian1213</p><p>⚆ Now</p><p>Follow</p>
                    </div>
                    <img
                        className="w-72 h-72 m-2 border-2 border-black"
                        src="/favicon.ico"/>
                    <div className="flex flex-row gap-2">
                        <p>🔥 5</p><p>🗨️ 3</p><p>🔗 12</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p className="font-bold">ChriZtian1213</p>
                        <p>fire workout td 🔥💪🏼</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 border-t-2 border-black p-4">
                    <div className="flex flex-row gap-4">
                        <p>ChriZtian1213</p><p>⚆ 5hr</p><p>Follow</p>
                    </div>
                    <img
                        className="w-72 h-72 m-2 border-2 border-black"
                        src="/favicon.ico"/>
                    <div className="flex flex-row gap-2">
                        <p>🔥 5</p><p>🗨️ 3</p><p>🔗 12</p>
                    </div>
                </div>

                <NavBar/>


            </div>
        </>
    );
}
