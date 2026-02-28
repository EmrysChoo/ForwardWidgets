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

// 迅雷官方接口规范配置（针对 400 错误优化了请求方式）
const XUNLEI_CONFIG = {
  url: "https://api-shoulei-ssl.xunlei.com/oracle/subtitle",
  headers: {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Referer": "https://m.xunlei.com/",
    "Accept": "application/json, text/plain, */*",
    "Connection": "keep-alive"
  }
};

async function loadSubtitle(params) {
  const { searchKey, link, seriesName, type } = params;

  // 1. 生成符合接口要求的关键词
  let key = searchKey?.trim() || "";
  if (!key) {
    if (type === "tv" && seriesName) {
      key = seriesName;
    } else if (link) {
      key = link.split('/').pop().split('.')[0];
    }
  }
  if (!key) return [];

  try {
    // 2. 核心修复：改用 GET 请求并手动拼接 URL 参数
    // 400 错误通常是因为 POST Body 无法被服务器解析，GET 传参是目前最兼容的方式
    const targetUrl = `${XUNLEI_CONFIG.url}?keyword=${encodeURIComponent(key)}`;

    const resp = await Widget.http.get(targetUrl, {
      headers: XUNLEI_CONFIG.headers,
      timeout: 10000,
      rejectUnauthorized: false
    });

    // 3. 适配接口返回格式
    let subs = [];
    const data = resp?.data;
    
    // 穷举迅雷 API 可能返回的所有列表字段名
    if (Array.isArray(data)) {
      subs = data;
    } else if (data?.data?.subtitles) {
      subs = data.data.subtitles;
    } else if (data?.data?.list) {
      subs = data.data.list;
    } else if (data?.list) {
      subs = data.list;
    } else if (data?.sublist) {
      subs = data.sublist;
    }

    // 4. 返回标准格式字幕
    return subs
      .filter(item => {
        const u = item?.url || item?.surl;
        return u && typeof u === 'string' && u.startsWith('http');
      })
      .map((item, idx) => ({
        id: `xl-sub-${idx}`,
        title: item.title || item.name || item.sname || "迅雷中文字幕",
        lang: "zh-CN",
        count: 100,
        url: (item.url || item.surl).trim()
      }));
  } catch (e) {
    console.error("迅雷接口调用失败:", e.message);
    return []; 
  }
}
