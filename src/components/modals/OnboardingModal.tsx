import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createUserProfile } from '../../services/db';
import type { UserFinancialProfile } from '../../types';

interface OnboardingModalProps {
    onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
    const { user } = useAuth();
    const [initialNetWorth, setInitialNetWorth] = useState('');
    const [monthlyIncome, setMonthlyIncome] = useState('');
    const [salaryDate, setSalaryDate] = useState('1');
    const [salaryFrequency, setSalaryFrequency] = useState<'monthly' | 'bi-weekly'>('monthly');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            const profile: Omit<UserFinancialProfile, 'userId'> = {
                totalNetWorth: parseFloat(initialNetWorth) || 0,
                initialNetWorth: parseFloat(initialNetWorth) || 0,
                monthlyIncome: parseFloat(monthlyIncome) || 0,
                salaryDate: parseInt(salaryDate),
                salaryFrequency,
                currency: 'USD',
                onboardingCompleted: true
            };

            await createUserProfile(user.uid, profile);
            onComplete();
        } catch (error) {
            console.error("Error creating profile:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col gap-6">
                    <div className="text-center">
                        <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30 text-primary">
                            <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                        </div>
                        <h2 className="text-2xl font-black text-white">Welcome to Divvy</h2>
                        <p className="text-slate-400 mt-2">Let's set up your financial baseline to get started.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Current Total Net Worth</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={initialNetWorth}
                                    onChange={(e) => setInitialNetWorth(e.target.value)}
                                    placeholder="e.g. 5000.00"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-3 pl-8 pr-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500">Includes cash, savings, investments, minus debts.</p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Monthly Salary / Income</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={monthlyIncome}
                                    onChange={(e) => setMonthlyIncome(e.target.value)}
                                    placeholder="e.g. 3000.00"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-3 pl-8 pr-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-slate-400">Pay Frequency</label>
                                <select
                                    value={salaryFrequency}
                                    onChange={(e) => setSalaryFrequency(e.target.value as any)}
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-3 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="bi-weekly">Bi-Weekly</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-slate-400">Next Pay Date (Day)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={salaryDate}
                                    onChange={(e) => setSalaryDate(e.target.value)}
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-3 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 mt-2"
                        >
                            {submitting ? 'Setting up...' : 'Start Tracking'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
