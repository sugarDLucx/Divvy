import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addBudgetCategory } from '../../services/db';
import type { BudgetCategory } from '../../types';

interface AddBudgetModalProps {
    onClose: () => void;
    onSuccess: () => void;
    currentMonth: string;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ onClose, onSuccess, currentMonth }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'need' | 'want' | 'savings'>('need');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            const newBudget: Omit<BudgetCategory, 'id'> = {
                name,
                plannedAmount: parseFloat(amount),
                spentAmount: 0,
                type,
                month: currentMonth,
                userId: user.uid
            };

            await addBudgetCategory(newBudget);
            onSuccess();
        } catch (error) {
            console.error("Error adding budget:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 className="text-xl font-bold text-white mb-6">New Budget Category</h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Category Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rent, Groceries"
                            className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Monthly Limit</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
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
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Type (50/30/20 Rule)</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('need')}
                                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${type === 'need' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-dark border-transparent text-slate-400 hover:bg-white/5'}`}
                            >
                                Needs
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('want')}
                                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${type === 'want' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-surface-dark border-transparent text-slate-400 hover:bg-white/5'}`}
                            >
                                Wants
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('savings')}
                                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${type === 'savings' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-surface-dark border-transparent text-slate-400 hover:bg-white/5'}`}
                            >
                                Savings
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            {type === 'need' && "Essential expenses like rent, groceries, utilities."}
                            {type === 'want' && "Discretionary spending like dining out, entertainment."}
                            {type === 'savings' && "Future goals, emergency fund, investments."}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 mt-2"
                    >
                        {submitting ? 'Creating...' : 'Create Category'}
                    </button>
                </form>
            </div>
        </div>
    );
};
