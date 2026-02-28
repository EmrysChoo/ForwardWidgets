WidgetMetadata = {
  id: "forward.multi.subtitle",
  title: "多源字幕（迅雷/SubHD/射手/动漫）",
  icon: "https://assets.vvebo.vip/scripts/icon.png", // 可替换为自定义图标
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "自动从多源API加载简体中文字幕，支持电影/剧集",
  author: "豆包",
  site: "https://github.com/xxx/forward-multi-sub",
  modules: [
    {
      // 官方固定ID：loadSubtitle（必须与示例一致）
      id: "loadSubtitle",
      title: "加载多源字幕",
      functionName: "loadSubtitle", // 函数名与ID保持一致（官方示例规范）
      type: "subtitle", // 固定为subtitle类型
      params: [], // 无自定义参数，仅使用默认入参
    },
  ],
};

/**
 * 加载多源字幕（严格遵循官方示例：入参使用+返回格式）
 * @param {Object} params - Forward 自动传入的默认参数
 * @returns {Array} 符合官方规范的字幕列表
 */
async function loadSubtitle(params) {
  // 1. 解构官方默认入参（完全对齐示例）
  const { tmdbId, imdbId, id, type, seriesName, episodeName, season, episode, link } = params;

  // 2. 核心搜索关键词：优先使用剧集名/集名/链接，兜底用ID
  let searchTitle = "";
  if (type === "tv" && seriesName) {
    // 剧集：拼接剧名+季+集（如：绝命毒师 S01E01）
    searchTitle = `${seriesName} ${season ? `S${String(season).padStart(2, '0')}` : ''}${episode ? `E${String(episode).padStart(2, '0')}` : ''}`;
  } else if (episodeName) {
    // 单集名称
    searchTitle = episodeName;
  } else if (link) {
    // 从链接提取文件名
    searchTitle = link.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '');
  } else if (tmdbId || imdbId) {
    // 用ID兜底搜索
    searchTitle = tmdbId || imdbId;
  }

  // 无搜索关键词时返回空列表（避免无效请求）
  if (!searchTitle) return [];

  try {
    // 3. 多源搜索字幕（按优先级：迅雷→SubHD→射手→动漫）
    const subtitleSources = [
      { name: "迅雷", fetchFunc: fetchXunleiSubtitle },
      { name: "SubHD", fetchFunc: fetchSubhdSubtitle },
      { name: "射手", fetchFunc: fetchShooterSubtitle },
      { name: "动漫", fetchFunc: fetchAnimeSubtitle },
    ];

    let allSubtitles = [];
    for (const source of subtitleSources) {
      try {
        // 调用单个源的搜索方法
        const subs = await source.fetchFunc(searchTitle);
        // 格式化并过滤有效字幕（符合官方返回规范）
        const formattedSubs = subs
          .filter(sub => sub && sub.url && sub.url.trim()) // 过滤无效链接
          .map((sub, index) => ({
            id: `multi-sub-${source.name.toLowerCase()}-${index}`, // 唯一ID（官方要求）
            title: `${source.name} - ${sub.name || (type === "tv" ? "剧集字幕" : "电影字幕")}`, // 标题（官方示例格式）
            lang: sub.lang || "zh-CN", // 优先简体中文（官方ISO 639-1规范）
            count: -1, // 无弹幕数量则填-1（兼容官方字段）
            url: sub.url, // 字幕下载链接（核心字段）
          }));
        allSubtitles = allSubtitles.concat(formattedSubs);
        
        // 拿到有效字幕则停止（减少请求，提升性能）
        if (allSubtitles.length >= 1) break;
      } catch (error) {
        // 单个源失败不中断，仅日志提示（官方示例容错风格）
        console.warn(`[多源字幕] ${source.name} 加载失败:`, error.message);
        continue;
      }
    }

    // 4. 返回符合官方规范的字幕列表（完全对齐示例格式）
    return allSubtitles;
  } catch (error) {
    console.error("[多源字幕] 整体加载失败:", error.message);
    return []; // 异常时返回空列表，避免插件崩溃
  }
}

// ====================== 各字幕源实现（内部方法，符合官方网络请求规范） ======================
/**
 * 迅雷字幕源（适配搜索关键词，返回标准化结构）
 * @param {String} title - 搜索标题
 * @returns {Array} 原始字幕列表
 */
async function fetchXunleiSubtitle(title) {
  const url = "https://sub.xunlei.com/api/v1/match";
  const resp = await Widget.http.post(url, {
    body: JSON.stringify({ filename: title }),
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000, // 超时控制（官方推荐）
  });

  if (!resp || !resp.data || !resp.data.data) return [];
  return resp.data.data.map(item => ({
    name: item.name || "迅雷字幕",
    url: item.downloadUrl,
    lang: item.language || "zh-CN",
  }));
}

/**
 * SubHD字幕源（适配搜索关键词，返回标准化结构）
 * @param {String} title - 搜索标题
 * @returns {Array} 原始字幕列表
 */
async function fetchSubhdSubtitle(title) {
  const url = "https://subhd.tv/api/search";
  const resp = await Widget.http.post(url, {
    body: JSON.stringify({ q: title }),
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000,
  });

  if (!resp || !resp.data || !resp.data.items) return [];
  return resp.data.items.map(item => ({
    name: item.title || "SubHD字幕",
    url: item.dl_url,
    lang: item.lang === "chinese" ? "zh-CN" : item.lang || "en",
  }));
}

/**
 * 射手网字幕源（适配搜索关键词，返回标准化结构）
 * @param {String} title - 搜索标题
 * @returns {Array} 原始字幕列表
 */
async function fetchShooterSubtitle(title) {
  const url = "https://api.shooter.cn/sub/search";
  const resp = await Widget.http.post(url, {
    body: JSON.stringify({ filename: title }),
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000,
  });

  if (!resp || !resp.data || !resp.data.subs) return [];
  return resp.data.subs.map(item => ({
    name: item.filename || "射手字幕",
    url: item.dl_url,
    lang: "zh-CN",
  }));
}

/**
 * 动漫字幕源（适配搜索关键词，返回标准化结构）
 * @param {String} title - 搜索标题
 * @returns {Array} 原始字幕列表
 */
async function fetchAnimeSubtitle(title) {
  const url = "https://api.animesubs.top/search";
  const resp = await Widget.http.post(url, {
    body: JSON.stringify({ filename: title }),
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000,
  });

  if (!resp || !resp.data || !resp.data.subs) return [];
  return resp.data.subs.map(item => ({
    name: item.title || "动漫字幕",
    url: item.url,
    lang: item.lang || "zh-CN",
  }));
}
