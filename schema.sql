-- Create tables and RLS policies for UniRide

-- 1. PROFILES Table (Extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  university_name text,
  phone_number text,
  is_driver boolean default false,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. RIDES Table
create table rides (
  id uuid default uuid_generate_v4() primary key,
  driver_id uuid references profiles(id) not null,
  origin_location text not null,
  destination_university text not null,
  departure_time timestamp with time zone not null,
  return_time timestamp with time zone,
  available_seats int not null default 1,
  recurrence_pattern text, -- e.g., 'Mon,Wed,Fri' or 'One-off'
  status text check (status in ('active', 'cancelled', 'completed')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Rides
alter table rides enable row level security;

create policy "Active rides are viewable by everyone."
  on rides for select
  using ( true );

create policy "Drivers can insert their own rides."
  on rides for insert
  with check ( auth.uid() = driver_id );

create policy "Drivers can update their own rides."
  on rides for update
  using ( auth.uid() = driver_id );

-- 3. RIDE REQUESTS Table
create table ride_requests (
  id uuid default uuid_generate_v4() primary key,
  ride_id uuid references rides(id) not null,
  passenger_id uuid references profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ride_id, passenger_id) -- Prevent duplicate requests
);

-- RLS for Ride Requests
alter table ride_requests enable row level security;

create policy "Drivers can view requests for their rides."
  on ride_requests for select
  using ( auth.uid() in (select driver_id from rides where id = ride_id) );

create policy "Passengers can view their own requests."
  on ride_requests for select
  using ( auth.uid() = passenger_id );

create policy "Passengers can create requests."
  on ride_requests for insert
  with check ( auth.uid() = passenger_id );

-- Drivers can update status (accept/reject)
create policy "Drivers can update status of requests for their rides."
  on ride_requests for update
  using ( auth.uid() in (select driver_id from rides where id = ride_id) );
  
-- Passengers can cancel their own request (if needed)
create policy "Passengers can update their own requests."
  on ride_requests for update
  using ( auth.uid() = passenger_id );


-- 4. MESSAGES Table (Chat)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  ride_request_id uuid references ride_requests(id) not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Messages
alter table messages enable row level security;

-- Policy: Users can view messages if they are part of the ride request (either driver or passenger)
create policy "Users can view messages they belong to."
  on messages for select
  using (
    auth.uid() in (
      select passenger_id from ride_requests where id = ride_request_id
      union
      select r.driver_id from rides r join ride_requests rr on rr.ride_id = r.id where rr.id = ride_request_id
    )
  );

-- Policy: Users can insert messages if they are part of the ride request AND status is accepted
create policy "Users can send messages if request is accepted."
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from ride_requests rr
      join rides r on r.id = rr.ride_id
      where rr.id = ride_request_id
      and rr.status = 'accepted'
      and (rr.passenger_id = auth.uid() or r.driver_id = auth.uid())
    )
  );
  
-- Function to handle new user profile creation automatically (Optional but recommended)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Realtime for Messages
alter publication supabase_realtime add table messages;
