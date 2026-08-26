-- Prompt catalog seed. Safe to re-run (skips duplicates by question text).
insert into prompts (question, category)
select v.question, v.category
from (values
  ('What animal would I be?', 'personality'),
  ('What colour am I?', 'personality'),
  ('What song reminds you of me?', 'music'),
  ('What celebrity do I remind you of?', 'personality'),
  ('What city am I?', 'personality'),
  ('What fictional character am I?', 'personality'),
  ('What would my warning label say?', 'chaos'),
  ('What job would I have in another life?', 'personality'),
  ('What aesthetic am I?', 'style'),
  ('What drink am I?', 'personality'),
  ('What era do I belong in?', 'personality'),
  ('What emoji am I?', 'personality'),
  ('What is my biggest green flag?', 'personality'),
  ('What is my most chaotic trait?', 'chaos'),
  ('What would I get arrested for?', 'chaos'),
  ('What would my superpower be?', 'personality'),
  ('Where will I be in 10 years?', 'future'),
  ('What reality show would I survive?', 'chaos'),
  ('What three words describe me?', 'personality'),
  ('What is my red flag?', 'chaos')
) as v(question, category)
where not exists (
  select 1 from prompts p where p.question = v.question
);
