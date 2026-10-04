alter table public.hebrew_recordings drop constraint hebrew_recordings_sound_id_check;
alter table public.hebrew_recordings add constraint hebrew_recordings_sound_id_check check (
  sound_id ~ '^(vowel|b|v|g|d|h|z|kh|chaf|t|y|k|l|m|n|s|p|f|ts|r|sh)-(ah|ee|eh|oo|oh|uh)$'
  or sound_id ~ '^segol-(alef|bet|vet|gimel|dalet|he|vav|zayin|chet|tet|yod|kaf|chaf|lamed|mem|nun|samekh|ayin|peh|fe|tsadi|qof|resh|shin|sin|taf|saf)$'
  or sound_id = 'alef-patach-yod'
  or sound_id ~ '^final-(chaf|mem|nun|fe|tsadi)-(bah|mee|leh|shoh)$'
  or sound_id in ('final-chaf-sheva', 'final-chaf-kamatz', 'final-chaf-lecha', 'final-chaf-shelcha')
);
