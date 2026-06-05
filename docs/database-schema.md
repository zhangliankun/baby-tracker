# 数据库表结构 — 婴儿喂养记录与统计分析 App

## 数据库信息

- **数据库系统**：SQLite 3
- **文件路径**：`backend/baby-tracker.db`
- **模式**：WAL（Write-Ahead Logging）
- **外键**：开启（`PRAGMA foreign_keys = ON;`）

## 表结构

### 1. families（家庭表）

```sql
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,            -- UUID v4
  name TEXT NOT NULL,             -- 家庭名称（1-30字符）
  invite_code TEXT NOT NULL UNIQUE, -- 6位邀请码（排除0/O/1/I/l）
  created_at INTEGER NOT NULL     -- 创建时间（毫秒时间戳）
);
```

### 2. users（用户表）

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,            -- UUID v4
  family_id TEXT NOT NULL,        -- 所属家庭ID
  username TEXT NOT NULL UNIQUE,  -- 用户名（2-20字符）
  password TEXT NOT NULL,         -- bcrypt 哈希密文
  role TEXT NOT NULL,             -- 角色：爸爸/妈妈/奶奶/爷爷/外婆/其他
  created_at INTEGER NOT NULL,    -- 创建时间（毫秒时间戳）
  FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

### 3. babies（婴儿档案表）

```sql
CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY,            -- UUID v4
  family_id TEXT NOT NULL UNIQUE, -- 所属家庭ID（一对一）
  nickname TEXT NOT NULL,         -- 昵称（1-20字符）
  birth_date TEXT NOT NULL,       -- 出生日期（YYYY-MM-DD）
  FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

### 4. records（记录表）

```sql
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,            -- UUID v4
  family_id TEXT NOT NULL,        -- 所属家庭ID
  user_id TEXT NOT NULL,          -- 添加人用户ID
  user_role TEXT NOT NULL,        -- 添加人角色（冗余，方便查询）
  type TEXT NOT NULL,             -- 类型：feeding/sleep/diaper/supplement
  timestamp INTEGER NOT NULL,     -- 事件发生时间（毫秒时间戳）
  data_json TEXT NOT NULL,        -- 记录数据（JSON字符串）
  created_at INTEGER NOT NULL,    -- 创建时间（毫秒时间戳）
  FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_records_family_id ON records(family_id);
CREATE INDEX IF NOT EXISTS idx_records_family_timestamp ON records(family_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_records_family_type ON records(family_id, type);
```

### 5. sleep_timer（睡眠计时器表）

```sql
CREATE TABLE IF NOT EXISTS sleep_timer (
  id TEXT PRIMARY KEY,            -- UUID v4
  family_id TEXT NOT NULL,        -- 所属家庭ID
  user_id TEXT NOT NULL,          -- 启动计时器的用户ID
  start_time INTEGER NOT NULL,    -- 开始时间（毫秒时间戳）
  status TEXT NOT NULL DEFAULT 'running', -- running / stopped
  created_at INTEGER NOT NULL,    -- 创建时间（毫秒时间戳）
  FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## data_json 字段结构（JSON 格式）

### feeding（喂养）

```json
{
  "feedingType": "formula",     // "formula" | "breast" | "bottle_breast"
  "amountMl": 160               // 正整数，单位 ml
}
```

### sleep（睡眠）

```json
{
  "startTime": 1717488000000,   // 开始时间（毫秒时间戳）
  "endTime": 1717495200000,     // 结束时间（毫秒时间戳）
  "durationMinutes": 120        // 时长（分钟）
}
```

### diaper（尿布）

```json
{
  "pee": true,                  // 是否有嘘嘘
  "poop": true,                 // 是否有臭臭
  "poopColor": "yellow",       // 颜色（仅 poo=true 时有意义）
                                // 可选值：yellow, yellow-green, dark-green,
                                //        green-brown, pale-yellow, dark-brown
  "poopShape": "paste",        // 形状（仅 poo=true 时有意义）
                                // 可选值：paste, dry-thick, cream,
                                //        milk-curd, watery, foamy
  "redButt": false             // 是否有红屁屁
}
```

### supplement（营养补剂）

```json
{
  "name": "维生素D3",           // 补剂名称
  "dose": "1粒"                // 剂量
}
```

## 枚举值汇总

### 用户角色
```
爸爸 | 妈妈 | 奶奶 | 爷爷 | 外婆 | 其他
```

### 记录类型
```
feeding | sleep | diaper | supplement
```

### 喂养类型
```
formula（配方奶）| breast（母乳）| bottle_breast（瓶喂母乳）
```

### 臭臭颜色（6种）
```
yellow（黄色）| yellow-green（黄绿色）| dark-green（墨绿色）
| green-brown（绿褐色）| pale-yellow（淡黄色）| dark-brown（暗褐色）
```

### 臭臭形状（6种）
```
paste（糊状）| dry-thick（干稠）| cream（膏状）
| milk-curd（奶瓣）| watery（稀水样）| foamy（泡沫状）
```

## 级联删除行为

| 父表 | 从表 | 行为 |
|------|------|------|
| families.id → | users.family_id | ON DELETE CASCADE |
| families.id → | babies.family_id | ON DELETE CASCADE |
| families.id → | records.family_id | ON DELETE CASCADE |
| families.id → | sleep_timer.family_id | ON DELETE CASCADE |
| users.id → | records.user_id | ON DELETE CASCADE |
| users.id → | sleep_timer.user_id | ON DELETE CASCADE |

即：删除家庭 → 所有关联数据级联删除；删除用户 → 该用户的记录和计时器级联删除。

## 初始化数据

注册时：
- 创建家庭 → INSERT families（自动生成 invite_code）
- 创建用户 → INSERT users（bcrypt 哈希密码）
- 创建婴儿 → INSERT babies（nickname="我的宝宝", birth_date=当天日期）
