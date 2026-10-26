"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/app/admin/actions";
import { Lock, Mail, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>Sign In to Dashboard</span>
          <ArrowRight size={14} />
        </>
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{state.error}</span>
        </div>
      )}

      <div>
        <label 
          htmlFor="email" 
          className="block text-xs font-mono font-medium text-muted uppercase tracking-wider mb-2"
        >
          Administrator Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <Mail size={16} />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@sadeem.studio"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/80 text-foreground text-sm font-mono placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label 
          htmlFor="password" 
          className="block text-xs font-mono font-medium text-muted uppercase tracking-wider mb-2"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <Lock size={16} />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/80 text-foreground text-sm font-mono placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
