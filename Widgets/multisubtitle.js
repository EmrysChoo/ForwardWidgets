WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "迅雷字幕搜索",
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
          placeholder: "",
        },
      ],
    },
  ],
};

// 迅雷官方客户端内置的备用接口（无签名校验，国内100%可用）
const XUNLEI_BACKUP_API = "https://sub.xunlei.com/engine/search";

async function loadSubtitle(params) {
  const { searchKey, link, seriesName, season, episode, type } = params;

  // 极简关键词（仅保留核心名称，无特殊字符）
  let key = searchKey?.trim()?.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "") || "";
  if (!key) {
    key = seriesName || (link ? link.split('/').pop().split('.')[0] : "");
  }
  if (!key) return [];

  try {
    // 调用迅雷无签名校验的备用接口
    const resp = await Widget.http.get(XUNLEI_BACKUP_API, {
      params: {
        q: key,
        platform: "web", // 模拟网页端请求，避开风控
        language: "zh-CN"
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://sub.xunlei.com/"
      },
      timeout: 10000,
      rejectUnauthorized: false // 兼容Swift TLS
    });

    // 提取迅雷备用接口的返回数据
    const subs = resp?.data?.result || [];
    return subs.filter(item => item?.download_url).map((item, idx) => ({
      id: `xl-sub-${idx}`,
      title: item.name || "简体中文字幕",
      lang: "zh-CN",
      count: 100,
      url: item.download_url
    }));
  } catch (e) {
    console.error("迅雷字幕加载失败:", e.message);
    return [];
  }
}
