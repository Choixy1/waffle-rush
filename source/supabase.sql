-- 모두의 맵 저장소 만들기: Supabase > SQL Editor 에 통째로 붙여넣고 Run 을 눌러요 (한 번만)
create extension if not exists pgcrypto;
create table if not exists public.maps (
  id text primary key check (char_length(id) between 4 and 40),
  name text not null check (char_length(name) between 1 and 20),
  grid text not null check (char_length(grid) between 40 and 4000),
  secret_hash text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.maps enable row level security;
drop policy if exists "누구나 읽기" on public.maps;
create policy "누구나 읽기" on public.maps for select using (true);
revoke all on public.maps from anon, authenticated;
grant select (id, name, grid, created_at, updated_at) on public.maps to anon, authenticated;

create or replace function public.publish_map(p_id text, p_secret text, p_name text, p_grid text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare h text := encode(digest(p_secret, 'sha256'), 'hex');
begin
  if char_length(coalesce(p_secret, '')) < 16 then raise exception 'bad secret'; end if;
  if (select count(*) from maps where updated_at > now() - interval '1 minute') > 30 then raise exception 'busy'; end if;
  if (select count(*) from maps) >= 5000 and not exists (select 1 from maps where id = p_id) then raise exception 'full'; end if;
  insert into maps(id, name, grid, secret_hash) values (p_id, p_name, p_grid, h)
  on conflict (id) do update set name = excluded.name, grid = excluded.grid, updated_at = now()
  where maps.secret_hash = h;
  if not found then raise exception 'not owner'; end if;
end $$;

create or replace function public.unpublish_map(p_id text, p_secret text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from maps where id = p_id and secret_hash = encode(digest(p_secret, 'sha256'), 'hex');
end $$;

revoke all on function public.publish_map(text, text, text, text), public.unpublish_map(text, text) from public;
grant execute on function public.publish_map(text, text, text, text), public.unpublish_map(text, text) to anon, authenticated;
