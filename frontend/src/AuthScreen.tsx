import { useState } from 'react';
import { ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { request, messageOf } from './api';
import type { Session } from './types';
import { CarArtwork } from './CarArtwork';

export function Brand() { return <div className="brand"><span className="brand-icon">A<span>↗</span></span><span>APEX<span className="brand-sub">MOTORS</span></span></div>; }

export function AuthScreen({ onLogin, notice }: { onLogin: (session: Session) => void; notice: string }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { onLogin(await request<Session>(`/auth/${register ? 'register' : 'login'}`, undefined, { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) })); }
    catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story"><Brand /><div className="auth-story-content"><p className="eyebrow">A BETTER WAY TO FIND YOUR DRIVE</p><h1>Good journeys<br />start here<span>.</span></h1><p>A considered collection. A clear view of every vehicle.<br />Your next chapter, ready when you are.</p><CarArtwork category="SUV" index={0} hero /><div className="auth-footnote"><ShieldCheck size={18} />Live inventory. Clear pricing. Simple purchasing.</div></div><span className="auth-bottom">THE APEX COLLECTION <ArrowUpRight size={16} /></span></section>
    <section className="auth-form-side"><div className="auth-form-wrap"><p className="eyebrow text-emerald-800">WELCOME TO APEX</p><h2>{register ? 'Your journey begins.' : 'Welcome back.'}</h2><p className="muted mb-8">{register ? 'Create an account to explore the collection.' : 'Sign in to find your next drive.'}</p>
      {notice && <p className="notice" role="status">{notice}</p>}
      <form onSubmit={submit} className="space-y-5">
        <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={busy} /></label>
        <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={10} maxLength={128} placeholder="At least 10 characters" required disabled={busy} /></label>
        {error && <p role="alert" className="error">{error}</p>}
        <button className="primary w-full justify-between" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}<ArrowRight size={18} /></button>
      </form>
      <p className="auth-switch">{register ? 'Already have an account?' : 'New to Apex?'} <button disabled={busy} onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Sign in' : 'Create an account'}</button></p>
      <p className="auth-disclaimer">A dealership inventory demo. Purchases reserve stock only; no payment is collected.</p>
    </div></section>
  </main>;
}
