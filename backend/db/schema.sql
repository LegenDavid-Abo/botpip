-- BotPip Complete Database Schema
-- Run this entire file in your Supabase SQL Editor once

create extension if not exists vector;

-- FIRMS
create table if not exists firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  plan text not null default 'trial' check (plan in ('trial','starter','pro','enterprise')),
  status text not null default 'active' check (status in ('active','paused','cancelled','overdue')),
  trial_ends_at timestamptz,
  flw_customer_email text,
  pending_tx_ref text,
  health_score int default 0,
  bot_name text default 'Support Bot',
  bot_color text default '#7F77DD',
  brand_logo_url text,
  confidence_threshold int default 75,
  typing_delay_ms int default 1500,
  response_length text default 'balanced',
  tone text default 'professional',
  use_emojis boolean default true,
  bold_key_info boolean default true,
  reply_threading boolean default true,
  personalise_names boolean default true,
  only_from_docs boolean default true,
  share_links_when_relevant boolean default true,
  human_handoff boolean default true,
  mt4_screenshot_reader boolean default true,
  voice_messages boolean default true,
  auto_thread_long_convos boolean default true,
  stamp_resolved boolean default true,
  bot_mode text default 'ai',
  ask_account_type_first boolean default true,
  offer_calculator boolean default true,
  evaluation_max_lots numeric,
  master_max_lots numeric,
  risk_formula text,
  approved_emojis text[] default array['📊','💰','✅','⚠️','🎯','📰','⏰'],
  custom_emojis text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PLATFORM CONNECTIONS
create table if not exists platform_connections (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  platform text not null check (platform in ('discord','website','intercom','zendesk','telegram','whatsapp','slack','email')),
  status text not null default 'pending' check (status in ('pending','connected','error','disconnected')),
  discord_bot_token text,
  discord_client_id text,
  discord_guild_id text,
  discord_guild_name text,
  widget_welcome_message text default 'Hi! Ask me anything.',
  widget_auto_open boolean default false,
  widget_show_mobile boolean default true,
  widget_color text default '#7F77DD',
  intercom_access_token text,
  intercom_mode text default 'ai',
  zendesk_subdomain text,
  zendesk_email text,
  zendesk_api_token text,
  telegram_bot_token text,
  whatsapp_phone_number_id text,
  whatsapp_access_token text,
  slack_bot_token text,
  slack_team_id text,
  connected_at timestamptz,
  created_at timestamptz default now()
);

-- DISCORD CHANNELS
create table if not exists discord_channels (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  guild_id text not null,
  channel_id text not null,
  channel_name text not null,
  channel_type text default 'text',
  monitored boolean default false,
  created_at timestamptz default now(),
  unique(firm_id, channel_id)
);

-- KNOWLEDGE DOCS
create table if not exists knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  type text not null check (type in ('pdf','docx','txt','url','interview')),
  source_url text,
  raw_text text,
  chunk_count int default 0,
  accuracy_score numeric default 0,
  status text default 'processing' check (status in ('processing','indexed','error')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- KNOWLEDGE CHUNKS with vectors
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  doc_id uuid not null references knowledge_docs(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_index int,
  created_at timestamptz default now()
);

-- Vector search function
create or replace function match_chunks(
  query_embedding vector(1536),
  firm_id_param uuid,
  match_count int default 5,
  match_threshold float default 0.75
)
returns table (id uuid, content text, doc_id uuid, similarity float)
language sql stable as $$
  select kc.id, kc.content, kc.doc_id,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where kc.firm_id = firm_id_param
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;

-- CONVERSATIONS
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  platform text not null,
  platform_user_id text not null,
  platform_user_name text,
  platform_channel_id text,
  platform_thread_id text,
  status text default 'open' check (status in ('open','resolved','escalated')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MESSAGES
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  firm_id uuid not null references firms(id) on delete cascade,
  role text not null check (role in ('user','bot','human_agent')),
  content text not null,
  platform_message_id text,
  source_doc_id uuid references knowledge_docs(id),
  confidence_score numeric,
  escalated boolean default false,
  link_shared boolean default false,
  created_at timestamptz default now()
);

-- ESCALATIONS
create table if not exists escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  firm_id uuid not null references firms(id) on delete cascade,
  reason text,
  confidence_at_escalation numeric,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- KNOWLEDGE CONFLICTS
create table if not exists knowledge_conflicts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  doc_a_id uuid references knowledge_docs(id),
  doc_b_id uuid references knowledge_docs(id),
  description text not null,
  resolution text,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- REPLY TEMPLATES
create table if not exists reply_templates (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  trigger_keywords text[],
  content text not null,
  usage_count int default 0,
  created_at timestamptz default now()
);

-- SCHEDULED MESSAGES
create table if not exists scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  platform text not null,
  target text not null,
  content text not null,
  send_at timestamptz not null,
  sent boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- SUPPORT MESSAGES (firms contact super admin)
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  subject text not null,
  content text not null,
  read boolean default false,
  reply text,
  replied_at timestamptz,
  created_at timestamptz default now()
);

-- PLANS (super admin editable)
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_monthly int not null,
  platforms_allowed text default '1',
  messages_monthly text default '1000',
  docs_allowed text default '5',
  team_seats text default '1',
  analytics_level text default 'basic',
  human_handoff boolean default false,
  api_access boolean default false,
  white_label boolean default false,
  updated_at timestamptz default now()
);

insert into plans (name,price_monthly,platforms_allowed,messages_monthly,docs_allowed,team_seats,analytics_level,human_handoff,api_access,white_label)
values
  ('starter',99,'1','1,000','5','1','basic',false,false,false),
  ('pro',299,'All','Unlimited','Unlimited','5','advanced',true,true,false),
  ('enterprise',999,'All','Unlimited','Unlimited','Unlimited','full',true,true,true)
on conflict(name) do nothing;

-- COUPONS
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null,
  discount_value numeric not null,
  valid_for_plans text[] default array['starter','pro','enterprise'],
  expires_at timestamptz,
  max_uses int,
  uses_count int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- AFFILIATES
create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  referral_code text not null unique,
  commission_rate numeric default 20,
  total_earned numeric default 0,
  pending_payout numeric default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id),
  firm_id uuid references firms(id),
  commission_amount numeric,
  paid boolean default false,
  created_at timestamptz default now()
);

-- CHANGELOG
create table if not exists changelog (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  type text not null,
  notes text not null,
  notify_firms boolean default false,
  published_at timestamptz default now()
);

-- PLATFORM SETTINGS
create table if not exists platform_settings (
  id int primary key default 1,
  maintenance_mode boolean default false,
  signups_open boolean default true,
  trial_days int default 14,
  trial_require_card boolean default true,
  trial_auto_charge boolean default true,
  trial_expiry_warning_days int default 3,
  grace_period_days int default 3,
  ai_model text default 'claude-sonnet-4-6',
  default_language text default 'english',
  weekly_digest_email boolean default true,
  whatsapp_alerts boolean default true,
  health_alert_threshold int default 60,
  referral_commission_rate numeric default 20,
  currency text default 'USD',
  check (id = 1)
);
insert into platform_settings default values on conflict do nothing;

-- ANALYTICS EVENTS
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  event_type text not null,
  platform text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_messages_firm on messages(firm_id);
create index if not exists idx_messages_conv on messages(conversation_id);
create index if not exists idx_messages_created on messages(created_at desc);
create index if not exists idx_conversations_firm on conversations(firm_id);
create index if not exists idx_conversations_lookup on conversations(firm_id,platform,platform_user_id);
create index if not exists idx_chunks_firm on knowledge_chunks(firm_id);
create index if not exists idx_analytics_firm on analytics_events(firm_id,created_at desc);
create index if not exists idx_escalations_firm on escalations(firm_id);
