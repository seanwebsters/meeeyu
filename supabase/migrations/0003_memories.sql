-- Free-positioned "memory" pins: photo cards the owner can drag anywhere on
-- a dedicated board and tag friends in, instead of the ordered scrapbook grid.

alter table profile_cards
  add column if not exists position_x real,
  add column if not exists position_y real;

alter table profile_cards drop constraint if exists profile_cards_position_range;
alter table profile_cards
  add constraint profile_cards_position_range
  check (
    (position_x is null or (position_x >= 0 and position_x <= 100))
    and (position_y is null or (position_y >= 0 and position_y <= 100))
  );
