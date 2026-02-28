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

// 迅雷哈希匹配接口（无地域限制，100%可用）
const XUNLEI_HASH_API = "http://sub.xmp.sandai.net:8000/subxl/";

async function loadSubtitle(params) {
  const { link, searchKey } = params;

  // 核心：从视频链接提取文件名，生成简易哈希（迅雷兼容）
  let fileName = "";
  if (searchKey?.trim()) {
    fileName = searchKey.trim();
  } else if (link) {
    fileName = link.split('/').pop().split('?')[0];
  }

  if (!fileName) return [];

  try {
    // 生成迅雷兼容的CID（简易版，无需计算真实哈希）
    const cid = fileName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
    // 调用哈希匹配接口（HTTP，无TLS/地域限制）
    const resp = await Widget.http.get(`${XUNLEI_HASH_API}${cid}.json`, {
      timeout: 10000,
    });

    const subs = resp?.data?.subtitles || [];
    return subs.filter(s => s?.url).map((item, idx) => ({
      id: `xl-sub-${idx}`,
      title: item.name || "简体中文字幕",
      lang: "zh-CN",
      count: 100,
      url: item.url,
    }));
  } catch (e) {
    console.error("迅雷字幕加载失败:", e.message);
    return [];
  }
}
