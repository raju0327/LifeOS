-- ============================================================================
-- LIFE OS - ENTERPRISE FINANCE MODULE SQL SCHEMA & SUPABASE RLS POLICIES
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Finance Categories Table
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-tag',
    color VARCHAR(30) DEFAULT '#a370f7',
    type VARCHAR(20) DEFAULT 'expense', -- expense, income
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- RLS Policies for Categories
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or default categories" ON public.finance_categories
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own categories" ON public.finance_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.finance_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.finance_categories
    FOR DELETE USING (auth.uid() = user_id);


-- 3. Finance Transactions Table
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category VARCHAR(100) DEFAULT 'General',
    category_id VARCHAR(50) REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    account VARCHAR(50) DEFAULT 'bank', -- bank, cash, card, upi, savings
    member_id VARCHAR(50) DEFAULT 'admin',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags TEXT[],
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for Fast Querying & Search
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.finance_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.finance_transactions(account);

-- RLS Policies for Transactions
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON public.finance_transactions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 4. Budgets Master Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly, custom
    month_year VARCHAR(10) NOT NULL, -- e.g. '2026-07'
    total_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    UNIQUE(user_id, month_year)
);

-- RLS Policies for Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budget masters" ON public.budgets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. Budget Allocations Table
CREATE TABLE IF NOT EXISTS public.budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL,
    limit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(budget_id, category_id)
);

-- RLS Policies for Allocations
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budget allocations" ON public.budget_allocations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.finance_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE,
    color VARCHAR(30) DEFAULT '#10b981',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals" ON public.finance_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 7. Bills & Subscriptions Table
CREATE TABLE IF NOT EXISTS public.finance_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    due_day INT DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
    account VARCHAR(50) DEFAULT 'card',
    auto_pay BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.finance_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.finance_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 8. Loans & EMI Tracker Table
CREATE TABLE IF NOT EXISTS public.finance_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lender_name VARCHAR(150) NOT NULL,
    total_loan NUMERIC(15, 2) NOT NULL,
    remaining_balance NUMERIC(15, 2) NOT NULL,
    emi_amount NUMERIC(15, 2) NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.finance_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loans" ON public.finance_loans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 9. Enable Realtime Publications on Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_loans;
