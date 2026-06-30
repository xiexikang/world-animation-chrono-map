-- 检查 tmdb_id 是否重复
USE world_animation;

-- 1. 重复的 tmdb_id 及条数
SELECT tmdb_id, COUNT(*) AS cnt
FROM anime
GROUP BY tmdb_id
HAVING COUNT(*) > 1
ORDER BY cnt DESC, tmdb_id;

-- 2. 重复记录明细
SELECT a.*
FROM anime a
INNER JOIN (
  SELECT tmdb_id
  FROM anime
  GROUP BY tmdb_id
  HAVING COUNT(*) > 1
) d ON a.tmdb_id = d.tmdb_id
ORDER BY a.tmdb_id, a.country_code;

-- 3. 概况
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT tmdb_id) AS distinct_tmdb_id,
  COUNT(*) - COUNT(DISTINCT tmdb_id) AS duplicate_extra_rows
FROM anime;
