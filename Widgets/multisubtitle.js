WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "迅雷字幕搜索（中英双语）",
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
          title: "搜索关键词",
          type: "input",
          placeholder: "支持中英文，如：The Wandering Earth 2 / 流浪地球2",
        },
      ],
    },
  ],
};

// 迅雷网页端接口（支持中英文，无400错误）
const XUNLEI_API = "https://sub.xunlei.com/engine/search";

async function loadSubtitle(params) {
  const { searchKey, link, seriesName, season, episode, type } = params;

  // 兼容中英文关键词：仅过滤非法字符，保留字母/数字/中文/空格
  let key = searchKey?.trim()?.replace(/[^\w\s\u4e00-\u9fa5]/g, "") || "";
  
  // 自动补全季集格式（中英文都兼容）
  if (!key && type === "tv" && seriesName && season && episode) {
    // 英文：S01E05 → 中文：1季5集，都支持
    key = `${seriesName} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  } else if (!key && link) {
    // 从链接提取文件名（兼容中英文文件名）
    key = link.split('/').pop().split('.')[0].replace(/[^\w\s\u4e00-\u9fa5]/g, "");
  }

  if (!key) return [];

  try {
    const resp = await Widget.http.get(XUNLEI_API, {
      params: {
        q: key,
        platform: "web",
        language: "all" // 关键：改为all，支持中英文字幕检索
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://sub.xunlei.com/"
      },
      timeout: 10000,
      rejectUnauthorized: false
    });

    const subs = resp?.data?.result || [];
    return subs.filter(item => item?.download_url).map((item, idx) => ({
      id: `xl-sub-${idx}`,
      title: item.name || (item.language === "en" ? "English Subtitle" : "简体中文字幕"),
      lang: item.language === "en" ? "en" : "zh-CN", // 区分中英字幕语言
      count: 100,
      url: item.download_url
    }));
  } catch (e) {
    console.error("迅雷字幕加载失败:", e.message);
    return [];
  }
}
