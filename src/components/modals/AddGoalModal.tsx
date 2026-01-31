import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addSavingsGoal } from '../../services/db';
import type { SavingsGoal } from '../../types';

interface AddGoalModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('0');
    const [dueDate, setDueDate] = useState('');
    const [icon, setIcon] = useState('savings');
    const [isEmergency, setIsEmergency] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Auto-set icon if emergency
    const handleEmergencyChange = (checked: boolean) => {
        setIsEmergency(checked);
        if (checked) {
            setIcon('emergency');
            setName('Emergency Fund');
        } else {
            if (name === 'Emergency Fund') setName('');
            setIcon('savings');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            // Simple monthly contribution calculation
            let monthlyContribution = 0;
            if (dueDate) {
                const now = new Date();
                const targetDate = new Date(dueDate);
                const months = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
                const remaining = parseFloat(targetAmount) - parseFloat(currentAmount);
                if (months > 0 && remaining > 0) {
                    monthlyContribution = remaining / months;
                }
            }

            const newGoal: Omit<SavingsGoal, 'id'> = {
                name,
                targetAmount: parseFloat(targetAmount),
                currentAmount: parseFloat(currentAmount),
                monthlyContribution,
                dueDate,
                icon,
                type: isEmergency ? 'emergency' : 'goal',
                userId: user.uid
            };

            await addSavingsGoal(newGoal);
            onSuccess();
        } catch (error) {
            console.error("Error adding goal:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const icons = ['savings', 'flight', 'laptop', 'directions_car', 'home', 'school', 'emergency', 'shopping_bag'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 className="text-xl font-bold text-white mb-6">New Savings Goal</h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Emergency Fund Toggle */}
                    <div className="flex items-center gap-3 p-3 bg-surface-dark rounded-xl border border-white/5 mb-2 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleEmergencyChange(!isEmergency)}>
                        <div className={`size-5 rounded border flex items-center justify-center transition-colors ${isEmergency ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                            {isEmergency && <span className="material-symbols-outlined text-sm text-black font-bold">check</span>}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">Emergency Fund</span>
                            <span className="text-xs text-slate-400">Mark this as your primary emergency fund</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Goal Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. New Laptop, Vacation"
                            className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Saved Already</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={currentAmount}
                                    onChange={(e) => setCurrentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Target Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-surface-dark border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Icon</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {icons.map(ic => (
                                <button
                                    key={ic}
                                    type="button"
                                    onClick={() => setIcon(ic)}
                                    className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${icon === ic ? 'bg-primary text-white' : 'bg-surface-dark text-slate-400 hover:text-white border border-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{ic}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 mt-2"
                    >
                        {submitting ? 'Creating...' : 'Create Goal'}
                    </button>
                </form>
            </div>
        </div>
    );
};
