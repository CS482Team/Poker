"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabaseClient.ts";
import AuthBrand from "@/app/components/AuthBrand";


export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword,setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSignup = async () => {
        setError("");
        setMessage("");
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password, 
            options: {
                data: { username },
                emailRedirectTo: '${location.origin}/auth/callback',
            },
        });
        if (error) setError(error.message);
        else if (data.session) router.push("/dashboard");
        else setMessage("Check your email to confirm your account.");
    };

    return (
    <main className="auth-page">
    <AuthBrand page="signup"/>
    <div className="auth-panel">
        <div className="auth-card">
            <button
                onClick={() => router.push("/")}
                className="auth-link justify-self-end"
            >
                &larr; Back to sign in
            </button>                
            <h2 className="font-display text-3xl">Sign up</h2>
            <p className="mt-1 test-sm text-[#9e9393]">
                It takes less than a minute.
            </p>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSignup();
                }}
                className="mt-6 grid gap-4"
            >
                <label className="crud-field">
                    <span>Username</span>
                    <input
                        type="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                <label className="crud-field">
                    <span>Email</span>
                    <input
                        type="text" required
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>
                <label className="crud-field">
                    <span>Password</span>
                    <input
                        type="password" required minLength={6}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <label className="crud-field">
                    <span>Confirm Password</span>
                    <input
                        type="confirmPassword"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </label>
                    <button
                        type="submit"
                        className="primary-action w-full"
                    >
                        Sign Up
                    </button>
                    <p className="mt-5 text-center text-sm text-[#9e9393]">
                        Already have an account? {" "}
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="auth-link justify-self-end"
                        >
                            Sign in
                        </button>
                    </p>
                </form>
            </div>
        </div>
    </main>    
    );
}