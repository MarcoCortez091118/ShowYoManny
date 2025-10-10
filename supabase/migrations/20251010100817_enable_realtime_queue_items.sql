/*
  # Enable Realtime for Queue Items
  
  Enable realtime functionality for the queue_items table to allow
  real-time updates in the UI without manual refresh.
  
  1. Changes
    - Enable realtime publication for queue_items table
    - This allows clients to subscribe to INSERT, UPDATE, DELETE events
  
  2. Impact
    - AdminQueue will update automatically when items change
    - KioskDisplay will update automatically when items change
    - No manual refresh needed
*/

-- Enable realtime for queue_items table
ALTER PUBLICATION supabase_realtime ADD TABLE queue_items;
