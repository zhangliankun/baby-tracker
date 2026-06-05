# API 接口规范 — 婴儿喂养记录与统计分析 App

## 通用约定

- **Base URL**：`/api`
- **Content-Type**：`application/json`
- **认证**：除 `/auth/register` 和 `/auth/login` 外，所有接口需携带 `Authorization: Bearer <JWT>` 请求头
- **响应格式**：
  ```json
  // 成功
  { "success": true, "data": <任意JSON类型> }

  // 失败
  { "success": false, "error": "错误信息字符串" }
  ```
- **HTTP 状态码**：成功 200/201，客户端错误 400/401/404，服务器错误 500

---

## 接口列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册（创建/加入家庭） | ✗ |
| POST | /api/auth/login | 登录 | ✗ |
| GET | /api/baby | 获取婴儿档案 | ✓ |
| PUT | /api/baby | 更新婴儿档案 | ✓ |
| GET | /api/records | 获取记录（按日期/范围） | ✓ |
| POST | /api/records | 添加记录 | ✓ |
| PUT | /api/records/:id | 更新记录 | ✓ |
| DELETE | /api/records/:id | 删除记录 | ✓ |
| DELETE | /api/records/all | 清空所有记录 | ✓ |
| GET | /api/statistics | 统计数据（周/月+角色） | ✓ |
| GET | /api/export | 导出所有记录 | ✓ |
| POST | /api/sleep-timer/start | 开始睡眠计时 | ✓ |
| POST | /api/sleep-timer/stop | 停止睡眠计时 | ✓ |
| GET | /api/sleep-timer/status | 查询计时器状态 | ✓ |
| GET | /api/health | 健康检查 | ✗ |

---

### 1.1 注册

```
POST /api/auth/register
Content-Type: application/json

// 创建家庭
{
  "username": "mama",
  "password": "123456",
  "role": "妈妈",
  "familyName": "幸福小家"
}

// 加入家庭
{
  "username": "baba",
  "password": "123456",
  "role": "爸爸",
  "inviteCode": "A1B2C3"
}
```

**验证规则**：
- username: 必填，2-20 字符，唯一
- password: 必填，6-50 字符
- role: 必填，必须是 `["爸爸","妈妈","奶奶","爷爷","外婆","其他"]` 之一
- familyName: 创建模式必填，1-30 字符
- inviteCode: 加入模式必填，6 字符，须与已有家庭一致

**成功响应 (201)**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "mama",
      "role": "妈妈",
      "familyId": "uuid"
    },
    "baby": {
      "id": "uuid",
      "nickname": "我的宝宝",
      "birthDate": "2026-06-04"
    },
    "inviteCode": "A1B2C3"
  }
}
```

**错误响应**：
- 400: `"用户名已存在"`
- 400: `"邀请码无效"`
- 400: `"参数缺失或格式错误"`

### 1.2 登录

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "mama",
  "password": "123456"
}
```

**成功响应 (200)**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "mama",
      "role": "妈妈",
      "familyId": "uuid"
    },
    "baby": {
      "id": "uuid",
      "nickname": "宝宝的昵称",
      "birthDate": "2026-01-15"
    },
    "inviteCode": "A1B2C3"
  }
}
```

**错误响应**：
- 400: `"用户名或密码错误"`

---

## 2. 婴儿档案 `/api/baby`

### 2.1 获取婴儿档案

```
GET /api/baby
Authorization: Bearer <token>
```

**成功响应 (200)**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nickname": "小汤圆",
    "birthDate": "2026-01-15"
  }
}
```

### 2.2 更新婴儿档案

```
PUT /api/baby
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "小汤圆",
  "birthDate": "2026-01-15"
}
```

**验证规则**：
- nickname: 必填，1-20 字符
- birthDate: 必填，格式 `YYYY-MM-DD`，不能是未来日期

**成功响应 (200)**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nickname": "小汤圆",
    "birthDate": "2026-01-15"
  }
}
```

---

## 3. 记录 CRUD `/api/records`

### 3.1 获取记录列表

```
GET /api/records?date=2026-06-04          # 单日查询
GET /api/records?startDate=2026-06-01&endDate=2026-06-07  # 范围查询
Authorization: Bearer <token>
```

**查询参数**：
- `date` 或 `startDate`+`endDate`，二选一
- 日期格式：`YYYY-MM-DD`

**成功响应 (200)**：
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userRole": "妈妈",
      "type": "feeding",
      "timestamp": 1717488000000,
      "data": {
        "feedingType": "formula",
        "amountMl": 160
      },
      "createdAt": 1717488000000
    }
  ]
}
```

按 `timestamp` 倒序排列。

### 3.2 添加记录

```
POST /api/records
Authorization: Bearer <token>
Content-Type: application/json

// 喂养（含可选的开始/结束时间）
{
  "type": "feeding",
  "timestamp": 1717488000000,
  "data": {
    "feedingType": "formula",
    "amountMl": 160,
    "startTime": 1717488000000,
    "endTime": 1717489200000
  }
}

// 睡眠（含可选备注）
{
  "type": "sleep",
  "timestamp": 1717488000000,
  "data": {
    "startTime": 1717488000000,
    "endTime": 1717495200000,
    "durationMinutes": 120,
    "remark": "宝宝睡得安稳"
  }
}

// 尿布
{
  "type": "diaper",
  "timestamp": 1717488000000,
  "data": {
    "pee": true,
    "poop": true,
    "poopColor": "yellow",
    "poopShape": "paste",
    "redButt": false
  }
}

// 补剂（新格式：支持多种补剂）
{
  "type": "supplement",
  "timestamp": 1717488000000,
  "data": {
    "supplements": [
      { "name": "维生素D3", "dose": "1粒" },
      { "name": "益生菌", "dose": "2滴" }
    ],
    "remark": "晚饭后服用"
  }
}

// 补剂（旧格式兼容，仍支持）
{
  "type": "supplement",
  "timestamp": 1717488000000,
  "data": {
    "name": "维生素D3",
    "dose": "1粒"
  }
}
```

// 辅食（可选过敏信息）
{
  "type": "solid-food",
  "timestamp": 1717488000000,
  "data": {
    "foodName": "米粉",
    "amountG": 15,
    "startTime": 1717488000000,
    "endTime": 1717489200000,
    "remark": "第一次尝试",
    "allergy": {
      "foods": ["蛋黄"],
      "symptoms": ["皮疹"],
      "note": "吃完半小时后脸上起了小红点"
    }
  }
}
```

**验证规则**：
- type: 必填，`feeding | sleep | diaper | supplement | solid-food`
- timestamp: 必填，正整数（毫秒时间戳）
- data: 必填，JSON 对象，结构根据 type 不同

**各类型 data 验证**：
- feeding: feedingType ∈ {formula, breast, bottle_breast}, amountMl > 0；startTime 和 endTime 可选，startTime < endTime
- sleep: startTime 必填，endTime 可选（计时中），若有 endTime 则 startTime < endTime；remark 可选
- diaper: pee 和 poop 不能同时为 false；若 poop=true，须提供 poopColor 和 poopShape
- supplement: 新格式 supplements 数组（至少一项，每项 name+ dose 必填）或旧格式 {name, dose} 兼容；remark 可选
- solid-food: foodName 必填，amountG > 0 必填；startTime/endTime 可选；allergy 对象可选（foods 数组 + symptoms 数组 + note 字符串）

**成功响应 (201)**：
```json
{
  "success": true,
  "data": { ...完整记录对象... }
}
```

### 3.3 更新记录

```
PUT /api/records/:id
Authorization: Bearer <token>
Content-Type: application/json

// body 同 POST
```

**权限**：只能更新自己家庭（family_id 匹配）的记录

**成功响应 (200)**：
```json
{
  "success": true,
  "data": { ...更新后的记录对象... }
}
```

**错误响应**：
- 404: `"记录不存在"`
- 403: `"无权修改此记录"`

### 3.4 删除记录

```
DELETE /api/records/:id
Authorization: Bearer <token>
```

**权限**：只能删除自己家庭（family_id 匹配）的记录

**成功响应 (200)**：
```json
{
  "success": true,
  "data": null
}
```

### 3.5 清空所有记录

```
DELETE /api/records/all
Authorization: Bearer <token>
Content-Type: application/json

{
  "confirm": true
}
```

**验证**：必须显式传 `confirm: true`

**成功响应 (200)**：
```json
{
  "success": true,
  "data": { "deletedCount": 128 }
}
```

---

## 4. 睡眠计时器 `/api/sleep-timer`

### 4.1 开始计时

```
POST /api/sleep-timer/start
Authorization: Bearer <token>
```

如果当前家庭已有 running 计时器，先自动停止旧的再创建新的。

**成功响应 (201)**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startTime": 1717488000000,
    "status": "running"
  }
}
```

### 4.2 停止计时

```
POST /api/sleep-timer/stop
Authorization: Bearer <token>
```

**成功响应 (200)**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startTime": 1717488000000,
    "endTime": 1717495200000,
    "durationMinutes": 120,
    "status": "stopped"
  }
}
```

**错误响应**：
- 404: `"没有正在进行的计时器"`

### 4.3 查询计时器状态

```
GET /api/sleep-timer/status
Authorization: Bearer <token>
```

**成功响应 (200)**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startTime": 1717488000000,
    "status": "running",
    "elapsedMinutes": 45
  }
}
```

如果没有 running 计时器，data 为 `null`。

---

## 5. 统计分析 `/api/statistics`

### 5.1 获取统计数据

```
GET /api/statistics?period=week&date=2026-06-04&roleFilter=all
GET /api/statistics?period=month&date=2026-06-04&roleFilter=妈妈
Authorization: Bearer <token>
```

**查询参数**：
- period: `week | month`
- date: `YYYY-MM-DD`（周期包含该日期的周/月）
- roleFilter: `all | 爸爸 | 妈妈 | 奶奶 | ...`

**成功响应 (200)**：
```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2026-06-01",
    "endDate": "2026-06-07",
    "feeding": {
      "totalMl": 4200,
      "avgDailyMl": 600,
      "byType": {
        "formula": 2400,
        "breast": 1200,
        "bottle_breast": 600
      },
      "dailyBreakdown": [
        { "date": "2026-06-01", "formula": 300, "breast": 200, "bottle_breast": 100 }
      ]
    },
    "sleep": {
      "totalMinutes": 4200,
      "avgDailyMinutes": 600,
      "totalHours": 70.0,
      "avgDailyHours": 10.0,
      "dailyBreakdown": [
        { "date": "2026-06-01", "minutes": 580 }
      ]
    },
    "diaper": {
      "totalCount": 42,
      "peeCount": 42,
      "poopCount": 18,
      "poopColorDistribution": {
        "yellow": 10,
        "yellow-green": 5,
        "dark-green": 3
      },
      "poopShapeDistribution": {
        "paste": 12,
        "cream": 4,
        "loose": 2
      },
      "redButtCount": 2
    },
    "supplement": {
      "totalCount": 7,
      "byName": {
        "维生素D3": 7,
        "益生菌": 3
      }
    }
  }
}
```

---

## 6. 数据导出 `/api/export`

### 6.1 导出所有记录

```
GET /api/export
Authorization: Bearer <token>
```

**成功响应 (200)**：
```json
{
  "success": true,
  "data": [
    { "id": "...", "type": "feeding", "timestamp": 1717488000000, "data": {...}, "userRole": "妈妈" }
  ]
}
```

返回当前家庭所有记录的完整 JSON 数组。

---

## 错误码汇总

| HTTP 状态 | 场景 |
|-----------|------|
| 200 | 成功操作 |
| 201 | 成功创建 |
| 400 | 参数缺失/格式错误/业务逻辑错误 |
| 401 | 未认证 / Token 无效或过期 |
| 403 | 无权限操作该资源 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

## 认证头格式

所有受保护 API 需在请求头中携带：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

JWT Payload：
```json
{
  "userId": "uuid",
  "familyId": "uuid",
  "role": "妈妈",
  "iat": 1717488000
}
```
