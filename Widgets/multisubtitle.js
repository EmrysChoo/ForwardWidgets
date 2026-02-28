WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "4.0.0",
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

  // 1. 极简关键词（400错误核心：关键词不能含特殊字符/过长）
  let key = searchKey?.trim() || "";
  if (!key) {
    if (type === "tv" && seriesName) {
      // 仅保留剧名，去掉季集（迅雷接口优先模糊匹配剧名）
      key = seriesName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "");
    } else if (link) {
      key = link.split('/').pop().split('.')[0].replace(/[^a-zA-Z0-9]/g, "");
    }
  }
  // 关键词长度限制（迅雷接口限制≤20字符）
  key = key.substring(0, 20);
  if (!key) return [];

  try {
    // 2. 适配迅雷接口真实请求规则（400错误核心修复）
    const resp = await Widget.http.post( // 改为POST请求（官方接口实际是POST）
      "https://api-shoulei-ssl.xunlei.com/oracle/subtitle",
      {
        body: JSON.stringify({ keyword: key }), // 参数放body，而非url
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://www.xunlei.com",
          "Content-Type": "application/json", // 必须指定JSON格式
          "Accept": "application/json"
        },
        timeout: 10000
      }
    );

    // 3. 兼容所有返回格式
    let subs = [];
    if (Array.isArray(resp?.data)) subs = resp.data;
    else if (resp?.data?.subtitles) subs = resp.data.subtitles;
    else if (resp?.data?.list) subs = resp.data.list;

    // 4. 过滤有效资源
    return subs.filter(item => item?.url?.startsWith('http')).map((item, idx) => ({
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
