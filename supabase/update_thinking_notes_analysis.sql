-- Add analysis column to thinking_notes table
alter table thinking_notes 
add column if not exists analysis jsonb;

-- Comment on column
comment on column thinking_notes.analysis is 'AI analysis result for the thought note';
