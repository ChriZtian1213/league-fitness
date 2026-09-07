# League Fitness 🏋️

A full-stack fitness tracking and social app built with React Router 7 and MongoDB. Log workouts, compete on leaderboards, and share your progress with friends.

## Features

**Workout Logging**
- Multi-step flow: category → muscle group → exercise → log
- Supports both strength training (weight × reps) and cardio (distance + time)
- Create custom exercises on the fly
- Edit-friendly input flow with keyboard-driven set logging (Enter to submit and jump to the next field)

**Leaderboard**
- Filter by time period (week / month / all-time)
- Filter by scope: Global, Following, or Mutual Friends
- Rank by Total Volume or Heaviest Single Lift
- Filter by specific exercise (e.g. "Bench Press" only)

**Social Feed**
- Post workout photos with captions
- Like, comment, and repost
- Threaded comment replies, with comment likes
- Edit or delete your own posts and comments
- Post owners can moderate comments on their own posts

**Profiles & Follows**
- Public profile pages showing posts, reposts, and stats
- Follow / unfollow other users
- "Friends" leaderboard scope = mutual follows (no separate friend-request system — it's derived from who follows whom)

**Search**
- Find other users by display name

**Auth**
- Email/password signup and login
- Passwords hashed with bcrypt
- Session-based authentication

## Tech Stack

- **Framework:** [React Router 7](https://reactrouter.com/) (framework mode, SSR)
- **Database:** MongoDB (native driver, no ORM)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Build tool:** Vite

## Getting Started

### Prerequisites
- Node.js
- A MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
MONGODB_URI=your-mongodb-connection-string-here
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Type Checking

```bash
npm run typecheck
```

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
app/
├── components/       # Shared UI components (NavBar, PostCard, CommentThread, forms)
├── features/         # Feature-specific hooks (e.g. workout flow state)
├── routes/           # File-based routes (loaders, actions, and page components)
├── server/           # Database access — one file per domain (users, workouts, posts)
└── types/            # Shared TypeScript types
```

## Known Limitations

- Post images are stored as base64 strings directly in MongoDB. This is simple and works well at small scale, but isn't how you'd want to handle image storage in a larger production app (a dedicated object store like S3 or Cloudinary would be the next step).
- No rate limiting on auth endpoints yet.
- Profile URLs currently use raw MongoDB ObjectIds rather than usernames/handles.

Personal project — built for fun, feedback welcome!
