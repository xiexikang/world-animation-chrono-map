USE world_animation;

CREATE TABLE IF NOT EXISTS theme (
  tmdb_genre_id INT         NOT NULL COMMENT 'TMDB 类型 ID',
  name            VARCHAR(64) NOT NULL COMMENT '中文名称',
  sort_order      INT         NOT NULL DEFAULT 0 COMMENT '展示排序，越小越靠前',
  show_in_tags    TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '1=参与主题标签/筛选，0=仅作类型元数据（如「动画」）',
  created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tmdb_genre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO theme (tmdb_genre_id, name, sort_order, show_in_tags) VALUES
  (16,    '动画',     1, 0),
  (10759, '动作冒险', 2, 1),
  (35,    '喜剧幽默', 3, 1),
  (10765, '科幻奇幻', 4, 1),
  (10751, '家庭合家欢', 5, 1),
  (18,    '剧情思考', 6, 1),
  (9648,  '悬疑推理', 7, 1),
  (10762, '儿童',     8, 1),
  (10764, '爱情',     9, 1),
  (80,    '犯罪',    10, 1),
  (99,    '纪录',    11, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order),
  show_in_tags = VALUES(show_in_tags);
