-- Admin-only RPCs. Support tickets and feedback are read directly by admins via
-- their RLS policies, but the admin dashboard + user directory need data from
-- auth.users (emails, last_sign_in_at) that is not reachable from the client.
-- These SECURITY DEFINER functions expose exactly that, and only to admins:
-- every function refuses to run unless public.is_admin() is true.

-- ---------------------------------------------------------------------------
-- Aggregate counters + a small recent-activity feed for the admin home.
-- Returns a single json object so the client gets everything in one round-trip.
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select json_build_object(
    'total_users', (select count(*) from auth.users),
    'new_users_7d', (
      select count(*) from auth.users where created_at >= now() - interval '7 days'
    ),
    'total_tickets', (select count(*) from public.support_tickets),
    'pending_tickets', (
      select count(*) from public.support_tickets
      where status in ('open', 'in_progress')
    ),
    'feedback_count', (select count(*) from public.feedback),
    'recent_activity', (
      select coalesce(json_agg(row_to_json(a)), '[]'::json)
      from (
        select 'ticket' as kind, id, subject as title, category as detail,
               status, created_at
        from public.support_tickets
        union all
        select 'feedback' as kind, id, coalesce(comment, '') as title,
               module as detail, rating::text as status, created_at
        from public.feedback
        order by created_at desc
        limit 12
      ) a
    )
  )
  into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- User directory for admin User Management. Joins auth.users (email, timestamps)
-- with the public profile and cheap per-user usage counts. Returns a json array
-- ordered newest-first; search / sort / filter happen client-side.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users()
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(row_to_json(u) order by u.created_at desc), '[]'::json)
  from (
    select
      au.id,
      au.email,
      au.created_at,
      au.last_sign_in_at,
      p.full_name,
      p.avatar_url,
      p.is_admin,
      (select count(*) from public.workout_sessions ws where ws.user_id = au.id) as workout_count,
      (select count(*) from public.habits h where h.user_id = au.id) as habit_count,
      (select count(*) from public.transactions t where t.user_id = au.id) as transaction_count
    from auth.users au
    left join public.profiles p on p.id = au.id
  ) u
  into result;

  return result;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;
