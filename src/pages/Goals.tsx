import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AddGoalModal } from '../components/modals/AddGoalModal';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { addTransactionWithBatch } from '../services/db';
import type { SavingsGoal, Transaction } from '../types';

export const Goals: React.FC = () => {
    const { user } = useAuth();
    const { goals, loading } = useRealTimeData(user?.uid);
    const [showAddModal, setShowAddModal] = useState(false);
    const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null);
    const [contributionAmount, setContributionAmount] = useState('');

    const handleContribute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !contributionGoal || !contributionAmount) return;

        const amount = parseFloat(contributionAmount);
        if (isNaN(amount) || amount <= 0) return;

        // Create a "Savings" expense transaction linked to this goal
        const transaction: Transaction = {
            amount: amount,
            category: 'Savings', // Special category
            date: new Date().toISOString().split('T')[0],
            description: `Contribution to ${contributionGoal.name}`,
            type: 'expense',
            userId: user.uid,
            needsVsWants: 'savings',
            goalId: contributionGoal.id // This triggers the goal update in db.ts
        };

        try {
            await addTransactionWithBatch(transaction);
            setContributionGoal(null);
            setContributionAmount('');
        } catch (error) {
            console.error("Failed to contribute to goal", error);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative">
            {showAddModal && (
                <AddGoalModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => setShowAddModal(false)}
                />
            )}

            {/* Contribution Modal (Simple Overlay) */}
            {contributionGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-white/10 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-2">Contribute to {contributionGoal.name}</h3>
                        <p className="text-slate-400 mb-6">How much would you like to set aside today?</p>
                        <form onSubmit={handleContribute} className="flex flex-col gap-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    autoFocus
                                    className="w-full bg-surface-dark border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal/50 transition-all font-bold text-lg"
                                    value={contributionAmount}
                                    onChange={(e) => setContributionAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setContributionGoal(null)}
                                    className="flex-1 px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!contributionAmount}
                                    className="flex-1 bg-neon-teal hover:bg-teal-400 text-black px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-neon-teal/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">flag</span>
                        Financial Goals
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm">Savings & Targets</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Create New Goal
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-white">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-white/10">
                    <div className="size-20 rounded-full bg-surface-dark flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-500">flag</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">No Goals Yet</h3>
                    <p className="text-slate-400 max-w-md">Set a savings target for a vacation, new car, or emergency fund.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100;

                        // Calculate monthly contribution needed
                        const today = new Date();
                        const targetDate = new Date(goal.dueDate || new Date());
                        const monthsLeft = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
                        const remaining = goal.targetAmount - goal.currentAmount;
                        const monthlyNeeded = monthsLeft <= 0 ? remaining : remaining / monthsLeft;

                        return (
                            <div key={goal.id} className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group flex flex-col gap-4 relative overflow-hidden">
                                {/* Geometric Decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>

                                <div className="flex justify-between items-start z-10">
                                    <div className="size-12 rounded-xl bg-surface-dark border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                                        {goal.icon ? <span className="material-symbols-outlined">{goal.icon}</span> : '🎯'}
                                    </div>
                                    <button
                                        onClick={() => setContributionGoal(goal)}
                                        className="text-neon-teal hover:bg-neon-teal/10 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-neon-teal/20 hover:border-neon-teal/50"
                                    >
                                        + Contribute
                                    </button>
                                </div>

                                <div className="z-10">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{goal.name}</h3>
                                    <p className="text-slate-400 text-sm">Target: {new Date(goal.dueDate || new Date()).toLocaleDateString()}</p>
                                </div>

                                <div className="flex flex-col gap-2 z-10 mt-auto">
                                    <div className="flex justify-between items-end text-sm">
                                        <span className="text-slate-400">Progress</span>
                                        <div className="text-right">
                                            <span className="text-white font-bold">₱{goal.currentAmount.toLocaleString()}</span>
                                            <span className="text-slate-500"> / ₱{goal.targetAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-surface-dark rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-neon-teal transition-all duration-1000 ease-out relative"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                                        </div>
                                    </div>
                                </div>

                                {remaining > 0 && (
                                    <div className="p-3 bg-surface-dark rounded-xl border border-white/5 flex items-center gap-3 z-10">
                                        <span className="material-symbols-outlined text-primary">calendar_clock</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">To reach goal</span>
                                            <span className="text-xs text-slate-300">Save <span className="text-white font-bold border-b border-dashed border-white/20">₱{monthlyNeeded > 0 ? monthlyNeeded.toFixed(2) : '0'}</span> / month</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
