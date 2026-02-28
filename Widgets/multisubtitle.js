WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "3.0.0",
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

async function loadSubtitle(params) {
  const { searchKey, link, seriesName, season, episode, type } = params;

  // 1. 生成精准的搜索关键词（适配迅雷接口的匹配规则）
  let key = searchKey?.trim() || "";
  if (!key) {
    if (type === "tv" && seriesName && season && episode) {
      // 迅雷接口偏好「剧名 季数 集数」无S/E格式
      key = `${seriesName} ${season}季${episode}集`;
    } else if (link) {
      key = link.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '');
    }
  }
  if (!key) return [];

  try {
    // 2. 调用迅雷官方接口（带完整请求头）
    const resp = await Widget.http.get("https://api-shoulei-ssl.xunlei.com/oracle/subtitle", {
      params: { keyword: key },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.xunlei.com/",
        "Accept": "application/json, text/plain, */*"
      },
      timeout: 10000
    });

    // 3. 适配迅雷真实返回格式（核心修复点）
    let subs = [];
    // 迅雷接口返回格式1：直接数组
    if (Array.isArray(resp?.data)) {
      subs = resp.data;
    }
    // 迅雷接口返回格式2：嵌套在data/subtitles里
    else if (resp?.data?.data?.subtitles) {
      subs = resp.data.data.subtitles;
    }
    // 迅雷接口返回格式3：嵌套在list里
    else if (resp?.data?.list) {
      subs = resp.data.list;
    }

    // 4. 格式化并过滤有效资源
    return subs.filter(item => {
      // 校验必填字段：url必须存在且是有效链接
      return item && item.url && item.url.startsWith('http') && item.url.trim() !== '';
    }).map((item, idx) => ({
      id: `xl-sub-${idx}`,
      title: item.title || item.name || "简体中文字幕",
      lang: "zh-CN",
      count: 100,
      url: item.url.trim()
    }));
  } catch (e) {
    console.error("迅雷字幕加载失败:", e.message);
    return [];
  }
}
