
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    orderBy,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction, BudgetCategory, SavingsGoal, UserFinancialProfile } from '../types';

// user profile
export const createUserProfile = async (userId: string, profile: Omit<UserFinancialProfile, 'userId'>) => {
    await setDoc(doc(db, 'financial_profiles', userId), {
        userId,
        ...profile
    });
};

export const getUserProfile = async (userId: string) => {
    const docRef = doc(db, 'financial_profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserFinancialProfile;
    }
    return null;
};

// Transactions
export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, 'transactions'), transaction);
        return docRef.id;
    } catch (e) {
        console.error("Error adding transaction: ", e);
        throw e;
    }
};

export const getTransactions = async (userId: string) => {
    const q = query(
        collection(db, 'transactions'),
        where("userId", "==", userId),
        orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

// Budgets
export const addBudgetCategory = async (budget: Omit<BudgetCategory, 'id'>) => {
    await addDoc(collection(db, 'budgets'), budget);
};

export const getBudgets = async (userId: string, month: string) => {
    const q = query(
        collection(db, 'budgets'),
        where("userId", "==", userId),
        where("month", "==", month)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory));
};

// Goals
export const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    await addDoc(collection(db, 'goals'), goal);
};

export const getGoals = async (userId: string) => {
    const q = query(collection(db, 'goals'), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
};

export const updateGoalAmount = async (goalId: string, newAmount: number) => {
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, {
        currentAmount: newAmount
    });
};
