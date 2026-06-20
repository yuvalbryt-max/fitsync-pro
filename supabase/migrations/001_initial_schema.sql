-- supabase/migrations/001_initial_schema.sql
-- Run this in Supabase Dashboard → SQL Editor

create extension if not exists vector;

-- Users (extends Supabase auth.users)
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  name       text,
  height_cm  int,
  birth_date date,
  gender     text check (gender in ('male','female','other')),
  timezone   text not null default 'Asia/Jerusalem',
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "users_own" on public.users
  using (auth.uid() = id) with check (auth.uid() = id);

create table public.body_metrics (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg   numeric(5,2),
  fat_pct     numeric(4,1),
  muscle_kg   numeric(5,2),
  bmi         numeric(4,1),
  source      text not null check (source in ('manual','garmin_scale'))
);
alter table public.body_metrics enable row level security;
create policy "bm_own" on public.body_metrics using (auth.uid() = user_id);
create index on public.body_metrics(user_id, measured_at desc);

create table public.daily_summary (
  id              bigserial primary key,
  user_id         uuid not null references public.users(id) on delete cascade,
  date            date not null,
  bmr_kcal        int not null default 0,
  active_kcal     int not null default 0,
  steps_kcal      int not null default 0,
  consumed_kcal   int not null default 0,
  protein_g       int not null default 0,
  carbs_g         int not null default 0,
  fat_g           int not null default 0,
  net_balance     int not null default 0,
  unique(user_id, date)
);
alter table public.daily_summary enable row level security;
create policy "ds_own" on public.daily_summary using (auth.uid() = user_id);
create index on public.daily_summary(user_id, date desc);

create table public.nutrition_entries (
  id            bigserial primary key,
  user_id       uuid not null references public.users(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  food_name     text not null,
  grams         numeric(7,2),
  kcal          int not null,
  protein_g     numeric(6,1),
  carbs_g       numeric(6,1),
  fat_g         numeric(6,1),
  entry_method  text not null check (entry_method in ('photo','text','manual')),
  raw_input     text,
  ai_model_used text
);
alter table public.nutrition_entries enable row level security;
create policy "ne_own" on public.nutrition_entries using (auth.uid() = user_id);
create index on public.nutrition_entries(user_id, logged_at desc);

create table public.activities (
  id                  bigserial primary key,
  user_id             uuid not null references public.users(id) on delete cascade,
  garmin_activity_id  bigint unique,
  activity_type       text,
  started_at          timestamptz,
  duration_seconds    int,
  distance_meters     numeric(10,2),
  calories            int,
  hr_avg              int,
  hr_max              int,
  hr_zones            jsonb,
  cadence_avg         int,
  pace_avg_sec_km     int,
  vo2max_estimate     numeric(4,1),
  raw_data            jsonb
);
alter table public.activities enable row level security;
create policy "act_own" on public.activities using (auth.uid() = user_id);
create index on public.activities(user_id, started_at desc);

create table public.health_metrics (
  id            bigserial primary key,
  user_id       uuid not null references public.users(id) on delete cascade,
  recorded_at   timestamptz not null,
  metric_type   text not null,
  value         numeric(10,3) not null,
  unit          text
);
alter table public.health_metrics enable row level security;
create policy "hm_own" on public.health_metrics using (auth.uid() = user_id);
create index on public.health_metrics(user_id, metric_type, recorded_at desc);

create table public.workouts (
  id              bigserial primary key,
  user_id         uuid not null references public.users(id) on delete cascade,
  jefit_log_id    text unique,
  workout_date    date not null,
  plan_name       text,
  duration_min    int,
  total_volume_kg numeric(10,2),
  exercises       jsonb not null default '[]'
);
alter table public.workouts enable row level security;
create policy "wk_own" on public.workouts using (auth.uid() = user_id);
create index on public.workouts(user_id, workout_date desc);

create table public.personal_records (
  id            bigserial primary key,
  user_id       uuid not null references public.users(id) on delete cascade,
  exercise_name text not null,
  record_type   text not null default '1rm',
  value         numeric(7,2),
  achieved_at   date,
  workout_id    bigint references public.workouts(id),
  unique(user_id, exercise_name, record_type)
);
alter table public.personal_records enable row level security;
create policy "pr_own" on public.personal_records using (auth.uid() = user_id);

create table public.chat_messages (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  session_id  uuid,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  model_used  text,
  embedding   vector(1536),
  created_at  timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "cm_own" on public.chat_messages using (auth.uid() = user_id);
create index on public.chat_messages(user_id, created_at desc);
create index on public.chat_messages using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table public.ai_insights (
  id            bigserial primary key,
  user_id       uuid not null references public.users(id) on delete cascade,
  insight_date  date not null,
  model_used    text,
  content       text not null,
  data_snapshot jsonb,
  unique(user_id, insight_date)
);
alter table public.ai_insights enable row level security;
create policy "ai_own" on public.ai_insights using (auth.uid() = user_id);

create table public.sync_log (
  id             bigserial primary key,
  user_id        uuid not null references public.users(id),
  sync_type      text,
  started_at     timestamptz,
  finished_at    timestamptz,
  status         text check (status in ('success','partial','failed')),
  records_synced int,
  error_msg      text
);
