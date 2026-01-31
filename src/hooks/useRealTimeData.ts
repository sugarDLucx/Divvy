import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Adjust path if needed
import type { Transaction, BudgetCategory, SavingsGoal, UserStats } from '../types';

export const useRealTimeData = (userId: string | undefined) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Transactions Listener
        const qTx = query(
            collection(db, `users/${userId}/transactions`),
            orderBy('date', 'desc'),
            limit(50)
        );
        const unsubTx = onSnapshot(qTx, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(txs);
        });

        // 2. Budgets Listener (Current Month)
        const qBudget = query(
            collection(db, `users/${userId}/categories`),
            where('month', '==', currentMonth)
        );
        const unsubBudget = onSnapshot(qBudget, (snapshot) => {
            const buds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory));
            setBudgets(buds);
        });

        // 3. Goals Listener
        const qGoals = query(collection(db, `users/${userId}/goals`));
        const unsubGoals = onSnapshot(qGoals, (snapshot) => {
            const gs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
            setGoals(gs);
        });

        // 4. Stats Listener
        const statsRef = doc(db, `users/${userId}/stats/${currentMonth}`);
        const unsubStats = onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                setStats(docSnap.data() as UserStats);
            } else {
                setStats({ totalIncome: 0, totalExpenses: 0, month: currentMonth });
            }
        });

        setLoading(false);

        return () => {
            unsubTx();
            unsubBudget();
            unsubGoals();
            unsubStats();
        };
    }, [userId, currentMonth]);

    return { transactions, budgets, goals, stats, loading };
};
