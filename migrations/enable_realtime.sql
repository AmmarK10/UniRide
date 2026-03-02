-- Run this script in your Supabase SQL Editor to enable Realtime for these tables.
-- Without this, Supabase will not broadcast INSERT, UPDATE, or DELETE events to the frontend channels.

alter publication supabase_realtime add table ride_requests;
alter publication supabase_realtime add table rides;
