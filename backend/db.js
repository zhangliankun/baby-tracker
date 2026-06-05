const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'baby-tracker.db');

let db = null;

/**
 * 获取数据库实例（同步，首次调用时初始化）
 */
function getDb() {
  if (db) return db;

  db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables(db);

  console.log('[DB] SQLite 数据库初始化完成，WAL 模式已开启');
  return db;
}

function createTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS babies (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sleep_timer (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_family_id ON records(family_id);
    CREATE INDEX IF NOT EXISTS idx_records_family_timestamp ON records(family_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_records_family_type ON records(family_id, type);
    CREATE INDEX IF NOT EXISTS idx_sleep_timer_family ON sleep_timer(family_id);
  `);

  console.log('[DB] 数据表创建/确认完成');
}

/**
 * 执行查询并返回所有结果
 */
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * 执行查询并返回单条记录
 */
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * 执行写操作
 */
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

module.exports = { getDb, queryAll, queryOne, run };
