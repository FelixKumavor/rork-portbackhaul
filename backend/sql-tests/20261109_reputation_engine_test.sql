-- Self-cleaning verification of the reputation engine. Any failed assertion
-- aborts the run; on success every test row is removed before commit.
DO $$
DECLARE
  v_user uuid;
  v_first boolean;
  v_second boolean;
  v_score int;
  v_level text;
BEGIN
  SELECT ur.user_id INTO v_user
  FROM user_reputation ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE p.role = 'DRIVER' AND p.email = 'demo.driver@demo.portbackhaul.app';
  IF v_user IS NULL THEN RAISE EXCEPTION 'TEST-SETUP: demo driver has no reputation row'; END IF;

  -- 1. Idempotency: same (user, type, reference) applies exactly once.
  v_first  := apply_reputation_event(v_user, 'TEST_EVENT', 10, 'TEST:IDEMPOTENT', 'Engine test event');
  v_second := apply_reputation_event(v_user, 'TEST_EVENT', 10, 'TEST:IDEMPOTENT', 'Engine test event');
  IF NOT v_first  THEN RAISE EXCEPTION 'TEST-1 FAILED: first apply returned false'; END IF;
  IF v_second     THEN RAISE EXCEPTION 'TEST-2 FAILED: duplicate reference applied twice'; END IF;

  SELECT trust_score INTO v_score FROM user_reputation WHERE user_id = v_user;
  IF v_score <> 60 THEN RAISE EXCEPTION 'TEST-3 FAILED: expected 60, got %', v_score; END IF;

  -- 2. Clamping: score can never exceed 100.
  PERFORM apply_reputation_event(v_user, 'TEST_EVENT', 1000, 'TEST:CLAMP', 'Clamp test');
  SELECT trust_score INTO v_score FROM user_reputation WHERE user_id = v_user;
  IF v_score <> 100 THEN RAISE EXCEPTION 'TEST-4 FAILED: expected clamp at 100, got %', v_score; END IF;

  -- 3. Floor: score can never fall below 0.
  PERFORM apply_reputation_event(v_user, 'TEST_EVENT', -500, 'TEST:FLOOR', 'Floor test');
  SELECT trust_score INTO v_score FROM user_reputation WHERE user_id = v_user;
  IF v_score <> 0 THEN RAISE EXCEPTION 'TEST-5 FAILED: expected floor at 0, got %', v_score; END IF;

  -- 4. Membership recalculation follows configured thresholds.
  UPDATE user_reputation SET trust_score = 95 WHERE user_id = v_user; -- trips still 0 → BRONZE
  v_level := recalc_membership(v_user);
  IF v_level <> 'BRONZE' THEN RAISE EXCEPTION 'TEST-6 FAILED: 95 score without trips should stay BRONZE, got %', v_level; END IF;

  UPDATE profiles SET created_at = now() - interval '365 days' WHERE id = v_user;
  UPDATE user_reputation SET trust_score = 95, completed_trips = 31 WHERE user_id = v_user;
  v_level := recalc_membership(v_user);
  IF v_level <> 'DIAMOND' THEN RAISE EXCEPTION 'TEST-7 FAILED: expected DIAMOND at 95/31/365d, got %', v_level; END IF;

  UPDATE user_reputation SET trust_score = 95, completed_trips = 31, account_standing = 'SUSPENDED' WHERE user_id = v_user;
  v_level := recalc_membership(v_user);
  IF v_level <> 'BRONZE' THEN RAISE EXCEPTION 'TEST-8 FAILED: suspended user must not hold level, got %', v_level; END IF;
  UPDATE user_reputation SET account_standing = 'GOOD' WHERE user_id = v_user;
  UPDATE profiles SET created_at = now() - interval '50 days' WHERE id = v_user;

  -- 5. Loyalty ledger idempotency.
  IF NOT award_loyalty_points(v_user, 20, 'EARN', 'LOYALTY:TEST:1', 'Test points') THEN
    RAISE EXCEPTION 'TEST-9 FAILED: loyalty award returned false';
  END IF;
  IF award_loyalty_points(v_user, 20, 'EARN', 'LOYALTY:TEST:1', 'Test points') THEN
    RAISE EXCEPTION 'TEST-10 FAILED: duplicate loyalty reference awarded';
  END IF;

  -- Cleanup: restore the pre-test state exactly.
  DELETE FROM elite_circle_points WHERE user_id = v_user AND reference_id LIKE 'LOYALTY:TEST:%';
  DELETE FROM reputation_events WHERE user_id = v_user AND reference_id LIKE 'TEST:%';
  DELETE FROM notifications WHERE user_id = v_user AND event_type = 'REPUTATION_CHANGE'
    AND body LIKE 'Engine test event%';
  UPDATE user_reputation SET trust_score = 50, completed_trips = 0, membership_level = 'BRONZE'
    WHERE user_id = v_user;
END $$;
