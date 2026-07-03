-- The exercise catalog remains read-only through table RLS. This narrowly
-- scoped function allows authenticated users to create a normalized catalog
-- entry without granting general insert/update/delete access to the table.

create or replace function public.create_exercise_catalog_item(p_name text)
returns public.exercise_catalog
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text;
  catalog_item public.exercise_catalog;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  normalized_name := regexp_replace(trim(p_name), '[[:space:]]+', ' ', 'g');

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 120 then
    raise exception 'Exercise name must be between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  select exercise.*
  into catalog_item
  from public.exercise_catalog as exercise
  where lower(regexp_replace(trim(exercise.name), '[[:space:]]+', ' ', 'g'))
    = lower(normalized_name)
  limit 1;

  if found then
    return catalog_item;
  end if;

  begin
    insert into public.exercise_catalog (name, category, uses_bodyweight)
    values (normalized_name, 'other', false)
    returning * into catalog_item;
  exception
    when unique_violation then
      select exercise.*
      into catalog_item
      from public.exercise_catalog as exercise
      where lower(exercise.name) = lower(normalized_name)
      limit 1;
  end;

  return catalog_item;
end;
$$;

revoke execute on function public.create_exercise_catalog_item(text)
from public, anon;

grant execute on function public.create_exercise_catalog_item(text)
to authenticated;
