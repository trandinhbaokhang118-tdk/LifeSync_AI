import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import api from '../services/api';
import '../components/login/login.css';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const token = searchParams.get('token');

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!token) return;
        if (password.length < 8) return setMessage('Password must be at least 8 characters.');
        if (password !== confirmPassword) return setMessage('Passwords do not match.');
        setSubmitting(true);
        setMessage(null);
        try {
            await api.post('/auth/password-reset/confirm', { token, newPassword: password });
            setMessage('Your password has been reset. You can now sign in.');
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { error?: { message?: string } } } };
            setMessage(apiError.response?.data?.error?.message || 'This reset link is invalid or has expired.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="login-page-bg min-h-screen flex items-center justify-center p-4">
            <section className="login-card w-full max-w-md rounded-2xl p-8">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#3B82F6] hover:underline"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
                <h1 className="mt-6 text-2xl font-bold text-gray-900">Choose a new password</h1>
                {!token ? <p className="mt-4 text-sm text-red-600">This reset link is incomplete.</p> : message?.startsWith('Your password') ? <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p> : (
                    <form className="mt-6 space-y-4" onSubmit={submit}>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="new-password">New password</label>
                        <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm" /></div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="confirm-password">Confirm password</label>
                        <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm" />
                        {message && <p className="text-sm text-red-600">{message}</p>}
                        <button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-gradient-to-r from-[#FF8C42] to-[#3B82F6] text-sm font-semibold text-white disabled:opacity-60">{submitting ? 'Resetting...' : 'Reset password'}</button>
                    </form>
                )}
            </section>
        </main>
    );
}
