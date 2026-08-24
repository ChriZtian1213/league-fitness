import {useState} from "react"
import type { User } from "../types/user"

type Props = {
    onLogin: (user: User) => void
}

export function LoginForm({ onLogin }: Props)  {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const savedAccount = localStorage.getItem("account");

        if (!savedAccount) {
            setError("No account found!");
            return;
        }

        const parsedUser: User = JSON.parse(savedAccount);

        const validEmail = parsedUser.email === email;

        const validPassword = parsedUser.password === password;

        console.log("Saved account:", parsedUser)
        console.log("Typed email:", email)
        console.log("Typed password:", password)

        console.log(
            "Email matches:",
            parsedUser.email === email
        )

        console.log(
            "Password matches:",
            parsedUser.password === password
        )

        if (validEmail && validPassword) {
            setError("");
            onLogin(parsedUser);
        } else {
            setError("Incorrect email or password");
        }

    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <h2>Log back in</h2>
                <div style={{}}>
                    <label>Email</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                    />
                </div>
                <div style={{}}>
                    <label >Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                    />
                </div>

                <button type="submit">Sign In</button>
                {error && <p>{error}</p>}
            </form>
        </>
    )
}