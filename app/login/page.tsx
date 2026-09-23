"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const login = async () => {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  };

  const loginWithGoogle = async () => {
    setGoogleLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Sign in to your Collaborative Workspace
        </p>

        {errorMessage && (
          <p className="auth-message">
            {errorMessage}
          </p>
        )}

        <label>
          Email

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter your email"
          />
        </label>

        <label>
          Password

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
          />
        </label>

        <button
          className="auth-primary-button"
          onClick={login}
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign In"}
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          className="google-login-button"
          onClick={loginWithGoogle}
          disabled={googleLoading}
        >
          {googleLoading
            ? "Connecting..."
            : "Continue with Google"}
        </button>

        <p className="auth-link-text">
          Don't have an account?{" "}
          <a href="/sign-up">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}