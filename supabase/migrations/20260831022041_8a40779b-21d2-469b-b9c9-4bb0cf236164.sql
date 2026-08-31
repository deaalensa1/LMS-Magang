-- 1) Trigger tidak lagi percaya role dari metadata client
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, institution)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'institution')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'mahasiswa')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $function$;

-- 2) Sembunyikan kunci jawaban: grant per-kolom
REVOKE SELECT ON public.quizzes FROM authenticated;
GRANT SELECT (id, module_id, question, option_a, option_b, option_c, option_d, position, created_at)
  ON public.quizzes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;

-- 3) Penilaian di server; blokir insert nilai langsung dari client
REVOKE INSERT ON public.quiz_attempts FROM authenticated;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_module_id uuid, _answers jsonb)
RETURNS TABLE (score integer, total integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _score integer; _total integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT count(*)::int,
         count(*) FILTER (WHERE lower(_answers->>q.id::text) = lower(q.correct_option))::int
    INTO _total, _score
  FROM public.quizzes q
  WHERE q.module_id = _module_id;

  IF _total = 0 THEN RAISE EXCEPTION 'Modul ini belum punya kuis'; END IF;

  INSERT INTO public.quiz_attempts (user_id, module_id, score, total, answers)
  VALUES (_uid, _module_id, _score, _total, _answers);

  score := _score; total := _total;
  RETURN NEXT;
END; $function$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;