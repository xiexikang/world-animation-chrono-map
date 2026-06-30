USE world_animation;

CREATE TABLE IF NOT EXISTS country (
  code       CHAR(2)     NOT NULL COMMENT '国家代码，如 CN/JP/US',
  name       VARCHAR(64) NOT NULL COMMENT '中文名称',
  sort_order INT         NOT NULL DEFAULT 0 COMMENT '展示排序，越小越靠前',
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO country (code, name, sort_order) VALUES
  ('CN', '中国', 1),
  ('JP', '日本', 2),
  ('US', '美国', 3),
  ('GB', '英国', 4),
  ('CZ', '捷克', 5),
  ('BE', '比利时', 6),
  ('FR', '法国', 7),
  ('IE', '爱尔兰', 8),
  ('FI', '芬兰', 9),
  ('KR', '韩国', 10)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order);
