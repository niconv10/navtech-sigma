ALTER TABLE public.assignments DROP CONSTRAINT assignments_type_check;

ALTER TABLE public.assignments ADD CONSTRAINT assignments_type_check 
CHECK (type = ANY (ARRAY['exam'::text, 'quiz'::text, 'homework'::text, 'project'::text, 'paper'::text, 'lab'::text, 'discussion'::text, 'participation'::text, 'presentation'::text, 'midterm'::text, 'final'::text, 'other'::text]));