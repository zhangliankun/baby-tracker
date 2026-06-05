/**
 * 用户角色列表
 */
export const ROLES = ['爸爸', '妈妈', '奶奶', '爷爷', '外婆', '其他'];

/**
 * 记录类型
 */
export const RECORD_TYPES = {
  feeding: { label: '喂养', icon: 'Milk', color: '#FF9A8B' },
  sleep: { label: '睡眠', icon: 'Moon', color: '#7B8CDE' },
  diaper: { label: '尿布', icon: 'StickyNote', color: '#FFB347' },
  supplement: { label: '补剂', icon: 'Pill', color: '#4ECDC4' },
  'solid-food': { label: '辅食', icon: 'Apple', color: '#FF8C42' },
};

/**
 * 喂养类型
 */
export const FEEDING_TYPES = [
  { value: 'formula', label: '配方奶' },
  { value: 'breast', label: '母乳' },
  { value: 'bottle_breast', label: '瓶喂母乳' },
];

/**
 * 奶量预设按钮
 */
export const AMOUNT_PRESETS = [100, 130, 150, 160, 180];

/**
 * 臭臭颜色
 */
export const POOP_COLORS = [
  { value: 'yellow', label: '黄色', color: '#F0C040' },
  { value: 'yellow-green', label: '黄绿色', color: '#A0C040' },
  { value: 'dark-green', label: '墨绿色', color: '#2E6B3E' },
  { value: 'green-brown', label: '绿褐色', color: '#6B5E2E' },
  { value: 'pale-yellow', label: '淡黄色', color: '#F5E6A0' },
  { value: 'dark-brown', label: '暗褐色', color: '#5C3A1E' },
];

/**
 * 臭臭形状
 */
export const POOP_SHAPES = [
  { value: 'paste', label: '糊状' },
  { value: 'dry-thick', label: '干稠' },
  { value: 'cream', label: '膏状' },
  { value: 'milk-curd', label: '奶瓣' },
  { value: 'watery', label: '稀水样' },
  { value: 'foamy', label: '泡沫状' },
];

/**
 * 默认补剂
 */
export const DEFAULT_SUPPLEMENT = { name: '维生素D3', dose: '1粒' };

/**
 * Toast 自动消失时间（毫秒）
 */
export const TOAST_DURATION = 3000;

/**
 * 统计周期
 */
export const STATS_PERIODS = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
];

/**
 * 辅食种类预设
 */
export const FOOD_NAMES = [
  '米粉', '果泥', '菜泥', '肉泥', '蛋黄', '面条', '粥',
  '水果', '蔬菜', '鱼泥', '肝泥', '酸奶', '溶豆', '磨牙棒',
];

/**
 * 辅食份量预设（g）
 */
export const AMOUNT_G_PRESETS = [5, 10, 15, 20, 30, 50];

/**
 * 预设过敏食物（18种）
 */
export const ALLERGY_FOODS = [
  '牛奶', '酸奶', '奶酪', '蛋黄', '鸡蛋', '虾', '贝柱', '鳕鱼',
  '三文鱼', '龙利鱼', '银鱼', '鲈鱼', '豆腐', '腐竹', '芝麻',
  '核桃', '板栗', '面粉',
];

/**
 * 预设过敏症状（可多选）
 */
export const ALLERGY_SYMPTOMS = ['皮疹', '呕吐', '腹泻'];
