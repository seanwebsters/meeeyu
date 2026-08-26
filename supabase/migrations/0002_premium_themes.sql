-- Premium backgrounds/themes for the profile scrapbook.
-- `is_premium` is set client-side today (no payment processor wired up yet —
-- see the "unlock" flow in EditBoard). Before a real launch, move that write
-- behind a server-verified purchase (Stripe webhook + service-role update)
-- so a user can't just flip it on themselves via the API.

alter table profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists background text not null default 'classic';

alter table profiles drop constraint if exists profiles_background_check;
alter table profiles
  add constraint profiles_background_check
  check (background in ('classic', 'dreamy', 'midnight', 'sunset', 'mint', 'y2k'));
