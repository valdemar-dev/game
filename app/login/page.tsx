"use client";

import crypto from "crypto";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();

    const hashText = (input: string) => {
        const hash = crypto.createHash("sha512");
        hash.update(input);

        return hash.digest("hex");
    };

    const login = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const target = event.target as typeof event.target & {
            username: { value: string, };
            password: { value: string, };
        };

        const data = {
            username: hashText(target.username.value),
            password: hashText(target.password.value),
        };

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const endpoint = "/api/user/account/login";
        
        const response = await fetch(endpoint, options);

        if (!response.ok) {
            return alert(await response.text());
        }

        const res = await response.json();

        alert(res.text);

        return router.push("/app");
    };

    return (
        <main>
            <h1 className="text-4xl text-center mb-4">Login</h1>
            <form onSubmit={async (event) => {await login(event)}} className="flex flex-col gap-2 justify-center items-center">
                <input type="text" id="username" placeholder="Enter username"/>
                <input type="password" id="password" placeholder="Password"/>
                <button type="submit">Login</button>
            </form>
        </main>
    )
}