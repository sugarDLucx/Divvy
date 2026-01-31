import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserProfile, getUserProfile } from '../services/db';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Stats
    const [netWorth, setNetWorth] = useState('');
    const [monthlyIncome, setMonthlyIncome] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const profile = await getUserProfile(user.uid);
            if (profile) {
                setNetWorth(profile.totalNetWorth.toString());
                setMonthlyIncome(profile.monthlyIncome.toString());
            }
        } catch (error) {
            console.error("Error loading profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const income = parseFloat(monthlyIncome) || 0;
        if (income <= 0) {
            setSuccessMsg('Please enter a valid monthly income.');
            return;
        }

        setSaving(true);
        setSuccessMsg('');

        try {
            await createUserProfile(user.uid, {
                totalNetWorth: parseFloat(netWorth) || 0,
                monthlyIncome: income,
                currency: 'USD',
                onboardingCompleted: true
            });
            setSuccessMsg('Profile updated successfully!');
            // Allow navigation now (handled by ProtectedRoute check on next nav or reload)
            // Optional: redirect to dashboard automatically? User said "Account settings should be the first thing... cannot leave if not filled"
            // So if filled, they CAN leave. Let's maybe offer a link or auto-redirect? 
            // For now, staying on page with success message is fine, or redirecting to dashboard is better flow?
            // "Account settings should be the first thing to see... cannot leave... if not filled"
            // Implies: If filled, you can go. 
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading settings...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-white text-3xl font-black tracking-tight">Account Settings</h2>
                <p className="text-slate-400">Manage your financial profile and preferences.</p>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/10">
                <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_balance</span>
                    Financial Profile
                </h3>

                {successMsg && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-lg">
                    {/* Current Net Worth */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">Total Net Worth</label>
                        <p className="text-xs text-slate-500">Your starting balance across all accounts.</p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <input
                                type="number"
                                required
                                value={netWorth}
                                onChange={(e) => setNetWorth(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Monthly Income */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">Monthly Income</label>
                        <p className="text-xs text-slate-500">Used for monthly budget calculations.</p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <input
                                type="number"
                                required
                                value={monthlyIncome}
                                onChange={(e) => setMonthlyIncome(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 mt-2 disabled:opacity-50 w-fit"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};
