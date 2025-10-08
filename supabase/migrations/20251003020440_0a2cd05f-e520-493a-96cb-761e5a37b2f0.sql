-- Add unique constraint on order_id in content_queue
ALTER TABLE content_queue ADD CONSTRAINT content_queue_order_id_key UNIQUE (order_id);

-- Auto-approve all existing pending paid customer uploads and add to queue
DO $$ 
DECLARE
    pending_order RECORD;
    next_pos INTEGER;
BEGIN
    -- Get the next queue position
    SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_pos FROM content_queue;
    
    -- Loop through all pending orders
    FOR pending_order IN 
        SELECT id FROM orders 
        WHERE moderation_status = 'pending' 
        AND is_admin_content = false
        ORDER BY created_at ASC
    LOOP
        -- Update order to approved
        UPDATE orders 
        SET moderation_status = 'approved',
            display_status = 'queued',
            status = 'completed',
            paid_at = COALESCE(paid_at, NOW())
        WHERE id = pending_order.id;
        
        -- Add to content queue if not already there
        INSERT INTO content_queue (order_id, queue_position, is_active)
        VALUES (pending_order.id, next_pos, false)
        ON CONFLICT (order_id) DO NOTHING;
        
        next_pos := next_pos + 1;
    END LOOP;
END $$;