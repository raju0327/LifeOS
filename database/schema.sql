-- ============================================================================
-- LIFE OS - MULTI-USER POSTGRESQL DATABASE SCHEMA (database/schema.sql)
-- Complete normalized DDL script for all Life OS modules with user_id isolation
-- ============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USER ACCOUNT MANAGEMENT & PROFILE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    full_name text,
    avatar text DEFAULT '👤',
    role text DEFAULT 'User',
    email text,
    mobile text,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme text DEFAULT 'dark',
    currency_symbol text DEFAULT '₹',
    google_sheet_sync_enabled boolean DEFAULT false,
    google_sheet_url text,
    notifications_enabled boolean DEFAULT true,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. TASKS & GOALS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tasks (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    priority text DEFAULT 'medium',
    category text DEFAULT 'General',
    due_date text,
    time text,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(user_id, completed);

CREATE TABLE IF NOT EXISTS public.task_categories (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#a370f7',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category text,
    progress numeric DEFAULT 0,
    status text DEFAULT 'Active',
    deadline text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

CREATE TABLE IF NOT EXISTS public.goals (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text,
    target numeric DEFAULT 0,
    current numeric DEFAULT 0,
    deadline text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- ----------------------------------------------------------------------------
-- 3. CALENDAR & ROUTINES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.events (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    date text NOT NULL,
    time text,
    category text,
    description text,
    location text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(user_id, date);

CREATE TABLE IF NOT EXISTS public.timeblocks (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    activity text NOT NULL,
    category text,
    color text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. FOCUS & POMODORO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pomodoro_history (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode text DEFAULT 'work',
    duration_minutes numeric NOT NULL,
    task_title text,
    completed_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 5. NOTES & BOOKMARKS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notes (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    category text DEFAULT 'General',
    color text DEFAULT '#a370f7',
    pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    url text NOT NULL,
    category text DEFAULT 'General',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 6. JOURNAL & VISION
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date text NOT NULL,
    mood text,
    content text NOT NULL,
    gratitude text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.vision_board (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    image_url text NOT NULL,
    category text,
    target_year text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 7. DOCUMENTS HUB
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.documents (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text DEFAULT 'General',
    file_type text,
    file_size text,
    file_data text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 8. FINANCE PLANNER
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    amount numeric NOT NULL,
    category text NOT NULL,
    account text DEFAULT 'Cash',
    description text,
    date text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_finance_txs_user_id ON public.finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_txs_date ON public.finance_transactions(user_id, date);

CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.finance_categories (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL,
    color text DEFAULT '#a370f7',
    budget numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.finance_budgets (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id text NOT NULL,
    limit_amount numeric DEFAULT 0,
    period text DEFAULT 'Monthly',
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.finance_subscriptions (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    cost numeric NOT NULL,
    billing_cycle text DEFAULT 'Monthly',
    due_date text,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.finance_loans (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lender text NOT NULL,
    total_amount numeric NOT NULL,
    remaining_amount numeric NOT NULL,
    emi numeric DEFAULT 0,
    due_day text,
    type text DEFAULT 'Given',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    icon text DEFAULT 'fa-tag',
    color text DEFAULT '#a370f7',
    type text DEFAULT 'expense', -- 'income', 'expense', 'savings', 'emergency'
    monthly_limit numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    period_type text DEFAULT 'Monthly', -- 'Monthly', 'Yearly', 'Custom'
    start_date text NOT NULL,
    end_date text NOT NULL,
    total_budget numeric DEFAULT 0,
    total_spent numeric DEFAULT 0,
    status text DEFAULT 'Active', -- 'Active', 'Completed', 'Archived'
    notes text,
    carry_forward boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.budget_allocations (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id text NOT NULL,
    category_id text NOT NULL,
    allocated_limit numeric DEFAULT 0,
    spent_amount numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.budget_transactions (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id text NOT NULL,
    transaction_id text NOT NULL,
    category_id text NOT NULL,
    amount numeric NOT NULL,
    impact_percentage numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.budget_alerts (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id text NOT NULL,
    category_id text,
    threshold_percentage numeric NOT NULL, -- 80, 90, 100
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.budget_history (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period text NOT NULL,
    total_budget numeric DEFAULT 0,
    total_spent numeric DEFAULT 0,
    utilization_rate numeric DEFAULT 0,
    archived_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 9. HEALTH & FITNESS & MEDICINE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.health_water (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date text NOT NULL,
    intake_ml numeric DEFAULT 0,
    goal_ml numeric DEFAULT 2500,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.health_sleep (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date text NOT NULL,
    hours numeric DEFAULT 0,
    quality text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.health_mood (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date text NOT NULL,
    mood text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.health_workout (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date text NOT NULL,
    exercise text NOT NULL,
    duration_minutes numeric DEFAULT 0,
    calories_burned numeric DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.medicines (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    dosage text NOT NULL,
    timing text NOT NULL,
    taken boolean DEFAULT false,
    last_reset_date text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 10. HABIT TRACKER
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.habits (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text DEFAULT 'General',
    frequency text DEFAULT 'Daily',
    streak numeric DEFAULT 0,
    best_streak numeric DEFAULT 0,
    completed_today boolean DEFAULT false,
    history jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);

-- ----------------------------------------------------------------------------
-- 11. PERSONAL VAULT (ENCRYPTED DATA)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.vault_items (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text DEFAULT 'General',
    encrypted_payload text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_vault_user_id ON public.vault_items(user_id);

-- ----------------------------------------------------------------------------
-- 12. LIFESTYLE & TRAVEL TRACKER
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.travel_trips (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination text NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    budget numeric DEFAULT 0,
    travelers numeric DEFAULT 1,
    progress numeric DEFAULT 0,
    status text NOT NULL,
    cover_image text,
    things_to_do_count numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.travel_itinerary (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id text NOT NULL,
    day_number numeric NOT NULL,
    date text NOT NULL,
    time text NOT NULL,
    activity text NOT NULL,
    description text,
    location text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.travel_expenses (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    date text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.travel_gallery (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id text NOT NULL,
    photo_url text NOT NULL,
    caption text,
    date_taken text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.travel_documents (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id text NOT NULL,
    title text NOT NULL,
    file_type text NOT NULL,
    file_url text NOT NULL,
    upload_date text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.packing_checklist (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id text NOT NULL,
    item_name text NOT NULL,
    category text DEFAULT 'General',
    packed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.bucket_list (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination text NOT NULL,
    country text NOT NULL,
    category text DEFAULT 'General',
    target_year text,
    visited boolean DEFAULT false,
    cover_image text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.travel_notes (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id text NOT NULL,
    title text NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.visited_places (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city text NOT NULL,
    country text NOT NULL,
    lat numeric NOT NULL,
    lng numeric NOT NULL,
    year_visited text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.travel_statistics (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_trips numeric DEFAULT 0,
    days_traveled numeric DEFAULT 0,
    countries_visited numeric DEFAULT 0,
    total_spent numeric DEFAULT 0,
    photos_count numeric DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 13. CAREER PORTFOLIO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.skills (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    level text DEFAULT '3',
    category text DEFAULT 'Technical',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company text,
    title text NOT NULL,
    status text DEFAULT 'Applied',
    notes text,
    applied_date text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS & SYSTEM LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id, user_id)
);
