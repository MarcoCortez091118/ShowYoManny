-- Reset sync state to first item in current queue
UPDATE kiosk_sync_state
SET current_content_id = '8d41b0cb-23dd-46ee-b1b9-a3946a87f920',
    current_index = 0,
    last_advance_time = NOW(),
    sync_timestamp = NOW()
WHERE id = '8536c0e4-8c2d-439d-bdf4-127591d66a1a';