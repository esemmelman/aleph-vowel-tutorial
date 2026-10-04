alter table public.hebrew_recordings drop constraint hebrew_recordings_sound_id_check;
alter table public.hebrew_recordings add constraint hebrew_recordings_sound_id_check check (
sound_id ~ '^(vowel|b|v|g|d|h|z|kh|t|y|k|l|m|n|s|p|f|ts|r|sh)-(ah|ee|eh|oo|oh|uh)$'
or sound_id ~ '^segol-(alef|bet|vet|gimel|dalet|he|vav|zayin|chet|tet|yod|kaf|chaf|lamed|mem|nun|samekh|ayin|peh|fe|tsadi|qof|resh|shin|sin|taf|saf)$'
);
