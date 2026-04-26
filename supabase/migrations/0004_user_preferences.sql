-- Add user preference columns to existing profiles table
alter table profiles
  add column weight_unit text not null default 'lbs'
    check (weight_unit in ('lbs', 'kg')),
  add column rest_timer_seconds int not null default 90
    check (rest_timer_seconds between 10 and 600),
  add column theme text not null default 'system'
    check (theme in ('system', 'light', 'dark'));
