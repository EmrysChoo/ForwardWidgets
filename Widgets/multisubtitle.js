WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "迅雷字幕搜索(稳定版)",
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

// 换用兼容性更强的接口，并保持规范注释
const XUNLEI_CONFIG = {
  // 备用地址：http://sub.xmp.sandai.net/subhub/search/top?keyword=
  url: "http://sub.xmp.sandai.net/subhub/search/top",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9"
  }
};

async function loadSubtitle(params) {
  const { searchKey } = params;
  let key = searchKey?.trim() || "";
  if (!key) return [];

  try {
    // 1. 采用 GET 请求，这是该接口最稳定的调用方式
    const targetUrl = `${XUNLEI_CONFIG.url}?keyword=${encodeURIComponent(key)}`;

    const resp = await Widget.http.get(targetUrl, {
      headers: XUNLEI_CONFIG.headers,
      timeout: 10000
    });

    // 2. 解析返回结果
    let data = resp?.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    // 3. 提取字幕列表 (迅雷影音接口通常返回 sublist)
    const list = data?.sublist || data?.data || [];

    // 4. 格式化返回
    return list.map((item, idx) => ({
      id: `xl-sub-${idx}`,
      title: item.sname || item.name || "迅雷字幕资源",
      lang: "zh-CN",
      count: 100,
      url: (item.surl || item.url || "").trim()
    })).filter(item => item.url.startsWith('http'));

  } catch (e) {
    console.error("迅雷接口尝试失败:", e.message);
    return []; 
  }
}
