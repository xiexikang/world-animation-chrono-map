-- 按 tmdb_id 去重：每个 tmdb_id 只保留 1 条
-- 保留规则：popularity 高 > vote_count 高 > updated_at 新
-- 执行前请先备份： mysqldump -u root -p world_animation anime > anime_backup.sql

USE world_animation;

-- 预览：将被删除的记录
SELECT a.tmdb_id, a.country_code, a.name, a.popularity, a.vote_count, a.updated_at
FROM anime a
INNER JOIN (
  SELECT
    tmdb_id,
    country_code,
    ROW_NUMBER() OVER (
      PARTITION BY tmdb_id
      ORDER BY popularity DESC, vote_count DESC, updated_at DESC
    ) AS rn
  FROM anime
) ranked ON a.tmdb_id = ranked.tmdb_id AND a.country_code = ranked.country_code
WHERE ranked.rn > 1
ORDER BY a.tmdb_id, a.country_code;

-- 确认无误后再执行删除（取消下面注释）
/*
DELETE a
FROM anime a
INNER JOIN (
  SELECT
    tmdb_id,
    country_code,
    ROW_NUMBER() OVER (
      PARTITION BY tmdb_id
      ORDER BY popularity DESC, vote_count DESC, updated_at DESC
    ) AS rn
  FROM anime
) ranked ON a.tmdb_id = ranked.tmdb_id AND a.country_code = ranked.country_code
WHERE ranked.rn > 1;
*/

-- 去重后再次检查（应为空）
-- SELECT tmdb_id, COUNT(*) AS cnt FROM anime GROUP BY tmdb_id HAVING COUNT(*) > 1;
