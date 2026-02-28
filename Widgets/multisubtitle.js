WidgetMetadata = {
  id: "forward.meta.xunlei.subtitle",
  title: "迅雷字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
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
    const resp = await Widget.http.get("https://sub.xunlei.com/engine/search", {
      params: {
        q: key,
        platform: "web"
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://sub.xunlei.com/"
      },
      timeout: 10000
    });

    const list = resp?.data?.result || [];

    return list.filter(item => item?.download_url).map((item, idx) => ({
      id: "xl-sub-" + idx,
      title: item.name || "字幕",
      lang: "zh-CN",
      count: 100,
      url: item.download_url
    }));
  } catch (e) {
    return [];
  }
}
