"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabaseClient.ts";
import AuthBrand from "@/app/components/AuthBrand";


export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");

  
  const handlePlayAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) { setError(error.message); return; }
    router.push("/dashboard"); // TODO: change to wherever guest users should land
  }
  
  const handleSignup = async () => {
    router.push("/signup")
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else {
      setUser(data.user);
      router.push("/dashboard"); // TODO: change to wherever signed-in users should land
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const handleForgotPassword = async () => {
    // TODO: forgot password function
    // Check supabase docs for this
    router.push("signup") // just so it works
  };

  return (
    <main className="auth-page">
      <AuthBrand page="signin" />
      <div className="auth-panel">
        <div className="auth-card">                
          <h2 className="font-display text-3xl">Sign in</h2>
          <p className="mt-1 text-sm text-[#9e9393]">
            Welcome back. Deal me in.
          </p>
          {error && <p className="mt-1 text-sm text-[#9e9393]">{error}</p>}
          {!user ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="mt-6 grid gap-4"
              >
                <label className="crud-field">
                  <span>Email</span>
                  <input 
                    type="email" required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="crud-field">
                  <span>Password</span>
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    minLength={6}
                    placeholder="Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="auth-link justify-self-end"
                >
                  Forgot password?
                </button>
                <button type="submit" className="primary-action w-full">
                  Sign in
                </button>
              </form>
              <div className="auth-divider">
                <span>New to the table?</span>
              </div>
              <button
                type="button"
                onClick={handleSignup}
                className="secondary-action w-full"
              >
                Sign Up
              </button>
              <div className="auth-divider">
                <span>Not ready for an account?</span>
              </div>
              <button 
                type="button" 
                onClick={handlePlayAsGuest}
                className="secondary-action w-full">
                  Play as Guest
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="mb-4">Logged in as {user.email}</p>
              <button
                onClick={handleLogout}
                className="secondary-action w-full"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}