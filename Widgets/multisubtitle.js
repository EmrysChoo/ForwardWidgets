WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vunlei.com/favicon.ico",
  version: "2.0.0",
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
          placeholder: ""
        }
      ]
    }
  ]
};

async function loadSubtitle(params) {
  const { searchKey, link, seriesName, season, episode, type } = params;

  let key = searchKey?.trim() || "";

  if (!key) {
    if (type === "tv" && seriesName && season && episode) {
      key = `${seriesName} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    } else if (link) {
      key = link.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '');
    }
  }

  if (!key) return [];

  try {
    const resp = await Widget.http.get("https://api-shoulei-ssl.xunlei.com/oracle/subtitle", {
      params: { keyword: key },
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.xunlei.com"
      },
      timeout: 10000
    });

    const list = resp?.data || [];

    return list.filter(item => item?.url).map((item, idx) => ({
      id: "xl-sub-" + idx,
      title: item.title || "字幕",
      lang: "zh-CN",
      count: 100,
      url: item.url
    }));
  } catch (e) {
    return [];
  }
}
