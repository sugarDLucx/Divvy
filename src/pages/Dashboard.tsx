import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NetWorthChart } from '../components/dashboard/NetWorthChart';
import { useAuth } from '../context/AuthContext';
import { checkAndGenerateRecurringTransactions, getUserProfile, addTransactionWithBatch } from '../services/db';
import type { UserFinancialProfile } from '../types';
import { OnboardingModal } from '../components/modals/OnboardingModal';
import { NetWorthModal } from '../components/modals/NetWorthModal';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { transactions, stats, budgets, goals } = useRealTimeData(user?.uid);
    const [profile, setProfile] = useState<UserFinancialProfile | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [showNetWorthModal, setShowNetWorthModal] = useState(false);
    const [salaryAmount, setSalaryAmount] = useState('');

    // Calculate current net worth based on profile + real-time stats
    const currentNetWorth = profile?.totalNetWorth || 0;

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
                // needsVsWants is optional
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

            if (!profileData || !profileData.onboardingCompleted) {
                setShowOnboarding(true);
            }
            // Even if incomplete, we set profile to avoid "Loading..." loop if we want to show partial data
            if (profileData) {
                setProfile(profileData);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            // Loading done
        }
    };

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        loadProfile();
    };

    // Calculate Unassigned Money
    const monthlyIncome = Math.max(stats?.totalIncome || 0, profile?.monthlyIncome || 0);
    const monthlyExpense = stats?.totalExpenses || 0;

    return (
        <div className="flex flex-col gap-8 pb-10">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Here's your financial overview for today.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSalaryModal(true)}
                        className="hidden md:flex items-center gap-2 bg-surface-dark border border-white/10 hover:border-green-500/50 text-white px-4 py-2 rounded-xl transition-all group"
                    >
                        <span className="material-symbols-outlined text-green-400 group-hover:scale-110 transition-transform">payments</span>
                        <span className="text-sm font-semibold">Add Salary</span>
                    </button>

                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Net Worth Card */}
                <div className="md:col-span-8 lg:col-span-8 glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <span className="material-symbols-outlined text-9xl">account_balance</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Net Worth</p>
                                <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                                    ₱{currentNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full text-sm font-medium">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                <span>+2.4%</span>
                            </div>
                        </div>
                        {/* Interactive Chart Widget */}
                        <NetWorthChart
                            transactions={transactions}
                            currentNetWorth={currentNetWorth}
                            onClick={() => setShowNetWorthModal(true)}
                        />
                    </div>
                </div>

                {/* Monthly Overview Card */}
                <div className="md:col-span-4 lg:col-span-4 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
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

            {/* Content Grid: Goals, Budgets, Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Available Budgets / Categories */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Budgets</h3>
                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-full">{budgets.length} Active</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        {budgets.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No budgets set.</p>
                        ) : (
                            budgets.slice(0, 4).map(b => {
                                const percent = Math.min((b.spentAmount / b.plannedAmount) * 100, 100);
                                return (
                                    <div key={b.id} className="group">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300 font-medium">{b.name}</span>
                                            <span className="text-slate-400">₱{b.spentAmount.toLocaleString()} / ₱{b.plannedAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-surface-dark rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : 'bg-primary'}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {budgets.length > 4 && (
                            <div className="text-center mt-2">
                                <span
                                    onClick={() => navigate('/budget')}
                                    className="text-xs text-primary cursor-pointer hover:underline"
                                >
                                    View All Budgets
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Goals Widget (ALL Goals) */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Goals</h3>
                        <div className="space-x-1">
                            {goals.some(g => g.type === 'emergency') && <span className="size-2 bg-red-500 rounded-full inline-block" title="Emergency Fund Active"></span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {goals.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No savings goals yet.</p>
                        ) : (
                            goals.slice(0, 3).map(goal => {
                                const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                                const isEmergency = goal.type === 'emergency';
                                return (
                                    <div key={goal.id} className={`p-4 rounded-2xl border ${isEmergency ? 'bg-red-500/5 border-red-500/20' : 'bg-surface-dark border-white/5'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`size-8 rounded-lg flex items-center justify-center ${isEmergency ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                                                <span className="material-symbols-outlined text-lg">{goal.icon || 'savings'}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                                                <p className="text-[10px] text-slate-400">Target: ₱{goal.targetAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-between mb-1">
                                            <span className="text-xs font-semibold text-white">₱{goal.currentAmount.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-400">{percent.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isEmergency ? 'bg-red-500' : 'bg-primary'}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {goals.length > 3 && (
                            <div className="text-center mt-2">
                                <span className="text-xs text-primary cursor-pointer hover:underline">View All Goals</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
                    <div className="flex flex-col gap-0 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-2 bottom-2 w-px bg-white/5"></div>

                        {transactions.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No recent activity.</p>
                        ) : (
                            transactions.slice(0, 5).map((tx, i) => (
                                <div key={tx.id || i} className="flex items-center gap-4 py-3 relative group">
                                    <div className={`relative z-10 size-8 rounded-full flex items-center justify-center border-2 border-[#111318] ${tx.type === 'income' ? 'bg-green-500 text-white' : 'bg-surface-dark text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-sm">{tx.type === 'income' ? 'arrow_downward' : 'arrow_upward'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">{tx.description}</p>
                                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-sm font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                        {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showOnboarding && (
                <OnboardingModal onComplete={handleOnboardingComplete} />
            )}

            <NetWorthModal
                isOpen={showNetWorthModal}
                onClose={() => setShowNetWorthModal(false)}
                transactions={transactions}
                currentNetWorth={currentNetWorth}
            />

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
        </div>
    );
};
