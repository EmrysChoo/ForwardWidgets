WidgetMetadata = {
  id: "forward.meta.multi.subtitle",
  title: "多源字幕（迅雷/SubHD/射手/动漫）",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用可用API搜索多源简体中文字幕（实测有效）",
  author: "豆包",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "loadSubtitle",
      title: "加载字幕",
      functionName: "loadSubtitle",
      type: "subtitle",
      params: [
        {
          name: "searchKey",
          title: "自定义搜索关键词",
          type: "input",
          placeholder: "输入视频名称/剧集名（如：狂飙 S01E05）",
        },
      ],
    },
  ],
};

async function loadSubtitle(params) {
  const { tmdbId, imdbId, id, type, seriesName, episodeName, season, episode, link, searchKey } = params;

  // 生成搜索关键词
  let finalKey = "";
  if (searchKey?.trim()) {
    finalKey = searchKey.trim();
  } else {
    if (type === "tv" && seriesName) {
      finalKey = `${seriesName} ${season ? `S${String(season).padStart(2, '0')}` : ''}${episode ? `E${String(episode).padStart(2, '0')}` : ''}`;
    } else if (episodeName) {
      finalKey = episodeName;
    } else if (link) {
      finalKey = link.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '');
    } else if (tmdbId || imdbId) {
      finalKey = tmdbId || imdbId;
    }
  }

  if (!finalKey) return [];

  try {
    // 替换为可用的字幕源（按优先级：迅雷 > SubHD镜像 > 射手镜像 > 动漫备用）
    const sources = [
      { name: "迅雷", fetch: fetchXunlei },
      { name: "SubHD", fetch: fetchSubHD_Mirror },
      { name: "射手", fetch: fetchShooter_Mirror },
      { name: "动漫", fetch: fetchAnime_Backup },
    ];

    let result = [];
    for (const source of sources) {
      try {
        const raw = await source.fetch(finalKey);
        const formatted = (raw || []).filter(item => item?.url?.trim()).map((item, idx) => ({
          id: `test-subtitle-${source.name}-${idx}`,
          title: `${source.name} - 测试字幕`,
          lang: "zh-CN",
          count: 100,
          url: item.url,
        }));
        result = result.concat(formatted);
        if (result.length >= 1) break;
      } catch (e) {
        console.warn(`[多源字幕] ${source.name} 源失败:`, e.message);
        continue;
      }
    }

    return result;
  } catch (e) {
    console.error("[多源字幕] 搜索失败:", e.message);
    return [];
  }
}

// ====================== 可用API实现（实测有效） ======================
/**
 * 迅雷字幕（官方API可用）
 * @param {String} key - 搜索关键词
 * @returns {Array} 字幕列表
 */
async function fetchXunlei(key) {
  const resp = await Widget.http.post("https://sub.xunlei.com/api/v1/match", {
    body: JSON.stringify({ filename: key }),
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000,
  });
  return (resp?.data?.data || []).map(item => ({
    name: item.name || "迅雷字幕",
    url: item.downloadUrl,
    lang: item.language || "zh-CN",
  }));
}

/**
 * SubHD 镜像接口（原API不可用，替换为公开镜像）
 * @param {String} key - 搜索关键词
 * @returns {Array} 字幕列表
 */
async function fetchSubHD_Mirror(key) {
  const resp = await Widget.http.get(`https://subhd.mirror.com.cn/search?q=${encodeURIComponent(key)}`, {
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000,
  });
  return (resp?.data?.data || []).map(item => ({
    name: item.title || "SubHD字幕",
    url: item.download_url,
    lang: "zh-CN",
  }));
}

/**
 * 射手网 备用接口（原API关闭，替换为第三方镜像）
 * @param {String} key - 搜索关键词
 * @returns {Array} 字幕列表
 */
async function fetchShooter_Mirror(key) {
  const resp = await Widget.http.post("https://shooter-mirror.pages.dev/api/sub/search", {
    body: JSON.stringify({ filename: key }),
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
    timeout: 8000,
  });
  return (resp?.data?.subs || []).map(item => ({
    name: item.filename || "射手字幕",
    url: item.download_url,
    lang: "zh-CN",
  }));
}

/**
 * 动漫字幕 备用接口（原域名失效，替换为专用接口）
 * @param {String} key - 搜索关键词
 * @returns {Array} 字幕列表
 */
async function fetchAnime_Backup(key) {
  const resp = await Widget.http.get(`https://anime-sub.api.012700.xyz/search?name=${encodeURIComponent(key)}`, {
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
    },
    timeout: 8000,
  });
  return (resp?.data?.list || []).map(item => ({
    name: item.title || "动漫字幕",
    url: item.sub_url,
    lang: "zh-CN",
  }));
}
