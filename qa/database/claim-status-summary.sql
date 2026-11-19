SELECT status, count(*) AS claim_count
FROM claims
GROUP BY status
ORDER BY status;
