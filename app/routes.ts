import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/welcome.tsx"),
    route("profile", "routes/profile.tsx", {id: "own-profile"}),
    route("profile/:userId", "routes/profile.tsx"),
    route("home", "routes/home.tsx"),
    route("log", "routes/log.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
    route("logout", "routes/logout.tsx"),
    route("create-post", "routes/create-post.tsx"),
    route("post/:postId", "routes/post.tsx"),
    route("search", "routes/search.tsx"),
] satisfies RouteConfig;