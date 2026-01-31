export interface Transaction {
    id?: string;
    amount: number;
    category: string;
    date: string; // ISO date string
    description: string;
    type: 'income' | 'expense';
    receiptUrl?: string;
    isRecurring?: boolean;
    needsVsWants?: 'need' | 'want' | 'savings'; // For zero-based budgeting
    goalId?: string; // If this transaction contributes to a savings goal
    budgetId?: string; // Link to specific budget category for robust updates
    userId: string;
}

export interface RecurringTemplate {
    id?: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    frequency: 'monthly' | 'weekly' | 'bi-weekly';
    nextOccurrence: string; // ISO Date "YYYY-MM-DD"
    needsVsWants?: 'need' | 'want' | 'savings';
    active: boolean;
    userId: string;
}

export interface UserStats {
    id?: string; // usually "current_month" or "all_time" or "YYYY-MM"
    totalIncome: number;
    totalExpenses: number;
    month: string; // "YYYY-MM" or "ALL"
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
    type?: 'goal' | 'emergency';
    userId: string;
}

export interface UserFinancialProfile {
    userId: string;
    totalNetWorth: number; // Current calculated net worth
    initialNetWorth: number; // Starting balance entered by user
    monthlyIncome: number;
    salaryDate?: number; // Day of month (1-31)
    salaryFrequency?: 'monthly' | 'bi-weekly';
    currency: string;
    onboardingCompleted: boolean;
}
