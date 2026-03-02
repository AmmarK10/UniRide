-- Run this script in your Supabase SQL Editor to add the missing DELETE policies.

-- Allow drivers to delete their own rides
create policy "Drivers can delete their own rides."
  on rides for delete
  using ( auth.uid() = driver_id );

-- Allow drivers to delete requests associated with their rides
create policy "Drivers can delete requests for their rides."
  on ride_requests for delete
  using ( auth.uid() in (select driver_id from rides where id = ride_id) );

-- Allow passengers to delete their own requests
create policy "Passengers can delete their own requests."
  on ride_requests for delete
  using ( auth.uid() = passenger_id );
