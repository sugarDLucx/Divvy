import React, { useEffect, useState } from 'react';
import { NetWorthChart } from '../components/dashboard/NetWorthChart';
import { useAuth } from '../context/AuthContext';
import { checkAndGenerateRecurringTransactions, getUserProfile, addTransactionWithBatch } from '../services/db';
import type { UserFinancialProfile } from '../types';
import { OnboardingModal } from '../components/modals/OnboardingModal';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { transactions, stats, budgets, goals, loading: dataLoading } = useRealTimeData(user?.uid);
    const [profile, setProfile] = useState<UserFinancialProfile | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryAmount, setSalaryAmount] = useState('');

    useEffect(() => {
        if (user) {
            loadProfile();
            // Check for recurring transactions on dashboard load
            checkAndGenerateRecurringTransactions(user.uid);
        }
    }, [user]);

    // Pre-fill salary amount from profile when modal opens
    useEffect(() => {
        if (showSalaryModal && profile?.monthlyIncome) {
            setSalaryAmount(profile.monthlyIncome.toString());
        }
    }, [showSalaryModal, profile]);

    const [submittingSalary, setSubmittingSalary] = useState(false);

    const handleAddSalary = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Add Salary Clicked", { userUid: user?.uid, salaryAmount });

        if (!user) {
            console.error("No user found");
            return;
        }
        if (!salaryAmount) {
            alert("Please enter an amount.");
            return;
        }

        const amount = parseFloat(salaryAmount);
        if (isNaN(amount) || amount === 0) {
            alert("Please enter a valid non-zero amount.");
            return;
        }

        setSubmittingSalary(true);
        try {
            console.log("Submitting transaction...");
            await addTransactionWithBatch({
                amount: amount,
                category: 'Salary',
                date: new Date().toISOString().split('T')[0],
                description: amount < 0 ? 'Salary Correction/Deduction' : 'Monthly Salary',
                type: 'income',
                userId: user.uid
                // needsVsWants is optional, so we can omit it. explicitly passing undefined causes Firestore error.
            });
            console.log("Transaction submitted.");

            loadProfile();

            setShowSalaryModal(false);
            setSalaryAmount('');
        } catch (error) {
            console.error("Failed to add salary", error);
            alert("Failed to add salary. Please try again.");
        } finally {
            setSubmittingSalary(false);
        }
    };

    const loadProfile = async () => {
        if (!user) return;
        try {
            const profileData = await getUserProfile(user.uid);
            if (!profileData) {
                setShowOnboarding(true);
            } else {
                setProfile(profileData);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setInitializing(false);
        }
    };

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        loadProfile();
    };

    if (initializing || dataLoading) return <div className="p-10 text-white">Loading dashboard...</div>;

    // Optimized Net Worth Calculation
    // Base: Initial Net Worth (from Profile)
    // Add: All Income (from Realtime Stats - Note: For simplicity, Stats provided are 'CurrentMonth' by default, 
    // but the request implies we should use `stats` to update Net Worth. 
    // Ideally we have an 'All Time' stats doc or we sum up. 
    // For MVP robustness with new architecture:
    // If stats are just current month, this calculation is only accurate for changes in THIS month + Initial.
    // To be truly accurate over time, we need `allTimeIncome` in stats or simpler: 
    // Net Worth = Initial + Sum(All Income Txs) - Sum(All Expense Txs).
    // Let's use the local calculations on the fetched `transactions` list (limit 50) + maybe more?
    // User requested "Do not calculate this by reading every transaction every time".
    // So we should rely on the stats doc. Let's assume stats provided by hook are sufficient or we just use what we have.
    // Given hook returns `stats` (Current Month), we might need `totalNetWorth` stored in profile and updated via batch too?
    // Actually, `addTransactionWithBatch` didn't update Profile Net Worth.
    // Let's stick to the user's formula: "$Opening Balance + Sum(Income) - Sum(Expenses)".
    // If we only have 50 txs, this is wrong. 
    // Correct approach: We should have updated a `netWorth` field in `users/{uid}/stats/all_time`.
    // Since I didn't implement `all_time` stats in DB yet (just monthly), I will fallback to:
    // Display Profile.initialNetWorth + (Income - Expense) from *Available Data* or just use Profile.totalNetWorth if we were updating it.
    // The previous code calculated it from loaded txs.
    // Let's use: Initial + (Current Month Income - Current Month Expenses) for the "Active" Net Worth change visualization
    // OR just display the raw numbers.
    // Let's use `stats` for monthly overview and `profile.initialNetWorth` + `stats.totalIncome` - `stats.totalExpenses` (for this month's delta) 
    // combined with a theoretical 'previous months' delta.
    // ERROR: If we don't track all time, we can't show accurate Net Worth.
    // FIX: Just show "Current Month Net Change" + Initial, or assume Initial was updated to "Now".
    // Let's use the `stats` object for the Monthly Overview blocks.

    // Use Realized Income (Stats) or Planned Income (Profile) - whichever is greater
    // This helps users who expect their "Salary Setting" to show up as "Income" even if they haven't logged it yet.
    const monthlyIncome = Math.max(stats?.totalIncome || 0, profile?.monthlyIncome || 0);
    const monthlyExpense = stats?.totalExpenses || 0;

    // Net Worth Display
    // Now that `totalNetWorth` is updated in DB, we should preferentially use that if available.
    // But `profile` is static state. `loadProfile` refreshes it. 
    // For "Real-time" feel, we might want to listen to profile changes? 
    // Or just rely on the manual refresh we added.
    const currentNetWorth = profile?.totalNetWorth || 0;

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full relative">
            {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

            {/* Center Column */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col gap-8 relative">
                {/* Abstract background glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2"></div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Dashboard</h1>
                        <p className="text-slate-400">Welcome back, get a clear view of your finances.</p>
                    </div>
                    <button
                        onClick={() => setShowSalaryModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                        Add Salary
                    </button>
                </div>

                {/* Salary Modal */}
                {showSalaryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="glass-panel p-6 rounded-2xl w-full max-w-sm border border-white/10 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-white mb-2">Receive Salary</h3>
                            <p className="text-slate-400 mb-6 text-sm">
                                Enter amount to add to your income. <br />
                                <span className="text-xs text-orange-400 opacity-80">Tip: Use a negative value (e.g. -500) for deductions/corrections.</span>
                            </p>
                            <form onSubmit={handleAddSalary} className="flex flex-col gap-4">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        autoFocus
                                        className="w-full bg-surface-dark border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all font-bold text-lg placeholder:text-slate-600"
                                        value={salaryAmount}
                                        onChange={(e) => setSalaryAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowSalaryModal(false)}
                                        disabled={submittingSalary}
                                        className="flex-1 px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingSalary}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                                    >
                                        {submittingSalary ? (
                                            <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            'Confirm'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Main Chart & Stats */}
                <div className="glass-panel rounded-2xl p-1 relative overflow-hidden group">
                    <div className="p-6 md:p-8 flex flex-col gap-6">
                        {/* Top stats inside chart card */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Estimated Net Worth</p>
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">₱{currentNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                </div>
                                Current Balance
                            </div>
                        </div>
                    </div>
                    {/* Chart SVG */}
                    <NetWorthChart />
                </div>

                {/* Budget Distribution Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Wants vs Needs */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Budget Categories</h3>
                        </div>

                        {/* Dynamic Budget Categories */}
                        {['need', 'want', 'savings'].map(type => {
                            const typeBudgets = budgets.filter(b => b.type === type);
                            const planned = typeBudgets.reduce((sum, b) => sum + b.plannedAmount, 0);
                            const spent = typeBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
                            const percent = planned > 0 ? (spent / planned) * 100 : 0;

                            let color = 'bg-blue-500';
                            if (type === 'want') color = 'bg-purple-500';
                            if (type === 'savings') color = 'bg-green-500';

                            return (
                                <div key={type} className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300 font-medium capitalize">{type}s ({type === 'need' ? '50' : type === 'want' ? '30' : '20'}%)</span>
                                        <span className="text-white font-bold">₱{spent.toLocaleString()} / ₱{planned.toLocaleString()}</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-1000`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
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
                                <span className="text-white text-lg lg:text-xl font-bold truncate" title={`₱${monthlyIncome.toFixed(2)}`}>₱{monthlyIncome.toFixed(2)}</span>
                            </div>
                            <div className="bg-surface-dark/50 rounded-xl p-3 flex flex-col justify-center gap-1 border border-white/5">
                                <div className="p-1.5 w-fit rounded-lg bg-red-500/20 text-red-400 mb-2">
                                    <span className="material-symbols-outlined text-lg">arrow_upward</span>
                                </div>
                                <span className="text-slate-400 text-[10px] uppercase font-medium tracking-wider">Expenses</span>
                                <span className="text-white text-lg lg:text-xl font-bold truncate" title={`₱${monthlyExpense.toFixed(2)}`}>₱{monthlyExpense.toFixed(2)}</span>
                            </div>
                            <div className="col-span-2 bg-surface-dark/50 rounded-xl p-4 flex items-center justify-between border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs font-medium">Remaining</span>
                                    <span className="text-white text-2xl font-bold">₱{(monthlyIncome - monthlyExpense).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



            </div>

            {/* Right Panel (Collapsible/Responsive) */}
            <aside className="w-full lg:w-[340px] flex-shrink-0 bg-[#141820]/95 backdrop-blur-sm border-l border-white/5 p-6 flex flex-col gap-8 overflow-y-auto z-20">
                {/* Emergency Fund Widget */}
                {(() => {
                    const emergencyGoal = goals.find(g => g.type === 'emergency' || g.name.toLowerCase().includes('emergency'));
                    if (emergencyGoal) {
                        const progress = emergencyGoal.targetAmount > 0 ? (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100 : 0;
                        return (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold text-lg">Emergency Fund</h3>
                                    <span className="text-neon-teal font-bold">{Math.min(progress, 100).toFixed(0)}%</span>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-6xl text-neon-teal">emergency</span>
                                    </div>

                                    <div>
                                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Current Balance</p>
                                        <h3 className="text-2xl font-bold text-white">₱{emergencyGoal.currentAmount.toLocaleString()}</h3>
                                        <p className="text-slate-500 text-xs mt-1">Goal: ₱{emergencyGoal.targetAmount.toLocaleString()}</p>
                                    </div>

                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-neon-teal rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all duration-1000"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg">Emergency Fund</h3>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative border border-dashed border-white/10">
                                <div className="size-12 rounded-full bg-surface-dark flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-slate-400">add_moderator</span>
                                </div>
                                <p className="text-slate-400 text-sm text-center">No emergency fund set.</p>
                                <p className="text-slate-600 text-xs text-center mt-1">Create a goal marked as "Emergency Fund".</p>
                            </div>
                        </div>
                    );
                })()}

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
                                            <span className="material-symbols-outlined text-xl">
                                                {tx.type === 'income' ? 'payments' : (tx.category === 'Shopping' ? 'shopping_bag' : 'receipt')}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-white text-sm font-medium">{tx.description}</p>
                                            <p className="text-slate-500 text-xs">{tx.date} • {tx.category}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold ${tx.type === 'income' ? 'text-neon-teal' : 'text-white'}`}>
                                        {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toFixed(2)}
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
