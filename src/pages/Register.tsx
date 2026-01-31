import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [currency, setCurrency] = useState('USD'); // Future feature

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Profile (DisplayName)
            await updateProfile(user, {
                displayName: name
            });

            // 3. Create User Document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                displayName: name,
                email: email,
                createdAt: new Date().toISOString(),
                preferences: {
                    currency: 'USD',
                    theme: 'dark'
                }
            });

            // 4. Redirect
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create account.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-purple/10 blur-[80px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col gap-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
                        <p className="text-slate-400 mt-2">Start your journey to financial freedom</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-slate-300 ml-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all placeholder:text-slate-600"
                                placeholder="Alex Morgan"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-slate-300 ml-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all placeholder:text-slate-600"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-slate-300 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all placeholder:text-slate-600"
                                placeholder="Create a strong password"
                            />
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <input type="checkbox" required className="rounded bg-background-dark border-white/10 text-neon-purple focus:ring-offset-background-dark cursor-pointer" />
                            <label className="text-sm text-slate-400">
                                I agree to the <a href="#" className="text-white hover:underline">Terms of Service</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-neon-purple hover:bg-purple-600 text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-neon-purple/25 hover:shadow-neon-purple/40 active:scale-95 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="text-center mt-2">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-white hover:text-neon-purple font-bold transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
