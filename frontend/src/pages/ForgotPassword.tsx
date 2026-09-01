import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import api from '../services/api';
import '../components/login/login.css';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    async function submit(event: FormEvent) {
        event.preventDefault();
        setStatus('sending');
        try {
            await api.post('/auth/password-reset/request', { email: email.trim() });
            setStatus('sent');
        } catch {
            setStatus('error');
        }
    }

    return (
        <main className="login-page-bg min-h-screen flex items-center justify-center p-4">
            <section className="login-card w-full max-w-md rounded-2xl p-8">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#3B82F6] hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
                <h1 className="mt-6 text-2xl font-bold text-gray-900">Reset your password</h1>
                <p className="mt-2 text-sm text-gray-500">Enter your account email and we will send a one-time reset link.</p>
                {status === 'sent' ? (
                    <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        If that email exists, a reset link has been sent. Check your inbox.
                    </p>
                ) : (
                    <form className="mt-6 space-y-4" onSubmit={submit}>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="reset-email">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/15" placeholder="you@example.com" />
                        </div>
                        {status === 'error' && <p className="text-sm text-red-600">Unable to request a reset link. Please try again.</p>}
                        <button type="submit" disabled={status === 'sending'} className="h-12 w-full rounded-xl bg-gradient-to-r from-[#FF8C42] to-[#3B82F6] text-sm font-semibold text-white disabled:opacity-60">
                            {status === 'sending' ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}
