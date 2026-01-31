import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGoals } from '../services/db';
import type { SavingsGoal } from '../types';

export const Goals: React.FC = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchGoals = async () => {
                const data = await getGoals(user.uid);
                setGoals(data);
                setLoading(false);
            };
            fetchGoals();
        }
    }, [user]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
            {/* Page Heading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white text-3xl md:text-4xl font-black tracking-tight">Savings & Goals</h2>
                    <p className="text-slate-400 text-base">Visualize your progress and manage your sinking funds.</p>
                </div>
                {/* Only show button if we have content, or duplicate it in empty state */}
            </div>

            {loading ? (
                <div className="text-white">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-6 border-2 border-dashed border-white/10 min-h-[400px]">
                    <div className="size-24 rounded-full bg-surface-dark flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-5xl text-neon-teal">flag</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Dream Big!</h3>
                        <p className="text-slate-400 max-w-lg mx-auto text-lg">You haven't set any savings goals yet. Whether it's a new car, a vacation, or an emergency fund, start tracking it here.</p>
                    </div>
                    <button className="bg-neon-teal hover:bg-teal-500 text-background-dark px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-neon-teal/20">
                        Create Your First Goal
                    </button>
                    <p className="text-xs text-slate-500">(Goal creation feature coming in next update)</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-card-dark rounded-xl p-5 border border-slate-800 shadow-sm hover:border-slate-600 transition-all group flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-slate-800 p-2.5 rounded-lg text-slate-300 group-hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined">{goal.icon || 'savings'}</span>
                                    </div>
                                    <div className="relative size-12">
                                        <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                            <circle className="stroke-current text-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                                            <circle className="stroke-current text-primary" cx="18" cy="18" fill="none" r="16" strokeDasharray="100" strokeDashoffset={`${100 - (goal.currentAmount / goal.targetAmount) * 100}`} strokeLinecap="round" strokeWidth="3"></circle>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                            {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                                        </div>
                                    </div>
                                </div>
                                <h4 className="text-white font-bold text-lg leading-tight mb-1">{goal.name}</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Saved</span>
                                    <span className="text-white font-mono font-medium">${goal.currentAmount}</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
