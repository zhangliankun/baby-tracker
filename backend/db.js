const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'baby-tracker.db');

let db = null;
let saveTimer = null;

/**
 * 获取数据库实例（异步，首次调用时初始化）
 */
async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // 尝试从磁盘加载已有数据库
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('[DB] 从磁盘加载已有数据库');
  } else {
    db = new SQL.Database();
    console.log('[DB] 创建新数据库');
  }

  // 开启 WAL 模式需要文件系统支持，sql.js 使用内存DB
  // 但我们可以执行 pragma 优化
  db.run('PRAGMA foreign_keys = ON');

  // 自动建表
  createTables(db);

  console.log('[DB] SQLite 数据库初始化完成');

  return db;
}

function createTables(database) {
  database.run(`
    -- 家庭表
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  database.run(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    -- 婴儿档案表
    CREATE TABLE IF NOT EXISTS babies (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    -- 记录表
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
    )
  `);

  database.run(`
    -- 睡眠计时器表
    CREATE TABLE IF NOT EXISTS sleep_timer (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(family_id) REFERENCES families(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 索引
  database.run('CREATE INDEX IF NOT EXISTS idx_records_family_id ON records(family_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_records_family_timestamp ON records(family_id, timestamp)');
  database.run('CREATE INDEX IF NOT EXISTS idx_records_family_type ON records(family_id, type)');
  database.run('CREATE INDEX IF NOT EXISTS idx_sleep_timer_family ON sleep_timer(family_id)');

  // 首次建表后立即保存
  scheduleSave();
}

/**
 * 将内存数据库保存到磁盘文件（防抖，1秒内多次调用只执行一次）
 */
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    }
  }, 1000);
}

/**
 * 立即保存数据库到磁盘
 */
function saveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * sql.js 查询辅助：执行 SELECT 并返回结果数组
 * 每条记录的字段自动从列名映射
 */
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * sql.js 查询辅助：执行 SELECT 并返回单条记录，无结果返回 undefined
 */
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : undefined;
}

/**
 * sql.js 写操作辅助：执行 INSERT/UPDATE/DELETE 并自动触发保存
 */
function run(sql, params = []) {
  db.run(sql, params);
  scheduleSave();
}

module.exports = { getDb, queryAll, queryOne, run, saveNow };
