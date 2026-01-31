import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addTransactionWithBatch, deleteTransaction } from '../services/db';
import type { Transaction } from '../types';
import { useRealTimeData } from '../hooks/useRealTimeData';

export const Transactions: React.FC = () => {
    const { user } = useAuth();
    const { transactions, loading, budgets, stats } = useRealTimeData(user?.uid);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'bi-weekly'>('monthly');
    const [needsVsWants, setNeedsVsWants] = useState<'need' | 'want' | 'savings'>('need');

    // Handle Category Change -> Auto-set Type & Needs/Wants
    const handleCategoryChange = (selectedCategoryName: string) => {
        setCategory(selectedCategoryName);

        // Find budget logic
        const matchedBudget = budgets.find(b => b.name === selectedCategoryName);
        if (matchedBudget) {
            // It's an expense category from budget
            setType('expense');
            setNeedsVsWants(matchedBudget.type);
        } else if (incomeCategories.includes(selectedCategoryName)) {
            setType('income');
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const parsedAmount = parseFloat(amount);

        // Budget Validation (for Expenses)
        if (type === 'expense') {
            const matchedBudget = budgets.find(b => b.name === category);
            if (matchedBudget) {
                const remaining = matchedBudget.plannedAmount - matchedBudget.spentAmount;
                if (parsedAmount > remaining) {
                    alert(`Transaction blocked: This amount (₱${parsedAmount}) exceeds the remaining budget for ${category} (₱${remaining.toFixed(2)}).`);
                    return; // Block execution
                }
            }
        }

        // Find budget ID if exists
        const matchedBudget = type === 'expense' ? budgets.find(b => b.name === category) : undefined;

        const newTransaction: Transaction = {
            amount: parsedAmount,
            category: type === 'income' ? category || 'Income' : category, // Fix: Ensure category is set for income too if selected, or default
            date,
            description,
            type,
            userId: user.uid,
            isRecurring,
            needsVsWants: type === 'expense' ? needsVsWants : undefined,
            budgetId: matchedBudget?.id
        };

        try {
            await addTransactionWithBatch(newTransaction);
            setIsAdding(false);
            // Reset form
            setAmount('');
            setDescription('');
            setCategory('');
            setDate(new Date().toISOString().split('T')[0]);
            setIsRecurring(false);
        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await deleteTransaction(user.uid, id);
        } catch (error) {
            console.error("Error deleting transaction", error);
        }
    };

    const handleDownload = () => {
        const headers = ["Date", "Description", "Category", "Type", "Amount", "Recurring", "Need/Want"];
        const csvContent = [
            headers.join(","),
            ...transactions.map(tx => [
                tx.date,
                `"${tx.description}"`, // Quote description to handle commas
                tx.category,
                tx.type,
                tx.amount,
                tx.isRecurring ? "Yes" : "No",
                tx.needsVsWants || ""
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Derived state for categories
    // Filter budgets for expense categories
    const budgetCategoryNames = budgets.map(b => b.name);
    // If no budgets, maybe fallback or empty? 
    // User requirement: "The select category ... should the ones listed on the budget"
    const expenseCategories = budgetCategoryNames.length > 0 ? budgetCategoryNames : ["Rent", "Groceries", "Transport", "Other"];
    const incomeCategories = ["Salary", "Freelance", "Investment", "Gift", "Other"];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Transactions</h1>
                    <p className="text-slate-400">Track your income and expenses in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownload}
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                        title="Download CSV"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg ${isAdding ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-primary hover:bg-blue-600 text-white shadow-primary/25 hover:shadow-primary/40'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">{isAdding ? 'close' : 'add'}</span>
                        {isAdding ? 'Cancel' : 'Add New'}
                    </button>
                </div>
            </div>

            {/* Add Transaction Form */}
            {isAdding && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-fade-in-up">
                    <form onSubmit={handleAddTransaction} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Type Toggle */}
                            <div className="flex gap-1 p-1 bg-surface-dark rounded-lg border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setType('expense')}
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${type === 'expense' ? 'bg-[#1a1f2e] text-white shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('income')}
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${type === 'income' ? 'bg-[#1a1f2e] text-neon-teal shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Income
                                </button>
                            </div>

                            {/* Amount */}
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors">₱</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            {/* Date */}
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />

                            {/* Category */}
                            <select
                                required
                                value={category}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select Category</option>
                                {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Description */}
                            <input
                                type="text"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description (e.g. Weekly Groceries)"
                                className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />

                            {/* Recurring & Needs/Wants */}
                            <div className="flex gap-4">
                                {type === 'expense' && (
                                    <select
                                        value={needsVsWants}
                                        disabled={true} // Locked based on Budget selection
                                        className="flex-1 bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-slate-400 cursor-not-allowed opacity-70"
                                        title="Defined by Budget Category"
                                    >
                                        <option value="need">Need</option>
                                        <option value="want">Want</option>
                                        <option value="savings">Savings</option>
                                    </select>
                                )}

                                <div className="flex items-center gap-2 bg-surface-dark border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:border-white/20 transition-colors" onClick={() => setIsRecurring(!isRecurring)}>
                                    <div className={`size-5 rounded flex items-center justify-center border ${isRecurring ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                                        {isRecurring && <span className="material-symbols-outlined text-[16px] text-white">check</span>}
                                    </div>
                                    <span className="text-sm text-slate-300 font-medium select-none">Recurring</span>
                                </div>
                            </div>
                        </div>

                        {isRecurring && (
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex flex-col sm:flex-row gap-4 items-center animate-fade-in">
                                <span className="text-blue-300 text-sm font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined">update</span>
                                    Repeat this transaction:
                                </span>
                                <div className="flex gap-2">
                                    {['monthly', 'weekly', 'bi-weekly'].map(freq => (
                                        <button
                                            key={freq}
                                            type="button"
                                            onClick={() => setFrequency(freq as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${frequency === freq ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-surface-dark text-slate-400 hover:text-white border border-white/5'}`}
                                        >
                                            {freq}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                            >
                                Save Transaction
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transactions List */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 min-h-[400px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                        <div className="size-16 rounded-full bg-surface-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-slate-600">receipt_long</span>
                        </div>
                        <p className="text-slate-500 font-medium">No transactions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 text-sm font-mono">{tx.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{tx.description}</span>
                                                {tx.isRecurring && (
                                                    <div className="flex items-center gap-1 text-[10px] text-blue-400 mt-0.5">
                                                        <span className="material-symbols-outlined text-[12px]">repeat</span>
                                                        Recurring
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${tx.type === 'income'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-slate-700/30 text-slate-300 border-slate-600/30'
                                                }`}>
                                                {tx.category}
                                            </span>
                                            {tx.needsVsWants && (
                                                <span className={`ml-2 text-[10px] uppercase tracking-wider font-bold ${tx.needsVsWants === 'need' ? 'text-blue-400' :
                                                    tx.needsVsWants === 'want' ? 'text-purple-400' : 'text-green-400'
                                                    }`}>
                                                    {tx.needsVsWants}
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-neon-teal' : 'text-white'}`}>
                                            {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(tx.id!)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Transaction"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
