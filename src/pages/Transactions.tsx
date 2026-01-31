import React, { useState, useEffect } from 'react';
import { addTransaction, getTransactions } from '../services/db';
import { useAuth } from '../context/AuthContext';
import type { Transaction } from '../types';

export const Transactions: React.FC = () => {
    const { user } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Groceries');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            if (!user) return;
            const data = await getTransactions(user.uid);
            setTransactions(data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            const newTransaction: Omit<Transaction, 'id'> = {
                amount: parseFloat(amount),
                category,
                date,
                description,
                type: 'expense', // Defaulting to expense for now, could add toggle
                isRecurring,
                userId: user.uid
            };

            await addTransaction(newTransaction);
            setIsAdding(false);
            // Reset form
            setAmount('');
            setDescription('');
            // Refresh list
            fetchTransactions();
        } catch (error) {
            console.error("Error adding transaction:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
            {/* Page Heading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white text-3xl md:text-4xl font-black tracking-tight">Transactions</h2>
                    <p className="text-slate-400 text-base">Track every dollar responsibly.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">{isAdding ? 'close' : 'add'}</span>
                    {isAdding ? 'Cancel' : 'Add Transaction'}
                </button>
            </div>

            {/* Add Transaction Form Panel */}
            {isAdding && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-fade-in-down">
                    <h3 className="text-white font-bold text-lg mb-4">New Transaction</h3>
                    <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-surface-dark border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                            >
                                <option>Groceries</option>
                                <option>Dining Out</option>
                                <option>Rent</option>
                                <option>Utilities</option>
                                <option>Entertainment</option>
                                <option>Income</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-surface-dark border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Description</label>
                            <input
                                type="text"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What was this for?"
                                className="w-full bg-surface-dark border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2 lg:col-span-4 mt-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="rounded bg-surface-dark border-white/10 text-primary focus:ring-primary"
                                />
                                <label htmlFor="recurring" className="text-sm text-slate-300">Recurring (Monthly)</label>
                            </div>
                            <div className="flex-1"></div>
                            <button type="submit" disabled={submitting} className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transactions List */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold">Recent Transactions</h3>
                    <div className="flex gap-2">
                        <button className="p-1 text-slate-400 hover:text-white"><span className="material-symbols-outlined">filter_list</span></button>
                        <button className="p-1 text-slate-400 hover:text-white"><span className="material-symbols-outlined">download</span></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No transactions found. Add one above!</td></tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-slate-400">{t.date}</td>
                                        <td className="px-6 py-4 text-white font-medium">{t.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-slate-300 border border-white/20">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-bold text-right ${t.category === 'Income' ? 'text-neon-teal' : 'text-white'}`}>
                                            {t.category === 'Income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500 hover:text-primary cursor-pointer">
                                            {t.receiptUrl && <span className="material-symbols-outlined text-[18px]">receipt_long</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
