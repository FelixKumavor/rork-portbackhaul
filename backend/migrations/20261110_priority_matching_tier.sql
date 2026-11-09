-- Priority matching: membership tier acts as a ranking advantage among
-- operationally suitable candidates only (verified, available, capacity/type
-- filters are unchanged). A tier boost can never create a match that the
-- suitability filters would reject, and never overrides distance entirely.
DROP FUNCTION IF EXISTS public.match_trucks(text, numeric, double precision, double precision, integer);
CREATE OR REPLACE FUNCTION public.match_trucks(p_truck_type text, p_capacity numeric, p_lat double precision DEFAULT NULL::double precision, p_lng double precision DEFAULT NULL::double precision, p_limit integer DEFAULT 10)
 RETURNS TABLE(truck_id uuid, registration_no text, truck_type text, capacity_tons numeric, verification_status text, is_available boolean, distance_km numeric, driver_id uuid, driver_name text, driver_verification text, driver_available boolean, priority_tier text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_approved_role('CLEARING_AGENT');

  RETURN QUERY
  WITH candidates AS (
    SELECT t.id, t.registration_no, t.truck_type, t.capacity_tons,
           t.verification_status, t.is_available,
           CASE WHEN p_lat IS NULL OR t.current_lat IS NULL THEN NULL
                ELSE round((6371 * acos(LEAST(1, GREATEST(-1,
                     cos(radians(p_lat)) * cos(radians(t.current_lat)) * cos(radians(t.current_lng) - radians(p_lng))
                   + sin(radians(p_lat)) * sin(radians(t.current_lat))))))::numeric, 1)
           END AS distance_km,
           d.id AS driver_id, pr.full_name AS driver_name, d.verification_status AS driver_verification, d.is_available AS driver_available,
           COALESCE(
             (SELECT ur.membership_level FROM user_reputation ur
               WHERE ur.user_id = t.owner_id
                 AND ur.account_standing IN ('GOOD','WARNING')),
             (SELECT ur.membership_level FROM user_reputation ur
               WHERE ur.user_id = d.profile_id
                 AND ur.account_standing IN ('GOOD','WARNING'))
           ) AS priority_tier
      FROM public.trucks t
      LEFT JOIN public.drivers d ON d.assigned_truck_id = t.id
      LEFT JOIN public.profiles pr ON pr.id = d.profile_id
     WHERE t.verification_status = 'VERIFIED'
       AND t.is_available = true
       AND t.capacity_tons >= p_capacity
       AND (p_truck_type IS NULL OR t.truck_type = p_truck_type)
       AND (d.id IS NULL OR d.verification_status = 'VERIFIED')
  )
  SELECT c.*, c.priority_tier
    FROM candidates c
   ORDER BY (c.driver_available IS TRUE) DESC NULLS LAST,
            CASE c.priority_tier
              WHEN 'DIAMOND' THEN 5 WHEN 'PLATINUM' THEN 4 WHEN 'GOLD' THEN 3
              WHEN 'SILVER' THEN 2 WHEN 'BRONZE' THEN 1 ELSE 0
            END DESC,
            c.distance_km ASC NULLS LAST,
            c.capacity_tons ASC
   LIMIT COALESCE(p_limit, 10);
END;
$function$;
