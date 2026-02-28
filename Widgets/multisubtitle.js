WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷影音字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.3.0",
  requiredVersion: "0.0.1",
  description: "基于迅雷影音协议的字幕搜索",
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

// 迅雷影音专用接口配置
const XUNLEI_CONFIG = {
  // 使用 https 避免网络中断，如果 https 不通，插件底层会自动降级或报错
  url: "https://sub.xmp.sandai.net/subhub/search/top",
  headers: {
    "User-Agent": "ThunderVVDestop", // 模拟迅雷影音 PC 客户端 UA
    "Accept": "*/*",
    "Connection": "keep-alive"
  }
};

async function loadSubtitle(params) {
  const { searchKey, seriesName, type } = params;

  // 1. 提取关键词
  let key = searchKey?.trim() || seriesName || "";
  if (!key) return [];

  // 2. 清理关键词（迅雷影音接口不喜欢特殊符号）
  key = key.replace(/[^\w\s\u4e00-\u9fa5]/g, " ").trim();

  try {
    // 3. 构建 GET 请求（迅雷影音接口不支持 POST）
    const targetUrl = `${XUNLEI_CONFIG.url}?keyword=${encodeURIComponent(key)}`;

    const resp = await Widget.http.get(targetUrl, {
      headers: XUNLEI_CONFIG.headers,
      timeout: 10000,
      rejectUnauthorized: false, // 核心：忽略证书校验，防止“网络中断”
      followRedirects: true
    });

    // 4. 解析数据（处理可能的字符串返回）
    let result = resp?.data;
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch (e) {
        // 如果解析失败，尝试匹配 JSON 结构（防止返回非标准格式）
        const match = result.match(/\{.*\}/);
        if (match) result = JSON.parse(match[0]);
      }
    }

    // 5. 迅雷影音返回的列表字段固定为 sublist
    const list = result?.sublist || result?.data || [];

    // 6. 转换为插件标准格式
    return list.map((item, idx) => {
      // 兼容 surl 或 url 字段
      const rawUrl = item.surl || item.url || "";
      return {
        id: `xmp-${item.svid || idx}`,
        title: item.sname || item.name || "迅雷影音资源",
        lang: "zh-CN",
        count: 100,
        url: rawUrl.trim()
      };
    }).filter(item => item.url.startsWith('http'));

  } catch (e) {
    console.error("迅雷影音接口请求失败:", e.message);
    // 如果 https 报错中断，尝试最后一次 http 降级请求
    if (XUNLEI_CONFIG.url.startsWith('https')) {
       XUNLEI_CONFIG.url = XUNLEI_CONFIG.url.replace('https', 'http');
       return loadSubtitle(params);
    }
    return [];
  }
}
