import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { NetWorthChart } from '../components/dashboard/NetWorthChart';
import { useAuth } from '../context/AuthContext';
import { checkAndGenerateRecurringTransactions, getUserProfile, addTransactionWithBatch } from '../services/db';
import type { UserFinancialProfile } from '../types';
import { OnboardingModal } from '../components/modals/OnboardingModal';
import { NetWorthModal } from '../components/modals/NetWorthModal';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { transactions, stats, budgets, goals, loading: dataLoading } = useRealTimeData(user?.uid);
    const [profile, setProfile] = useState<UserFinancialProfile | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [showNetWorthModal, setShowNetWorthModal] = useState(false);
    const [salaryAmount, setSalaryAmount] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar State

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

    // Calculate Unassigned Money
    const monthlyIncome = Math.max(stats?.totalIncome || 0, profile?.monthlyIncome || 0);
    const monthlyExpense = stats?.totalExpenses || 0;

    return (
        <div className="flex bg-[#0b0e14] min-h-screen font-sans text-white selection:bg-neon-teal/30">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between p-4 md:hidden border-b border-white/5 bg-[#111318]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-neon-purple">
                            <span className="material-symbols-outlined text-white text-lg">account_balance_wallet</span>
                        </div>
                        <span className="font-bold text-lg">Divvy</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <header className="flex justify-between items-center mb-8">
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
                            <button className="relative p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full animate-pulse"></span>
                            </button>
                        </div>
                    </header>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
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
                </main>
            </div>

            {/* Modals */}
            <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingComplete} userId={user?.uid || ''} />

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
