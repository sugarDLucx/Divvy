import React, { useEffect, useState } from 'react';
import { NetWorthChart } from '../components/dashboard/NetWorthChart';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getUserProfile } from '../services/db';
import type { Transaction, UserFinancialProfile } from '../types';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserFinancialProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            if (!user) return;
            const [profileData, txData] = await Promise.all([
                getUserProfile(user.uid),
                getTransactions(user.uid)
            ]);

            setProfile(profileData);
            setTransactions(txData);

            // Calculate Monthly Stats (Simple calculation based on all loaded txs for now)
            // In a real app, filtering by month would be better
            let income = 0;
            let expense = 0;
            txData.forEach(tx => {
                if (tx.type === 'income' || tx.category === 'Income') {
                    income += tx.amount;
                } else {
                    expense += tx.amount;
                }
            });
            setMonthlyIncome(income);
            setMonthlyExpense(expense);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-white">Loading dashboard...</div>;

    // Calculate current net worth based on profile start + transactions?
    // For now, let's just use the profile's net worth + simple math if we wanted, 
    // but the user wants "starting from nothing" or "inputted values".
    // We will display the Profile Net Worth as the base.
    const currentNetWorth = profile ? profile.totalNetWorth : 0;

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Center Column */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col gap-8 relative">
                {/* Abstract background glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2"></div>

                {/* Header Section */}
                <div className="flex flex-wrap items-end justify-between gap-4 relative z-10">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">Welcome back, {user?.displayName || 'User'}</h2>
                        <p className="text-slate-400 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Main Chart & Stats */}
                <div className="glass-panel rounded-2xl p-1 relative overflow-hidden group">
                    <div className="p-6 md:p-8 flex flex-col gap-6">
                        {/* Top stats inside chart card */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Net Worth</p>
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">${currentNetWorth.toLocaleString()}</h3>
                                    {/* <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full text-sm font-semibold border border-green-500/20">
                                        <span className="material-symbols-outlined text-base">trending_up</span>
                                        <span>+0%</span>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        {/* Chart SVG */}
                        <NetWorthChart />
                    </div>
                </div>

                {/* Budget Distribution Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Wants vs Needs */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Budget Categories</h3>
                            <button className="text-sm text-primary hover:text-blue-400 font-medium">Edit Limits</button>
                        </div>
                        {/* Needs */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300 font-medium">Needs (50%)</span>
                                <span className="text-white font-bold">$0 / $0</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-neon-teal w-[0%] rounded-full shadow-[0_0_10px_rgba(45,212,191,0.4)]"></div>
                            </div>
                            <p className="text-xs text-slate-500">Add budget items to see stats</p>
                        </div>
                    </div>
                    {/* Quick Monthly Summary */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <h3 className="text-lg font-bold text-white mb-4">Monthly Overview</h3>
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <div className="bg-surface-dark/50 rounded-xl p-3 flex flex-col justify-center gap-1 border border-white/5">
                                <div className="p-1.5 w-fit rounded-lg bg-green-500/20 text-green-400 mb-2">
                                    <span className="material-symbols-outlined text-lg">arrow_downward</span>
                                </div>
                                <span className="text-slate-400 text-[10px] uppercase font-medium tracking-wider">Income</span>
                                <span className="text-white text-lg lg:text-xl font-bold truncate" title={`$${monthlyIncome.toFixed(2)}`}>${monthlyIncome.toFixed(2)}</span>
                            </div>
                            <div className="bg-surface-dark/50 rounded-xl p-3 flex flex-col justify-center gap-1 border border-white/5">
                                <div className="p-1.5 w-fit rounded-lg bg-red-500/20 text-red-400 mb-2">
                                    <span className="material-symbols-outlined text-lg">arrow_upward</span>
                                </div>
                                <span className="text-slate-400 text-[10px] uppercase font-medium tracking-wider">Expenses</span>
                                <span className="text-white text-lg lg:text-xl font-bold truncate" title={`$${monthlyExpense.toFixed(2)}`}>${monthlyExpense.toFixed(2)}</span>
                            </div>
                            <div className="col-span-2 bg-surface-dark/50 rounded-xl p-4 flex items-center justify-between border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs font-medium">Remaining</span>
                                    <span className="text-white text-2xl font-bold">${(monthlyIncome - monthlyExpense).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel (Collapsible/Responsive) */}
            <aside className="w-full lg:w-[340px] flex-shrink-0 bg-[#141820]/95 backdrop-blur-sm border-l border-white/5 p-6 flex flex-col gap-8 overflow-y-auto z-20">
                {/* Emergency Fund Widget */}
                {/* Simplified for empty state */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-lg">Emergency Fund</h3>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative">
                        <p className="text-slate-400 text-sm text-center">Setup a goal to track your emergency fund.</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-lg">Recent Activity</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {transactions.length === 0 ? (
                            <p className="text-slate-500 text-sm">No recent transactions.</p>
                        ) : (
                            transactions.slice(0, 5).map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50">
                                            <span className="material-symbols-outlined text-xl">{tx.category === 'Income' ? 'payments' : 'shopping_bag'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-white text-sm font-medium">{tx.description}</p>
                                            <p className="text-slate-500 text-xs">{tx.date}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold ${tx.category === 'Income' ? 'text-neon-teal' : 'text-white'}`}>
                                        {tx.category === 'Income' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
};
