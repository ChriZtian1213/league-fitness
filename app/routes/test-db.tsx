import { connectDB } from "~/server/db.server";

export async function loader() {
    try {
        const db = await connectDB();

        await db.collection("test").insertOne({
            message: "MongoDB works!",
            createdAt: new Date(),
        });

        return Response.json({
            success: true
        });
    } catch (error) {
        console.log(error);

        return Response.json({
            success: false
        });
    }
}

export default function TestDB() {
    return <h1>Testing MongoDB...</h1>;
}