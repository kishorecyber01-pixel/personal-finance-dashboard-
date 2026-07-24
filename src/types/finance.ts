export type TransactionType = "income" | "expense";

export type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Debit Card"
  | "Credit Card"
  | "Bank Transfer"
  | "Wallet"
  | "Other";

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  description: string;
  merchant: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
  updatedAt?: string;
}

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: string;
  nextOccurrence: string;
  merchant: string;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}