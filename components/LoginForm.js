"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import Icon from "./Icon";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="auth-card">
      <div className="brand only-mobile">
        <span className="brand-mark">
          <Icon name="pin" />
        </span>
        <span>
          <b>Inventory</b>
          <small>Device management</small>
        </span>
      </div>
      <h1>Sign in</h1>
      <p className="lead">Use your admin account to continue.</p>

      {state.error && (
        <p role="alert" className="alert">
          <Icon name="alert" />
          <span>{state.error}</span>
        </p>
      )}

      <div>
        <label className="lab" htmlFor="l-email">
          Email
        </label>
        <input id="l-email" name="email" type="email" required autoComplete="username" placeholder="you@company.com" className="field" />
      </div>
      <div>
        <label className="lab" htmlFor="l-pass">
          Password
        </label>
        <input id="l-pass" name="password" type="password" required autoComplete="current-password" placeholder="Your password" className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-block" style={{ minHeight: "3rem" }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
