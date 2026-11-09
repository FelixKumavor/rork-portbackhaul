-- ============================================================
-- PortBackhaul Reputation & Loyalty System
-- Trust Profile · Five membership levels · Elite Circle points
-- Violations & appeals · Admin-configurable thresholds
-- All scoring is server-side and idempotent (unique event references).
-- ============================================================

-- ---------- 1. Reputation profile (one per user) ----------
CREATE TABLE IF NOT EXISTS user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  trust_score integer NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  membership_level text NOT NULL DEFAULT 'BRONZE'
    CHECK (membership_level IN ('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')),
  completed_trips integer NOT NULL DEFAULT 0 CHECK (completed_trips >= 0),
  on_time_deliveries integer NOT NULL DEFAULT 0 CHECK (on_time_deliveries >= 0),
  cancelled_trips integer NOT NULL DEFAULT 0 CHECK (cancelled_trips >= 0),
  payment_compliance integer NOT NULL DEFAULT 100 CHECK (payment_compliance BETWEEN 0 AND 100),
  customer_satisfaction integer NOT NULL DEFAULT 100 CHECK (customer_satisfaction BETWEEN 0 AND 100),
  loyalty_points integer NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  account_standing text NOT NULL DEFAULT 'GOOD'
    CHECK (account_standing IN ('GOOD','WARNING','RESTRICTED','SUSPENDED','TERMINATED')),
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_reputation_level_idx ON user_reputation (membership_level);
CREATE INDEX IF NOT EXISTS user_reputation_score_idx ON user_reputation (trust_score DESC);

ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_reputation_select_own ON user_reputation FOR SELECT
  USING (user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));

-- ---------- 2. Reputation event ledger (append-only scoring source) ----------
CREATE TABLE IF NOT EXISTS reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_change integer NOT NULL,
  reference_id text,
  description text NOT NULL,
  verification_status text NOT NULL DEFAULT 'VERIFIED'
    CHECK (verification_status IN ('VERIFIED','PENDING','DISMISSED')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Idempotency: the same event (type + reference) can never be applied twice.
CREATE UNIQUE INDEX IF NOT EXISTS reputation_events_unique_ref
  ON reputation_events (user_id, event_type, reference_id)
  WHERE reference_id IS NOT NULL AND verification_status <> 'DISMISSED';
CREATE INDEX IF NOT EXISTS reputation_events_user_idx ON reputation_events (user_id, created_at DESC);

ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY reputation_events_select_own ON reputation_events FOR SELECT
  USING (user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));

-- ---------- 3. Elite Circle loyalty points ledger ----------
CREATE TABLE IF NOT EXISTS elite_circle_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('EARN','REDEEM','ADJUST')),
  reference_id text,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS elite_circle_points_unique_ref
  ON elite_circle_points (user_id, transaction_type, reference_id)
  WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS elite_circle_points_user_idx ON elite_circle_points (user_id, created_at DESC);

ALTER TABLE elite_circle_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY elite_circle_points_select_own ON elite_circle_points FOR SELECT
  USING (user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));

-- ---------- 4. Reward catalogue + redemptions ----------
CREATE TABLE IF NOT EXISTS reward_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN
    ('SERVICE_FEE_DISCOUNT','PRIORITY_MATCHING','PROMOTIONAL','RECOGNITION','PREMIUM_PRIVILEGE')),
  cost_points integer NOT NULL CHECK (cost_points > 0),
  role_scope text CHECK (role_scope IN ('CARGO_OWNER','CLEARING_AGENT','TRUCK_OWNER','DRIVER')),
  min_membership_level text NOT NULL DEFAULT 'BRONZE'
    CHECK (min_membership_level IN ('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')),
  active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reward_catalogue ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_catalogue_select ON reward_catalogue FOR SELECT
  USING (active = true OR has_admin_permission('ADMIN_VIEW'));
CREATE POLICY reward_catalogue_admin_write ON reward_catalogue FOR INSERT
  WITH CHECK (has_admin_permission('ADMIN_VIEW'));
CREATE POLICY reward_catalogue_admin_update ON reward_catalogue FOR UPDATE
  USING (has_admin_permission('ADMIN_VIEW'));

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES reward_catalogue(id) ON DELETE RESTRICT,
  points_spent integer NOT NULL CHECK (points_spent > 0),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','GRANTED','REJECTED','USED')),
  reference_id text NOT NULL,
  decided_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reference_id)
);
CREATE INDEX IF NOT EXISTS reward_redemptions_user_idx ON reward_redemptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reward_redemptions_status_idx ON reward_redemptions (status) WHERE status = 'PENDING';

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_redemptions_select_own ON reward_redemptions FOR SELECT
  USING (user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));
CREATE POLICY reward_redemptions_select_admin ON reward_redemptions FOR UPDATE
  USING (has_admin_permission('ADMIN_VIEW'));

-- ---------- 5. Violations & appeals ----------
CREATE TABLE IF NOT EXISTS user_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  violation_type text NOT NULL CHECK (violation_type IN
    ('FALSE_REGISTRATION','FAKE_TRUCK_DOCUMENTS','FRAUDULENT_DELIVERY_CONFIRMATION',
     'ABANDONED_TRIP','REPEATED_UNJUSTIFIED_CANCELLATIONS','PAYMENT_FRAUD',
     'TRANSACTION_MANIPULATION','REPEATED_MISCONDUCT')),
  severity text NOT NULL CHECK (severity IN ('LEVEL_1','LEVEL_2','LEVEL_3','LEVEL_4','LEVEL_5')),
  description text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','UNDER_REVIEW','DECIDED','DISMISSED')),
  decision text,
  decision_notes text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_violations_user_idx ON user_violations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_violations_status_idx ON user_violations (status) WHERE status IN ('OPEN','UNDER_REVIEW');

ALTER TABLE user_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_violations_select_own ON user_violations FOR SELECT
  USING (user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));

CREATE TABLE IF NOT EXISTS user_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  violation_id uuid NOT NULL REFERENCES user_violations(id) ON DELETE CASCADE,
  appeal_reason text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  decision text,
  decision_notes text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (violation_id)
);
CREATE INDEX IF NOT EXISTS user_appeals_status_idx ON user_appeals (status) WHERE status = 'PENDING';

ALTER TABLE user_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_appeals_select_own ON user_appeals FOR SELECT
  USING (user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));
CREATE POLICY user_appeals_insert_own ON user_appeals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_violations v
      WHERE v.id = violation_id AND v.user_id = auth.uid()
    )
  );

-- ---------- 6. Configurable membership thresholds ----------
CREATE TABLE IF NOT EXISTS reputation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_level text NOT NULL UNIQUE
    CHECK (membership_level IN ('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')),
  minimum_score integer NOT NULL CHECK (minimum_score BETWEEN 0 AND 100),
  minimum_completed_trips integer NOT NULL CHECK (minimum_completed_trips >= 0),
  minimum_account_age_days integer NOT NULL CHECK (minimum_account_age_days >= 0),
  require_verification boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reputation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY reputation_settings_select ON reputation_settings FOR SELECT
  USING (true);

INSERT INTO reputation_settings (membership_level, minimum_score, minimum_completed_trips, minimum_account_age_days, require_verification)
VALUES
  ('BRONZE',   0,  0,  0,   false),
  ('SILVER',  60,  1,  7,   false),
  ('GOLD',    75,  5,  30,  true),
  ('PLATINUM',85, 15,  90,  true),
  ('DIAMOND', 95, 30, 180,  true)
ON CONFLICT (membership_level) DO NOTHING;

-- ---------- 7. Role-based membership benefits (display data) ----------
CREATE TABLE IF NOT EXISTS membership_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_level text NOT NULL
    CHECK (membership_level IN ('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')),
  role text CHECK (role IN ('CARGO_OWNER','CLEARING_AGENT','TRUCK_OWNER','DRIVER')),
  benefit_name text NOT NULL,
  description text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS membership_benefits_lookup_idx
  ON membership_benefits (membership_level, role, sort_order) WHERE active;

ALTER TABLE membership_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_benefits_select ON membership_benefits FOR SELECT
  USING (active = true);

INSERT INTO membership_benefits (membership_level, role, benefit_name, description, sort_order) VALUES
  -- DRIVERS & TRUCK OWNERS
  ('SILVER','DRIVER','Priority cargo consideration','Your bids rank above Bronze among operationally suitable trips.',10),
  ('SILVER','TRUCK_OWNER','Priority cargo consideration','Your drivers and trucks rank above Bronze in cargo matching.',10),
  ('GOLD','DRIVER','Premium cargo access','Unlock premium and high-value cargo opportunities.',10),
  ('GOLD','TRUCK_OWNER','Premium cargo access','Your fleet is surfaced for premium cargo opportunities.',10),
  ('GOLD','DRIVER','Faster booking consideration','Accepted faster among suitable candidates.',20),
  ('PLATINUM','DRIVER','Reduced service fees','Eligible for reduced platform service charges where commercially viable.',10),
  ('PLATINUM','TRUCK_OWNER','Reduced service fees','Eligible for reduced platform service charges where commercially viable.',10),
  ('PLATINUM','DRIVER','Preferred customer visibility','Featured to cargo owners searching for trusted carriers.',20),
  ('PLATINUM','TRUCK_OWNER','Preferred customer visibility','Your fleet is featured to cargo owners as a preferred partner.',20),
  ('DIAMOND','DRIVER','Elite Circle privileges','Top-tier priority, loyalty multipliers and special recognition.',10),
  ('DIAMOND','TRUCK_OWNER','Elite Circle privileges','Top-tier priority, loyalty multipliers and special recognition.',10),
  -- CLEARING AGENTS
  ('SILVER','CLEARING_AGENT','Higher visibility','Your profile ranks higher for cargo owners choosing an agent.',10),
  ('GOLD','CLEARING_AGENT','Priority truck matching','Rank above lower tiers when matching available trucks.',10),
  ('GOLD','CLEARING_AGENT','Trusted Agent badge','Display a Trusted Agent badge on your profile.',20),
  ('PLATINUM','CLEARING_AGENT','Preferred trucking partners','Access to preferred, highly rated trucking partners.',10),
  ('DIAMOND','CLEARING_AGENT','Elite Circle privileges','Top-tier matching priority and special recognition.',10),
  -- CARGO OWNERS
  ('SILVER','CARGO_OWNER','Priority matching','Your shipment requests rank above Bronze among suitable candidates.',10),
  ('GOLD','CARGO_OWNER','Top-rated carriers','Choose from highly rated drivers and verified truck owners.',10),
  ('GOLD','CARGO_OWNER','Verified delivery history','A verified, shareable delivery record on your profile.',20),
  ('PLATINUM','CARGO_OWNER','Enhanced shipment management','Advanced shipment tooling and faster matching consideration.',10),
  ('PLATINUM','CARGO_OWNER','Dedicated support eligibility','Eligible for a dedicated support channel.',20),
  ('DIAMOND','CARGO_OWNER','Elite Circle privileges','Top-tier matching priority, loyalty multipliers and recognition.',10)
ON CONFLICT DO NOTHING;

-- ---------- 8. Referrals ----------
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','VERIFIED','REJECTED')),
  points_awarded integer NOT NULL DEFAULT 0,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_id, created_at DESC);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_select_own ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid() OR has_admin_permission('ADMIN_VIEW'));
CREATE POLICY referrals_insert_own ON referrals FOR INSERT
  WITH CHECK (referrer_id = auth.uid());

-- ============================================================
-- CORE ENGINE — server-side, idempotent, transactional
-- ============================================================

-- Award / deduct Elite Circle points. Idempotent per (user, txn type, reference).
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_user_id uuid, p_points integer, p_txn_type text,
  p_reference_id text, p_description text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_inserted boolean := false;
BEGIN
  IF p_points = 0 THEN RETURN false; END IF;
  INSERT INTO elite_circle_points (user_id, points, transaction_type, reference_id, description)
  VALUES (p_user_id, p_points, p_txn_type, p_reference_id, p_description)
  ON CONFLICT DO NOTHING;
  v_inserted := FOUND;
  IF v_inserted THEN
    UPDATE user_reputation
      SET loyalty_points = GREATEST(0, loyalty_points + p_points), updated_at = now()
      WHERE user_id = p_user_id;
  END IF;
  RETURN v_inserted;
END $$;

-- Recalculate membership level from configured thresholds.
CREATE OR REPLACE FUNCTION recalc_membership(p_user_id uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE
  r record; v_best text := 'BRONZE';
  v_score int; v_trips int; v_age int; v_verified boolean; v_standing text;
BEGIN
  SELECT trust_score, completed_trips, account_standing,
         EXTRACT(day FROM now() - p.created_at)::int,
         (p.verification_status = 'VERIFIED')
    INTO v_score, v_trips, v_standing, v_age, v_verified
    FROM user_reputation ur JOIN profiles p ON p.id = ur.user_id
    WHERE ur.user_id = p_user_id;
  IF v_score IS NULL THEN RETURN v_best; END IF;

  FOR r IN
    SELECT * FROM reputation_settings
    WHERE active ORDER BY minimum_completed_trips DESC, minimum_score DESC
  LOOP
    IF v_score >= r.minimum_score
       AND v_trips >= r.minimum_completed_trips
       AND v_age >= r.minimum_account_age_days
       AND (NOT r.require_verification OR v_verified)
       AND v_standing NOT IN ('SUSPENDED','TERMINATED') THEN
      v_best := r.membership_level;
      EXIT;
    END IF;
  END LOOP;

  UPDATE user_reputation
    SET membership_level = v_best, updated_at = now()
    WHERE user_id = p_user_id AND membership_level IS DISTINCT FROM v_best;
  RETURN v_best;
END $$;

-- Recompute verified-history statistics from real operational records.
CREATE OR REPLACE FUNCTION recalc_trust_stats(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE
  v_completed int; v_on_time int; v_cancelled int;
  v_paid int; v_failed int; v_disputes int; v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;

  -- Trips where the user is driver, clearing agent, cargo owner or truck owner.
  WITH my_trips AS (
    SELECT ta.id, ta.status, ta.completed_at, cs.expected_pickup_date
    FROM trip_assignments ta
    JOIN cargo_shipments cs ON cs.id = ta.shipment_id
    WHERE ta.driver_id = p_user_id
       OR ta.clearing_agent_id = p_user_id
       OR ta.cargo_owner_id = p_user_id
       OR ta.truck_id IN (SELECT id FROM trucks WHERE owner_id = p_user_id)
  )
  SELECT
    count(*) FILTER (WHERE status = 'COMPLETED'),
    count(*) FILTER (WHERE status = 'COMPLETED' AND completed_at::date <= COALESCE(expected_pickup_date, completed_at::date) + 1),
    count(*) FILTER (WHERE status = 'CANCELLED')
  INTO v_completed, v_on_time, v_cancelled FROM my_trips;

  -- Payment compliance from real transaction outcomes.
  SELECT
    count(*) FILTER (WHERE status IN ('SUCCESS','PAID')),
    count(*) FILTER (WHERE status IN ('FAILED','EXPIRED','ABANDONED'))
  INTO v_paid, v_failed FROM payment_transactions WHERE payer_id = p_user_id;

  -- Customer satisfaction: disputes raised on trips the user took part in.
  SELECT count(*) INTO v_disputes FROM disputes d
  WHERE d.trip_id IN (
    SELECT ta.id FROM trip_assignments ta
    WHERE ta.driver_id = p_user_id OR ta.clearing_agent_id = p_user_id
       OR ta.cargo_owner_id = p_user_id
       OR ta.truck_id IN (SELECT id FROM trucks WHERE owner_id = p_user_id)
  );

  UPDATE user_reputation SET
    completed_trips = v_completed,
    on_time_deliveries = v_on_time,
    cancelled_trips = v_cancelled,
    payment_compliance = CASE WHEN (v_paid + v_failed) = 0 THEN 100
                              ELSE round(100.0 * v_paid / (v_paid + v_failed))::int END,
    customer_satisfaction = CASE WHEN v_completed = 0 THEN 100
                                 ELSE GREATEST(0, 100 - round(100.0 * v_disputes / v_completed))::int END,
    updated_at = now()
  WHERE user_id = p_user_id;

  PERFORM recalc_membership(p_user_id);
END $$;

-- Apply one reputation event. Idempotent: duplicate (user, type, reference) is a no-op.
-- Unverified events are recorded but score-neutral until an administrator verifies them.
CREATE OR REPLACE FUNCTION apply_reputation_event(
  p_user_id uuid, p_event_type text, p_points integer,
  p_reference_id text, p_description text,
  p_verified boolean DEFAULT true, p_actor uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_applied boolean := false; v_delta integer;
BEGIN
  BEGIN
    INSERT INTO reputation_events (user_id, event_type, points_change, reference_id, description, verification_status, created_by)
    VALUES (p_user_id, p_event_type, p_points, p_reference_id, p_description,
            CASE WHEN p_verified THEN 'VERIFIED' ELSE 'PENDING' END, p_actor);
    v_applied := true;
  EXCEPTION WHEN unique_violation THEN
    RETURN false; -- already scored for this incident
  END;

  IF v_applied AND p_verified AND p_points <> 0 THEN
    UPDATE user_reputation
      SET trust_score = GREATEST(0, LEAST(100, trust_score + p_points)), updated_at = now()
      WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_delta = ROW_COUNT;
    IF v_delta > 0 THEN
      INSERT INTO notifications (user_id, event_type, title, body)
      VALUES (p_user_id, 'REPUTATION_CHANGE',
              'Trust score updated',
              p_description || ' (' || CASE WHEN p_points > 0 THEN '+' ELSE '' END || p_points || ' points).');
      PERFORM recalc_membership(p_user_id);
    END IF;
  ELSIF v_applied AND NOT p_verified THEN
    INSERT INTO notifications (user_id, event_type, title, body)
    VALUES (p_user_id, 'REPUTATION_REVIEW', 'Event recorded for review',
            p_description || ' — this is being reviewed before any points change.');
  END IF;
  RETURN v_applied;
END $$;

-- ---------- Initial profile: every user starts at 50/100 ----------
CREATE OR REPLACE FUNCTION create_user_reputation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  INSERT INTO user_reputation (user_id, referral_code)
  VALUES (NEW.id, 'PB' || upper(substr(replace(encode(gen_random_bytes(6),'hex'),'0O1I','AAXB'), 1, 6)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_create_user_reputation ON profiles;
CREATE TRIGGER trg_create_user_reputation AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_reputation();

-- ---------- Trip completion scoring (driver / truck owner / agent / owner) ----------
CREATE OR REPLACE FUNCTION handle_trip_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_owner uuid; v_expected date; v_ref text;
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status IS DISTINCT FROM 'COMPLETED' THEN
    v_ref := 'TRIP:' || NEW.id;
    SELECT owner_id INTO v_owner FROM trucks WHERE id = NEW.truck_id;
    SELECT expected_pickup_date INTO v_expected FROM cargo_shipments WHERE id = NEW.shipment_id;

    IF NEW.driver_id IS NOT NULL THEN
      PERFORM apply_reputation_event(NEW.driver_id, 'TRIP_COMPLETED', 10, v_ref,
        'Trip ' || NEW.trip_ref || ' completed successfully');
      PERFORM award_loyalty_points(NEW.driver_id, 20, 'EARN', 'LOYALTY:' || v_ref,
        'Elite Circle points for completed trip ' || NEW.trip_ref);
      IF v_expected IS NOT NULL AND COALESCE(NEW.completed_at, now())::date <= v_expected + 1 THEN
        PERFORM apply_reputation_event(NEW.driver_id, 'ON_TIME_DELIVERY', 5, 'ONTIME:' || NEW.id,
          'On-time delivery on trip ' || NEW.trip_ref);
        PERFORM award_loyalty_points(NEW.driver_id, 10, 'EARN', 'LOYALTY:ONTIME:' || NEW.id,
          'On-time delivery bonus — trip ' || NEW.trip_ref);
      END IF;
      PERFORM recalc_trust_stats(NEW.driver_id);
    END IF;

    IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM NEW.driver_id THEN
      PERFORM apply_reputation_event(v_owner, 'TRIP_COMPLETED', 10, v_ref,
        'Trip ' || NEW.trip_ref || ' completed successfully');
      PERFORM award_loyalty_points(v_owner, 20, 'EARN', 'LOYALTY:' || v_ref,
        'Elite Circle points for completed trip ' || NEW.trip_ref);
      PERFORM recalc_trust_stats(v_owner);
    END IF;

    IF NEW.clearing_agent_id IS NOT NULL THEN
      PERFORM apply_reputation_event(NEW.clearing_agent_id, 'BOOKING_FULFILLED', 5, v_ref,
        'Confirmed booking fulfilled on trip ' || NEW.trip_ref);
      PERFORM award_loyalty_points(NEW.clearing_agent_id, 20, 'EARN', 'LOYALTY:' || v_ref,
        'Elite Circle points for completed trip ' || NEW.trip_ref);
      PERFORM recalc_trust_stats(NEW.clearing_agent_id);
    END IF;

    IF NEW.cargo_owner_id IS NOT NULL THEN
      PERFORM award_loyalty_points(NEW.cargo_owner_id, 20, 'EARN', 'LOYALTY:' || v_ref,
        'Elite Circle points for completed trip ' || NEW.trip_ref);
      PERFORM recalc_trust_stats(NEW.cargo_owner_id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_trip_status_change ON trip_assignments;
CREATE TRIGGER trg_trip_status_change AFTER UPDATE OF status ON trip_assignments
  FOR EACH ROW EXECUTE FUNCTION handle_trip_status_change();

-- ---------- Cancellations: recorded PENDING, penalised only after verified review ----------
CREATE OR REPLACE FUNCTION handle_cancellation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF NEW.new_status = 'CANCELLED' AND NEW.changed_by IS NOT NULL THEN
    PERFORM apply_reputation_event(
      NEW.changed_by, 'CANCELLATION_REVIEW', -10, 'CANCEL:' || NEW.trip_id,
      'Trip cancellation recorded — pending review of the stated reason', false, NEW.changed_by);
    PERFORM recalc_trust_stats(NEW.changed_by);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cancellation_review ON trip_status_history;
CREATE TRIGGER trg_cancellation_review AFTER INSERT ON trip_status_history
  FOR EACH ROW EXECUTE FUNCTION handle_cancellation();

-- ---------- Payment compliance keeps itself current ----------
CREATE OR REPLACE FUNCTION handle_payment_outcome() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.payer_id IS NOT NULL THEN
    PERFORM recalc_trust_stats(NEW.payer_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_payment_outcome ON payment_transactions;
CREATE TRIGGER trg_payment_outcome AFTER UPDATE OF status ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION handle_payment_outcome();

-- ---------- Referral validation: referrer earns only when the referral is real ----------
CREATE OR REPLACE FUNCTION handle_profile_verification() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE r record;
BEGIN
  IF NEW.verification_status = 'VERIFIED' AND OLD.verification_status IS DISTINCT FROM 'VERIFIED' THEN
    FOR r IN SELECT * FROM referrals WHERE referred_user_id = NEW.id AND status = 'PENDING'
    LOOP
      UPDATE referrals SET status = 'VERIFIED', verified_at = now() WHERE id = r.id;
      PERFORM award_loyalty_points(
        r.referrer_id,
        CASE WHEN NEW.role = 'CARGO_OWNER' THEN 150 ELSE 100 END, 'EARN',
        'LOYALTY:REFERRAL:' || NEW.id::text,
        'Verified referral bonus — ' || COALESCE(NEW.full_name, 'a new verified member'));
      PERFORM recalc_trust_stats(r.referrer_id);
    END LOOP;
    PERFORM recalc_membership(NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_profile_verification ON profiles;
CREATE TRIGGER trg_profile_verification AFTER UPDATE OF verification_status ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_profile_verification();

-- ---------- Public trust profile (safe, limited fields for other users) ----------
CREATE OR REPLACE VIEW trust_profiles_public AS
SELECT
  ur.user_id,
  p.full_name,
  p.role,
  ur.membership_level,
  ur.trust_score,
  ur.completed_trips,
  CASE WHEN (ur.completed_trips + ur.cancelled_trips) = 0 THEN NULL
       ELSE round(100.0 * ur.completed_trips / (ur.completed_trips + ur.cancelled_trips))::int END AS trip_completion_rate,
  CASE WHEN ur.completed_trips = 0 THEN NULL
       ELSE round(100.0 * ur.on_time_deliveries / ur.completed_trips)::int END AS on_time_rate,
  CASE WHEN (ur.completed_trips + ur.cancelled_trips) = 0 THEN NULL
       ELSE round(100.0 * ur.cancelled_trips / (ur.completed_trips + ur.cancelled_trips))::int END AS cancellation_rate,
  ur.payment_compliance,
  ur.customer_satisfaction,
  (p.verification_status = 'VERIFIED') AS is_verified,
  ur.account_standing
FROM user_reputation ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.account_standing <> 'TERMINATED';

GRANT SELECT ON trust_profiles_public TO authenticated;

-- ---------- Backfill: existing users get their profile and stats ----------
INSERT INTO user_reputation (user_id, referral_code)
SELECT p.id, 'PB' || upper(substr(md5(p.id::text || clock_timestamp()::text), 1, 6))
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM user_reputation ur WHERE ur.user_id = p.id);

DO $$
DECLARE u record;
BEGIN
  FOR u IN SELECT user_id FROM user_reputation LOOP
    PERFORM recalc_trust_stats(u.user_id);
  END LOOP;
END $$;

-- Expand the admin permission vocabulary (additive), then grant it to current admins.
ALTER TABLE admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_permission_check;
ALTER TABLE admin_permissions ADD CONSTRAINT admin_permissions_permission_check
  CHECK (permission = ANY (ARRAY[
    'USER_APPROVE','USER_REJECT','USER_SUSPEND','USER_BLOCK','USER_UNBLOCK','DOCUMENT_REVIEW',
    'USER_VIEW','ADMIN_VIEW','SETTINGS_MANAGE','PAYMENT_MANAGE','DISPUTE_MANAGE','VENDOR_VIEW',
    'VENDOR_APPROVE','VENDOR_REJECT','VENDOR_SUSPEND','VENDOR_DOCUMENT_VIEW','REPUTATION_MANAGE'
  ]::text[]));

INSERT INTO admin_permissions (admin_user_id, permission)
SELECT id, 'REPUTATION_MANAGE' FROM profiles WHERE role IN ('ADMIN','SUPER_ADMIN')
AND NOT EXISTS (
  SELECT 1 FROM admin_permissions ap
  WHERE ap.admin_user_id = profiles.id AND ap.permission = 'REPUTATION_MANAGE'
);
