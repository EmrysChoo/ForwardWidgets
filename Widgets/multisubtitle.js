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

// 迅雷官方接口规范配置（核心：严格匹配请求规则）
const XUNLEI_CONFIG = {
  url: "https://api-shoulei-ssl.xunlei.com/oracle/subtitle",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Referer": "https://www.xunlei.com/",
    "Content-Type": "application/json;charset=UTF-8",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.xunlei.com",
    "Connection": "keep-alive"
  }
};

async function loadSubtitle(params) {
  const { searchKey, link, seriesName, season, episode, type } = params;

  // 1. 生成符合接口要求的关键词（无特殊字符、长度≤20）
  let key = searchKey?.trim()?.replace(/[^\w\s\u4e00-\u9fa5]/g, "") || "";
  if (!key) {
    if (type === "tv" && seriesName) {
      key = seriesName.substring(0, 20); // 限制长度，避免参数超限
    } else if (link) {
      key = link.split('/').pop().split('.')[0].substring(0, 20);
    }
  }
  if (!key) return [];

  try {
    // 2. 严格按官方规范调用接口（POST + JSON Body）
    const resp = await Widget.http.post(
      XUNLEI_CONFIG.url,
      {
        body: JSON.stringify({ keyword: key }), // 参数必须放Body，非URL
        headers: XUNLEI_CONFIG.headers,
        timeout: 10000,
        rejectUnauthorized: false, // 兼容Swift TLS校验
        followRedirects: true // 跟随接口重定向
      }
    );

    // 3. 适配接口返回格式（解决解析失败问题）
    let subs = [];
    // 兼容接口所有合法返回格式
    if (Array.isArray(resp?.data)) {
      subs = resp.data;
    } else if (resp?.data?.data?.subtitles) {
      subs = resp.data.data.subtitles;
    } else if (resp?.data?.list) {
      subs = resp.data.list;
    }

    // 4. 返回所有字幕资源（让你手动选择）
    return subs.filter(item => item?.url?.startsWith('http')).map((item, idx) => ({
      id: `xl-sub-${idx}`,
      title: item.title || item.name || "简体中文字幕",
      lang: "zh-CN",
      count: 100,
      url: item.url.trim()
    }));
  } catch (e) {
    console.error("迅雷接口调用失败:", e.message);
    return [];
  }
}
