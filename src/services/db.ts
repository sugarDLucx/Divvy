import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    writeBatch,
    increment,
    getDoc,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Assuming this exports the initialized firestore instance
import type {
    Transaction,
    BudgetCategory,
    SavingsGoal,
    UserFinancialProfile,
    RecurringTemplate
} from '../types';

// ============================================
// User Financial Profile
// ============================================

export const createUserProfile = async (userId: string, profile: Omit<UserFinancialProfile, 'userId'>) => {
    // Uses top-level collection for simpler auth management, or can be users/{userId}/profile
    // Sticking to separate collection for now as per previous pattern, or moving to subcollection?
    // Plan said users/{userId}. Let's make the profile the document at users/{userId} itself?
    // Or users/{userId}/settings/profile?
    // User request: "users/{userId}: Stores profile settings"
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...profile, userId }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserFinancialProfile | null> => {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return { userId: docSnap.id, ...docSnap.data() } as UserFinancialProfile;
    }
    return null;
};

export const updateUserProfile = async (userId: string, data: Partial<UserFinancialProfile>) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
};

// ============================================
// Transactions (Batch Write Implementation)
// ============================================

export const addTransactionWithBatch = async (transaction: Transaction) => {
    const batch = writeBatch(db);
    const userId = transaction.userId;

    // 1. Transaction Document
    const txRef = doc(collection(db, `users/${userId}/transactions`));
    const txId = txRef.id;
    batch.set(txRef, { ...transaction, id: txId });

    // 2. Update Stats (Current Month)
    const currentMonth = transaction.date.slice(0, 7); // YYYY-MM
    const statsRef = doc(db, `users/${userId}/stats/${currentMonth}`);

    const amountVal = transaction.amount;
    const isIncome = transaction.type === 'income';

    batch.set(statsRef, {
        totalIncome: isIncome ? increment(amountVal) : increment(0),
        totalExpenses: !isIncome ? increment(amountVal) : increment(0),
        month: currentMonth
    }, { merge: true });

    // 3. Update Budget Category (if Expense)
    if (!isIncome && transaction.category) {
        // Method A: Direct Update via ID (Robust)
        if (transaction.budgetId) {
            const budgetRef = doc(db, `users/${userId}/categories`, transaction.budgetId);
            batch.update(budgetRef, {
                spentAmount: increment(amountVal)
            });
        }
        // Method B: Query Helper (Fallback)
        else {
            const q = query(
                collection(db, `users/${userId}/categories`),
                where('month', '==', currentMonth),
                where('name', '==', transaction.category),
                limit(1)
            );
            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const budgetDoc = querySnapshot.docs[0];
                    const budgetRef = doc(db, `users/${userId}/categories`, budgetDoc.id);
                    batch.update(budgetRef, {
                        spentAmount: increment(amountVal)
                    });
                }
            } catch (e) {
                console.warn("Could not match budget category for update", e);
            }
        }
    }

    // 4. Update Goal (if Savings Contribution)
    // If we mark it as type 'expense' and category 'Savings' (or specific logic)
    // User logic: "Contribute to Goal" -> creates Transaction (Expense) -> Updates Goal
    if (transaction.goalId) {
        const goalRef = doc(db, `users/${userId}/goals`, transaction.goalId);
        batch.update(goalRef, {
            currentAmount: increment(amountVal)
        });
    }

    // 5. Update User Profile Net Worth (Cached)
    // User wanted "Add Salary" to update current net worth. 
    // We should do this for ALL transactions to keep it in sync.
    // Income (+) -> Increases Net Worth
    // Expense (-) -> Decreases Net Worth
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
        totalNetWorth: isIncome ? increment(amountVal) : increment(-amountVal)
    });

    await batch.commit();
    return txId;
};

export const getTransactions = async (userId: string, limitCount = 50) => {
    const q = query(
        collection(db, `users/${userId}/transactions`),
        orderBy("date", "desc"),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
    // Note: Reversing stats/budget updates on delete is complex.
    // For MVP, we might just delete the doc or do a simplified reverse batch if we fetch the tx first.
    // Let's implement a clean delete that reverses the math.

    const txRef = doc(db, `users/${userId}/transactions`, transactionId);
    const txSnap = await getDoc(txRef);

    if (!txSnap.exists()) return;
    const txData = txSnap.data() as Transaction;

    const batch = writeBatch(db);
    batch.delete(txRef);

    // Reverse Stats
    const currentMonth = txData.date.slice(0, 7);
    const statsRef = doc(db, `users/${userId}/stats/${currentMonth}`);
    const amountVal = txData.amount;
    const isIncome = txData.type === 'income';

    batch.set(statsRef, {
        totalIncome: isIncome ? increment(-amountVal) : increment(0),
        totalExpenses: !isIncome ? increment(-amountVal) : increment(0)
    }, { merge: true });

    // Reverse Budget
    if (!isIncome && txData.category) {
        const q = query(
            collection(db, `users/${userId}/categories`),
            where('month', '==', currentMonth),
            where('name', '==', txData.category),
            limit(1)
        );
        const snaps = await getDocs(q);
        if (!snaps.empty) {
            batch.update(snaps.docs[0].ref, { spentAmount: increment(-amountVal) });
        }
    }

    // Reverse Goal
    if (txData.goalId) {
        const goalRef = doc(db, `users/${userId}/goals`, txData.goalId);
        batch.update(goalRef, { currentAmount: increment(-amountVal) });
    }

    await batch.commit();
};

// ============================================
// Budget Categories
// ============================================

export const addBudgetCategory = async (category: Omit<BudgetCategory, 'id'>) => {
    // category.userId is needed for the path
    await addDoc(collection(db, `users/${category.userId}/categories`), category);
};

export const getBudgets = async (userId: string, month: string) => {
    const q = query(
        collection(db, `users/${userId}/categories`),
        where("month", "==", month)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory));
};

export const deleteBudgetCategory = async (userId: string, budgetId: string) => {
    const ref = doc(db, `users/${userId}/categories`, budgetId);
    await deleteDoc(ref);
};

export const updateBudgetCategory = async (userId: string, budgetId: string, updates: Partial<BudgetCategory>) => {
    const ref = doc(db, `users/${userId}/categories`, budgetId);
    await updateDoc(ref, updates);
};

// ============================================
// Savings Goals
// ============================================

export const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    await addDoc(collection(db, `users/${goal.userId}/goals`), goal);
};

export const getGoals = async (userId: string) => {
    const q = query(collection(db, `users/${userId}/goals`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
};


// ============================================
// Recurring Templates & Logic
// ============================================

export const createRecurringTemplate = async (template: Omit<RecurringTemplate, 'id'>) => {
    await addDoc(collection(db, `users/${template.userId}/recurring_templates`), template);
};

export const checkAndGenerateRecurringTransactions = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const q = query(
        collection(db, `users/${userId}/recurring_templates`),
        where("active", "==", true),
        where("nextOccurrence", "<=", today)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    let updatesCount = 0;

    snapshot.docs.forEach(docSnap => {
        const template = docSnap.data() as RecurringTemplate;

        // 1. Create the new transaction
        // NOTE: We cannot use addTransactionWithBatch inside this loop because we are already inside a logical batch.
        // We have to split the batch logic manually or run them sequentially.
        // Since we want atomic updates for recurring, let's just do the Transaction creation here 
        // and ideally update stats/budget too. 
        // For simplicity in this function, we will just create the Transaction 
        // and rely on a simpler flow or expand this function to do all the increments.
        // Expanding increments:

        const newTxRef = doc(collection(db, `users/${userId}/transactions`));
        const newTx: Transaction = {
            amount: template.amount,
            category: template.category,
            date: today, // Or template.nextOccurrence if we want exact
            description: template.description,
            type: template.type,
            userId: userId,
            isRecurring: true,
            needsVsWants: template.needsVsWants
        };
        batch.set(newTxRef, newTx);

        // Update Stats (Simplified for batch)
        const currentMonth = today.slice(0, 7);
        const statsRef = doc(db, `users/${userId}/stats/${currentMonth}`);
        const isIncome = template.type === 'income';
        batch.set(statsRef, {
            totalIncome: isIncome ? increment(template.amount) : increment(0),
            totalExpenses: !isIncome ? increment(template.amount) : increment(0),
            month: currentMonth
        }, { merge: true });

        // Update Template Next Occurrence
        let nextDate = new Date(template.nextOccurrence);
        if (template.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        if (template.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (template.frequency === 'bi-weekly') nextDate.setDate(nextDate.getDate() + 14);

        batch.update(docSnap.ref, { nextOccurrence: nextDate.toISOString().split('T')[0] });
        updatesCount++;
    });

    if (updatesCount > 0) {
        await batch.commit();
        console.log(`Generated ${updatesCount} recurring transactions.`);
    }
};
