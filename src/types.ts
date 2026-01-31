export interface Transaction {
    id?: string;
    amount: number;
    category: string;
    date: string; // ISO date string
    description: string;
    type: 'income' | 'expense';
    receiptUrl?: string;
    isRecurring?: boolean;
    userId: string;
}

export interface BudgetCategory {
    id?: string;
    name: string;
    type: 'need' | 'want' | 'savings';
    plannedAmount: number;
    spentAmount: number;
    userId: string;
    month: string; // "2023-10"
}

export interface SavingsGoal {
    id?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
    dueDate?: string;
    icon?: string;
    color?: string; // Hex code or tailwind class
    userId: string;
}

export interface UserFinancialProfile {
    userId: string;
    totalNetWorth: number; // Starting balance + calculated changes
    monthlyIncome: number;
    currency: string;
    onboardingCompleted: boolean;
}
