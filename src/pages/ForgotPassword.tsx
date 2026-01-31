import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Check your email inbox for password reset instructions.');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-teal/10 blur-[80px] rounded-full pointer-events-none translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col gap-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-white tracking-tight">Reset Password</h1>
                        <p className="text-slate-400 mt-2">Enter your email to receive reset instructions</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm font-medium">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-slate-300 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal transition-all placeholder:text-slate-600"
                                placeholder="name@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="bg-neon-teal hover:bg-teal-400 text-black py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-neon-teal/25 hover:shadow-neon-teal/40 active:scale-95 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="text-center mt-2">
                        <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                            &larr; Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
