-- Add Elite Circle loyalty balance to the public trust profile view.
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
  ur.account_standing,
  ur.loyalty_points
FROM user_reputation ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.account_standing <> 'TERMINATED';

GRANT SELECT ON trust_profiles_public TO authenticated;
