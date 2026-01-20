
-- Identify and remove duplicates in medical_terminology based on 'term' column
-- Keeps the row with the minimum id (or created_at)

DELETE FROM medical_terminology
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (partition BY term ORDER BY id) AS row_num
    FROM medical_terminology
  ) t
  WHERE t.row_num > 1
);
