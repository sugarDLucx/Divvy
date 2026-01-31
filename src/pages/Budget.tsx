import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AddBudgetModal } from '../components/modals/AddBudgetModal';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { getUserProfile, deleteBudgetCategory } from '../services/db';
import type { UserFinancialProfile } from '../types';

export const Budget: React.FC = () => {
    const { user } = useAuth();
    const { budgets, loading: dataLoading } = useRealTimeData(user?.uid);
    const [profile, setProfile] = useState<UserFinancialProfile | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const handleDelete = async (id: string) => {
        if (!user || !confirm('Are you sure you want to delete this budget category?')) return;
        try {
            await deleteBudgetCategory(user.uid, id);
        } catch (error) {
            console.error("Error deleting budget", error);
        }
    };

    // We assume current month for now as useRealTimeData defaults to it
    const currentMonth = new Date().toISOString().slice(0, 7);

    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(p => setProfile(p)).catch(console.error);
        }
    }, [user]);

    // Zero-Based Calculations
    // 1. Total Income: From Stats (Realtime) or Profile (Fallback)
    // Ideally use stats.totalIncome of the current month. If 0 (start of month), maybe use Profile.monthlyIncome as "Estimated"?
    // The user's request says: "Monthly Income - sum(Category Limits)".
    // Let's use Profile.monthlyIncome as the "Available to Budget" base, 
    // unless we strictly want to budget only what we have earned (true ZBB).
    // Usually ZBB tools let you budget your *expected* income or *last month's* income.
    // Let's use Profile.monthlyIncome as the "Planned Income" to budget against.
    const monthlyIncome = profile?.monthlyIncome || 0;

    // 2. Budgeted Totals
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
    const unassigned = monthlyIncome - totalBudgeted;

    // 3. Needs/Wants/Savings Ratios
    const plannedNeeds = budgets.filter(b => b.type === 'need').reduce((sum, b) => sum + b.plannedAmount, 0);
    const plannedWants = budgets.filter(b => b.type === 'want').reduce((sum, b) => sum + b.plannedAmount, 0);
    const plannedSavings = budgets.filter(b => b.type === 'savings').reduce((sum, b) => sum + b.plannedAmount, 0);

    const calcRatio = (amount: number) => monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative">
            {showAddModal && (
                <AddBudgetModal
                    currentMonth={currentMonth}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => setShowAddModal(false)}
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-neon-teal text-sm font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">savings</span>
                        Zero-Based Budgeting
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm">Current Budget</h1>
                </div>
                <div>
                    {/* Zero-Based Status Card */}
                    <div className="glass-panel px-6 py-3 rounded-xl border border-white/10 flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-medium uppercase">Total Income</span>
                            <span className="text-white font-bold">₱{monthlyIncome.toFixed(2)}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-medium uppercase">Budgeted</span>
                            <span className="text-white font-bold">₱{totalBudgeted.toFixed(2)}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex flex-col">
                            <span className={`text-xs font-medium uppercase ${unassigned < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {unassigned < 0 ? 'Over Budget' : 'Unassigned'}
                            </span>
                            <span className={`font-bold ${unassigned < 0 ? 'text-red-400' : 'text-neon-teal'}`}>
                                ₱{Math.abs(unassigned).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 50/30/20 Visualization */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <h3 className="text-white font-bold text-lg">Allocation Breakdown</h3>
                    <p className="text-slate-400 text-xs">Target: 50% Needs, 30% Wants, 20% Savings</p>
                </div>
                {/* The Bar */}
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${calcRatio(plannedNeeds)}%` }} title="Needs"></div>
                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${calcRatio(plannedWants)}%` }} title="Wants"></div>
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${calcRatio(plannedSavings)}%` }} title="Savings"></div>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-3 gap-4 text-xs font-medium">
                    <div className="flex flex-col gap-1 text-blue-400">
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-blue-500"></div> NEEDS</span>
                        <span>{calcRatio(plannedNeeds).toFixed(1)}% (₱{plannedNeeds.toFixed(0)})</span>
                    </div>
                    <div className="flex flex-col gap-1 text-purple-400">
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-purple-500"></div> WANTS</span>
                        <span>{calcRatio(plannedWants).toFixed(1)}% (₱{plannedWants.toFixed(0)})</span>
                    </div>
                    <div className="flex flex-col gap-1 text-green-400">
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-green-500"></div> SAVINGS</span>
                        <span>{calcRatio(plannedSavings).toFixed(1)}% (₱{plannedSavings.toFixed(0)})</span>
                    </div>
                </div>
            </div>

            {/* Empty State Logic */}
            {dataLoading ? (
                <div className="text-white">Loading budget...</div>
            ) : budgets.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-white/10">
                    <div className="size-20 rounded-full bg-surface-dark flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-500">list_alt_add</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">No Budget Set</h3>
                    <p className="text-slate-400 max-w-md">You haven't added any budget categories for this month yet. Start by adding things like Rent, Groceries, or Savings.</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                    >
                        Create First Category
                    </button>
                    <p className="text-xs text-slate-500 mt-2">Use the 50/30/20 rule to guide you.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add Category
                        </button>
                    </div>

                    <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                                        <th className="px-4 py-3 font-semibold w-1/4">Category</th>
                                        <th className="px-4 py-3 font-semibold w-1/6">Type</th>
                                        <th className="px-4 py-3 font-semibold w-1/6 text-right">Planned</th>
                                        <th className="px-4 py-3 font-semibold w-1/6 text-right">Spent</th>
                                        <th className="px-4 py-3 font-semibold w-1/4">Utilization</th>
                                        <th className="px-4 py-3 font-semibold w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {budgets.map((b) => {
                                        const utilization = b.plannedAmount > 0 ? (b.spentAmount / b.plannedAmount) * 100 : 0;
                                        // Color logic: Green < 80%, Yellow < 100%, Red >= 100%
                                        let progressColor = 'bg-blue-500';
                                        if (utilization >= 100) progressColor = 'bg-red-500';
                                        else if (utilization >= 85) progressColor = 'bg-yellow-500';
                                        else if (utilization < 85) progressColor = 'bg-green-500';

                                        return (
                                            <tr key={b.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${b.type === 'need' ? 'bg-blue-500/10 text-blue-400' : b.type === 'want' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                {b.type === 'need' ? 'home' : b.type === 'want' ? 'shopping_bag' : 'savings'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">{b.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${b.type === 'need' ? 'bg-blue-500/5 text-blue-300 border-blue-500/20' : b.type === 'want' ? 'bg-purple-500/5 text-purple-300 border-purple-500/20' : 'bg-green-500/5 text-green-300 border-green-500/20'}`}>
                                                        {b.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-white">₱{b.plannedAmount.toFixed(2)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-medium text-slate-400">₱{b.spentAmount.toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-[10px] text-slate-400">
                                                            <span>{Math.min(utilization, 100).toFixed(0)}%</span>
                                                            <span className={utilization > 100 ? 'text-red-400 font-bold' : ''}>
                                                                {utilization > 100 ? 'OVER LIMIT' : 'Left: ₱' + (b.plannedAmount - b.spentAmount).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                                style={{ width: `${Math.min(utilization, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleDelete(b.id!)}
                                                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};
