/**
 * 格式化分钟数为"X小时Y分钟"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/**
 * 格式化已过时间（用于实时计时显示）
 */
export function formatElapsed(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}分钟`;
  return `${h}小时${m}分钟`;
}

/**
 * 格式化时间范围为 "HH:mm-HH:mm"
 */
export function formatTimeRange(startTs, endTs) {
  const fmt = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  return `${fmt(startTs)}-${fmt(endTs)}`;
}

/**
 * 获取喂养类型标签
 */
export function getFeedingTypeLabel(type) {
  const map = { formula: '配方奶', breast: '母乳', bottle_breast: '瓶喂母乳' };
  return map[type] || type;
}

/**
 * 获取喂养记录摘要
 */
export function getFeedingSummary(data) {
  const typeLabel = getFeedingTypeLabel(data.feedingType);
  let summary = `${typeLabel} ${data.amountMl}ml`;
  if (data.startTime && data.endTime) {
    const durationMin = Math.round((data.endTime - data.startTime) / 60000);
    summary += `（${formatDuration(durationMin)}）`;
  }
  return summary;
}

/**
 * 获取喂养记录副标题（时间范围）
 */
export function getFeedingSubtitle(data) {
  if (data.startTime && data.endTime) {
    return formatTimeRange(data.startTime, data.endTime);
  }
  return '';
}

/**
 * 获取睡眠记录摘要
 */
export function getSleepSummary(data) {
  if (data.durationMinutes) {
    return `睡了 ${formatDuration(data.durationMinutes)}`;
  }
  if (data.startTime && !data.endTime) {
    const elapsed = Date.now() - data.startTime;
    return `宝宝睡觉中... ${formatElapsed(elapsed)}`;
  }
  return '睡了 —';
}

/**
 * 获取睡眠记录副标题（时间范围）
 */
export function getSleepSubtitle(data) {
  if (data.startTime && data.endTime) {
    return formatTimeRange(data.startTime, data.endTime);
  }
  if (data.startTime) {
    return `开始 ${formatTime(new Date(data.startTime))}`;
  }
  return '';
}

/**
 * 格式化毫秒时间戳为 HH:mm
 */
export function formatTime(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 睡眠是否正在计时
 */
export function isSleepRunning(data) {
  return data && data.startTime && !data.endTime && !data.durationMinutes;
}

/**
 * 获取尿布记录摘要
 */
export function getDiaperSummary(data) {
  const parts = [];
  if (data.pee) parts.push('嘘嘘');
  if (data.poop) parts.push('臭臭');
  if (data.poopColor) {
    const colorMap = { yellow: '黄色', 'yellow-green': '黄绿色', 'dark-green': '墨绿色',
      'green-brown': '绿褐色', 'pale-yellow': '淡黄色', 'dark-brown': '暗褐色' };
    parts.push(colorMap[data.poopColor] || data.poopColor);
  }
  if (data.poopShape) {
    const shapeMap = { paste: '糊状', 'dry-thick': '干稠', cream: '膏状',
      'milk-curd': '奶瓣', watery: '稀水样', foamy: '泡沫状' };
    parts.push(shapeMap[data.poopShape] || data.poopShape);
  }
  if (data.redButt) parts.push('红屁屁');
  return parts.filter(Boolean).join(' · ') || '无详情';
}

/**
 * 获取补剂记录摘要（支持新旧格式）
 */
export function getSupplementSummary(data) {
  if (data.supplements && Array.isArray(data.supplements)) {
    const names = data.supplements.map(s => `${s.name} ${s.dose}`);
    if (names.length === 1) return names[0];
    return `${data.supplements[0].name}+${data.supplements[1]?.name || ''} 等${names.length}种`;
  }
  if (data.name) return `${data.name} ${data.dose || ''}`;
  return '补剂';
}

/**
 * 获取辅食记录摘要
 */
export function getSolidFoodSummary(data) {
  let summary = `${data.foodName} ${data.amountG}g`;
  if (data.startTime && data.endTime) {
    const durationMin = Math.round((data.endTime - data.startTime) / 60000);
    summary += `（${formatDuration(durationMin)}）`;
  }
  if (data.allergy && data.allergy.foods && data.allergy.foods.length > 0) {
    const parts = data.allergy.foods.slice(0, 2);
    const extra = data.allergy.symptoms && data.allergy.symptoms.length > 0
      ? '·' + data.allergy.symptoms.join('·') : '';
    summary += ` ⚠️ ${parts.join('·')}${extra}`;
  }
  return summary;
}

/**
 * 获取辅食记录副标题
 */
export function getSolidFoodSubtitle(data) {
  if (data.startTime && data.endTime) {
    return formatTimeRange(data.startTime, data.endTime);
  }
  return '';
}

/**
 * 根据记录类型获取内容摘要
 */
export function getRecordSummary(type, data) {
  switch (type) {
    case 'feeding': return getFeedingSummary(data);
    case 'sleep': return getSleepSummary(data);
    case 'diaper': return getDiaperSummary(data);
    case 'supplement': return getSupplementSummary(data);
    case 'solid-food': return getSolidFoodSummary(data);
    default: return '';
  }
}

/**
 * 获取记录副标题
 */
export function getRecordSubtitle(type, data) {
  switch (type) {
    case 'feeding': return getFeedingSubtitle(data);
    case 'sleep': return getSleepSubtitle(data);
    case 'solid-food': return getSolidFoodSubtitle(data);
    default: return '';
  }
}

/**
 * 格式化小时数（保留一位小数）
 */
export function formatHours(totalMinutes) {
  return (Math.round(totalMinutes / 6) / 10).toFixed(1);
}
