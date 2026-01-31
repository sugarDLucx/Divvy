import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBudgets } from '../services/db';
import type { BudgetCategory } from '../types';

export const Budget: React.FC = () => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchBudgets = async () => {
                // Hardcoding month for now to match current date or selected date logic
                const monthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
                const data = await getBudgets(user.uid, monthStr);
                setBudgets(data);
                setLoading(false);
            };
            fetchBudgets();
        }
    }, [user]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-neon-teal text-sm font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">savings</span>
                        Zero-Based Budgeting
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">Current Budget</h1>
                </div>
            </div>

            {/* Empty State Logic */}
            {loading ? (
                <div className="text-white">Loading budget...</div>
            ) : budgets.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-white/10">
                    <div className="size-20 rounded-full bg-surface-dark flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-500">list_alt_add</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">No Budget Set</h3>
                    <p className="text-slate-400 max-w-md">You haven't added any budget categories for this month yet. Start by adding things like Rent, Groceries, or Savings.</p>
                    <button className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
                        Create First Category
                    </button>
                    <p className="text-xs text-slate-500 mt-2">(Budget creation feature coming in next update)</p>
                </div>
            ) : (
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {budgets.map((b) => (
                                    <tr key={b.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                    <span className="material-symbols-outlined text-[20px]">category</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{b.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-slate-300">
                                                {b.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-white">${b.plannedAmount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-400">${b.spentAmount}</td>
                                        <td className="px-4 py-3">
                                            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${Math.min((b.spentAmount / b.plannedAmount) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
