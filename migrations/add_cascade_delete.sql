-- Run this script in your Supabase SQL Editor to allow deleting ride requests that have chat messages.
-- This updates the foreign key constraint to cascade deletions automatically.

alter table messages drop constraint messages_ride_request_id_fkey;
alter table messages add constraint messages_ride_request_id_fkey foreign key (ride_request_id) references ride_requests(id) on delete cascade;
