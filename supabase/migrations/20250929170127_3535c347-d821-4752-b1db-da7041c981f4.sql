-- Just update the status values for now
UPDATE public.orders SET status = 'completed' WHERE status = 'paid';