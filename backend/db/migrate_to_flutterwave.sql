-- Run this ONLY if you already ran the old schema.sql with Stripe fields.
-- If you're setting up fresh, just use the updated schema.sql instead — skip this file.

alter table firms drop column if exists stripe_customer_id;
alter table firms drop column if exists stripe_subscription_id;
alter table firms add column if not exists flw_customer_email text;
alter table firms add column if not exists pending_tx_ref text;
