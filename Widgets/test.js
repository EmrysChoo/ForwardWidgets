WidgetMetadata = {
  id: "forward.danmu",
  title: "多平台弹幕（统一搜索+抓取）",
  version: "1.0.0",
  requiredVersion: "0.0.2",
  description: "通过弹幕聚合API根据名称搜索并抓取腾讯/爱奇艺/优酷弹幕",
  author: "ChatGPT",
  site: "https://dm.vidz.asia",
  globalParams: [
    {
      name: "server",
      title: "弹幕API服务器",
      type: "input",
      placeholders: [
        {
          title: "默认弹幕聚合API",
          value: "https://dm.vidz.asia",
        },
      ],
    },
  ],
  modules: [
    {
      id: "searchDanmu",
      title: "搜索视频弹幕ID",
      functionName: "searchDanmu",
      type: "danmu",
      params: [],
    },
    {
      id: "getComments",
      title: "获取弹幕",
      functionName: "getCommentsById",
      type: "danmu",
      params: [],
    },
  ],
};

async function searchDanmu(params) {
  const { server, title } = params;
  if (!title) throw new Error("缺少搜索标题");

  const url = `${server}/?ac=videolist&wd=${encodeURIComponent(title)}`;
  const resp = await Widget.http.get(url, {
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
  });

  if (!resp || !resp.data || !resp.data.list) {
    throw new Error("搜索接口返回异常");
  }

  const results = resp.data.list;
  if (results.length === 0) {
    return { animes: [] };
  }

  // 格式化返回数据，使用弹幕ID（item.id）或视频链接(item.url)
  const animes = results.map(item => ({
    animeId: item.url || item.id || item.vid || item.link,
    animeTitle: item.name || item.title || "未知标题",
    type: "movie",
    link: item.url || "",
  }));

  return { animes };
}

async function getCommentsById(params) {
  const { server, commentId } = params;
  if (!commentId) throw new Error("缺少弹幕ID");

  // 传入的 commentId 实际是视频链接或弹幕库的id，直接用弹幕聚合API拉弹幕
  const url = `${server}/?ac=dm&url=${encodeURIComponent(commentId)}`;

  const resp = await Widget.http.get(url, {
    headers: {
      "User-Agent": "ForwardWidgets/1.0.0",
      "Content-Type": "application/json",
    },
  });

  if (!resp || !resp.data || resp.data.code !== 23) {
    throw new Error("弹幕获取失败");
  }

  return {
    comments: resp.data.danmuku || [],
  };
}
