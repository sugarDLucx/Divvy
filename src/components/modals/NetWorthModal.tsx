import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import type { Transaction } from '../../types';

interface NetWorthModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    currentNetWorth: number;
}

export const NetWorthModal: React.FC<NetWorthModalProps> = ({ isOpen, onClose, transactions, currentNetWorth }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ALL'>('30d');

    // Calculate historical net worth
    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        // 1. Sort transactions by date (descending)
        const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 2. Create a map of daily changes
        const dailyChanges = new Map<string, number>();
        sortedTx.forEach(tx => {
            const date = tx.date.split('T')[0];
            const amount = tx.type === 'income' ? tx.amount : -tx.amount;
            dailyChanges.set(date, (dailyChanges.get(date) || 0) + amount);
        });

        // 3. Generate daily data points working BACKWARDS from today
        const points = [];
        let runningBalance = currentNetWorth;
        const today = new Date();
        const daysToLookBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

        for (let i = 0; i < daysToLookBack; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Push CURRENT EOD balance for this date
            points.push({
                date: dateStr,
                value: runningBalance,
                formattedDate: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });

            // Undo the changes of this day to get the STARTING balance of this day (which is End Balance of yesterday)
            const change = dailyChanges.get(dateStr) || 0;
            runningBalance -= change;
        }

        return points.reverse(); // Return in chronological order for the chart
    }, [transactions, currentNetWorth, timeRange]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-4xl h-[600px] flex flex-col rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111318]">
                    <div>
                        <h2 className="text-xl font-bold text-white">Net Worth Trend</h2>
                        <p className="text-slate-400 text-sm">Track your financial growth over time</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col bg-[#0b0e14]">
                    {/* Controls */}
                    <div className="flex justify-end gap-2 mb-6">
                        {(['7d', '30d', '90d', 'ALL'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {range === 'ALL' ? 'All Time' : range.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                <XAxis
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    hide={false}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1c1f26',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#2dd4bf' }}
                                    formatter={(value: number | undefined) => [value != null ? `₱${value.toLocaleString()}` : '', 'Net Worth']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2dd4bf"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
