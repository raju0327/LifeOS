-- ============================================================================
-- LIFE OS - ROW LEVEL SECURITY (RLS) POLICIES (database/rls.sql)
-- Strict user_id data isolation policies for all Life OS tables
-- ============================================================================

-- Function to safely enable RLS and apply owner-access policy
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'user_profiles', 'user_settings', 'tasks', 'task_categories', 'projects',
        'goals', 'events', 'timeblocks', 'pomodoro_history', 'notes', 'bookmarks',
        'journal_entries', 'vision_board', 'documents', 'finance_transactions',
        'finance_accounts', 'finance_categories', 'finance_budgets', 'finance_subscriptions',
        'finance_loans', 'health_water', 'health_sleep', 'health_mood', 'health_workout',
        'medicines', 'habits', 'vault_items', 'travel_trips', 'travel_itinerary',
        'travel_expenses', 'travel_gallery', 'travel_documents', 'packing_checklist',
        'bucket_list', 'travel_notes', 'visited_places', 'travel_statistics', 'skills',
        'job_applications', 'notifications'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable Row Level Security
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Drop existing policy if exists to avoid collision
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Users operate on own data', tbl);
        
        -- Create strict isolation policy (auth.uid() = user_id)
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);',
            'Users operate on own data', tbl
        );
    END LOOP;
END $$;
