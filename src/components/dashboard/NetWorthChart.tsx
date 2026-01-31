import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { Transaction } from '../../types';

interface NetWorthChartProps {
    transactions: Transaction[];
    currentNetWorth: number;
    onClick: () => void;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ transactions, currentNetWorth, onClick }) => {

    // Calculate historical net worth (Simplified for small widget: last 30 days)
    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const dailyChanges = new Map<string, number>();
        sortedTx.forEach(tx => {
            const date = tx.date.split('T')[0];
            const amount = tx.type === 'income' ? tx.amount : -tx.amount;
            dailyChanges.set(date, (dailyChanges.get(date) || 0) + amount);
        });

        const points = [];
        let runningBalance = currentNetWorth;
        const today = new Date();

        // Show last 30 days for the snapshot
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            points.push({
                date: dateStr,
                value: runningBalance
            });

            const change = dailyChanges.get(dateStr) || 0;
            runningBalance -= change;
        }

        return points.reverse();
    }, [transactions, currentNetWorth]);

    // If no data, show a flat line or placeholder
    const chartData = data.length > 0 ? data : [{ value: 0 }, { value: 0 }];

    return (
        <div
            className="w-full h-[300px] mt-4 relative cursor-pointer group"
            onClick={onClick}
            role="button"
            aria-label="View Net Worth Details"
        >
            {/* Hover Hint */}
            <div className="absolute inset-0 z-10 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                <span className="text-white font-medium bg-black/60 px-4 py-2 rounded-lg border border-white/10">Click to Expand</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1c1f26', borderRadius: '8px', border: 'none' }}
                        itemStyle={{ color: '#2dd4bf' }}
                        formatter={(val: number | undefined) => [val != null ? `₱${val.toLocaleString()}` : '', 'Net Worth']}
                        labelStyle={{ display: 'none' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2dd4bf"
                        strokeWidth={3}
                        fill="url(#chartGradient)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
