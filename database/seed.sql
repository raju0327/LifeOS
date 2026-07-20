-- ============================================================================
-- LIFE OS - WORKSPACE INITIAL SEEDS (database/seed.sql)
-- Default initial categories and settings for new user accounts
-- ============================================================================

-- Function to seed workspace defaults for a newly authenticated user
CREATE OR REPLACE FUNCTION public.seed_user_workspace_defaults(p_user_id uuid, p_email text, p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Create Profile
    INSERT INTO public.user_profiles (user_id, username, full_name, email, role, avatar)
    VALUES (p_user_id, LTRIM(RTRIM(SPLIT_PART(p_email, '@', 1))), p_name, p_email, 'Administrator', '👤')
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Create User Settings
    INSERT INTO public.user_settings (user_id, theme, currency_symbol)
    VALUES (p_user_id, 'dark', '₹')
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Seed Default Task Categories
    INSERT INTO public.task_categories (id, user_id, name, color) VALUES
    ('cat_work', p_user_id, 'Work', '#a370f7'),
    ('cat_personal', p_user_id, 'Personal', '#10b981'),
    ('cat_health', p_user_id, 'Health', '#ef4444')
    ON CONFLICT (id, user_id) DO NOTHING;

    -- 4. Seed Default Finance Categories
    INSERT INTO public.finance_categories (id, user_id, name, type, color, budget) VALUES
    ('cat_fin_salary', p_user_id, 'Salary', 'income', '#10b981', 0),
    ('cat_fin_food', p_user_id, 'Food & Dining', 'expense', '#f59e0b', 15000),
    ('cat_fin_bills', p_user_id, 'Bills & Utilities', 'expense', '#ef4444', 8000),
    ('cat_fin_shopping', p_user_id, 'Shopping', 'expense', '#a370f7', 10000)
    ON CONFLICT (id, user_id) DO NOTHING;

    -- 5. Seed Travel Statistics
    INSERT INTO public.travel_statistics (user_id, total_trips, days_traveled, countries_visited, total_spent, photos_count)
    VALUES (p_user_id, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;
