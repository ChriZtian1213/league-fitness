import {useState} from "react"
import type { User } from "../types/user"

type Props = {
    onSignup: (user: User) => void;
}

export function SignupForm({onSignup}: Props) {
    const [displayName, setDisplayName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const newUser: User = {
            displayName,
            email,
            password,
        }

        localStorage.setItem(
            "account",
            JSON.stringify(newUser)
        )


        onSignup(newUser)
    }



    return (
        <>
            <form onSubmit={handleSubmit}>
                <h2>Create Account</h2>
                <div>
                    <label>Display Name</label>
                    <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        type="text"
                    />
                </div>
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

                <button type="submit">Sign Up</button>
            </form>
        </>
    )
}