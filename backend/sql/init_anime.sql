CREATE DATABASE IF NOT EXISTS world_animation
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE world_animation;

CREATE TABLE IF NOT EXISTS anime (
  tmdb_id            BIGINT       NOT NULL COMMENT 'TMDB TV 条目 ID',
  country_code       CHAR(2)      NOT NULL COMMENT '数据来源国家代码，如 CN/JP/US',
  adult              TINYINT(1)   NOT NULL DEFAULT 0,
  backdrop_path      VARCHAR(255) NULL,
  poster_path        VARCHAR(255) NULL,
  full_poster_path   VARCHAR(512) NOT NULL DEFAULT '',
  original_language  VARCHAR(16)  NOT NULL DEFAULT '',
  original_name      VARCHAR(512) NOT NULL DEFAULT '',
  name               VARCHAR(512) NOT NULL DEFAULT '',
  overview           TEXT         NULL,
  popularity         DECIMAL(12, 4) NOT NULL DEFAULT 0,
  first_air_date     DATE         NULL,
  softcore           TINYINT(1)   NOT NULL DEFAULT 0,
  vote_average       DECIMAL(5, 2) NOT NULL DEFAULT 0,
  vote_count         INT          NOT NULL DEFAULT 0,
  genre_ids          JSON         NOT NULL COMMENT 'TMDB 类型 ID 数组',
  origin_country     JSON         NOT NULL COMMENT '原产国/地区代码数组',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tmdb_id, country_code),
  KEY idx_country_code (country_code),
  KEY idx_first_air_date (first_air_date),
  KEY idx_popularity (popularity),
  KEY idx_vote_average (vote_average)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
