
-- Drop existing ALL policies on semesters and assignments
DROP POLICY IF EXISTS "Users can CRUD own semesters" ON public.semesters;
DROP POLICY IF EXISTS "Users can CRUD own assignments" ON public.assignments;

-- Semesters: granular policies
CREATE POLICY "Users can select own semesters" ON public.semesters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own semesters" ON public.semesters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own semesters" ON public.semesters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own semesters" ON public.semesters FOR DELETE USING (auth.uid() = user_id);

-- Assignments: granular policies
CREATE POLICY "Users can select own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assignments" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assignments" ON public.assignments FOR DELETE USING (auth.uid() = user_id);
