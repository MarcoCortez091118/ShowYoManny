-- Reset play counts and set unlimited plays for admin content
UPDATE orders 
SET 
  play_count = 0,
  max_plays = CASE 
    WHEN is_admin_content = true THEN 999999
    ELSE max_plays
  END
WHERE display_status IN ('queued', 'active', 'playing');

-- Also ensure admin content doesn't auto-complete after play
UPDATE orders 
SET auto_complete_after_play = false
WHERE is_admin_content = true;