const WidgetMetadata = {
  id: "douban_doulist_fetcher",
  title: "豆瓣片单采集器",
  version: "1.0.0",
  author: "ChatGPT",
  repository: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "fetch_list",
      title: "采集豆瓣片单",
      parameters: [
        {
          name: "url",
          type: "input",
          required: true,
          default: "https://www.douban.com/doulist/12345678/",
          description: "请输入豆瓣片单的链接"
        }
      ],
      async handler({ url }) {
        const html = await Widget.http.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const $ = Widget.html.load(html);

        const items = [];

        $(".doulist-item").each((i, el) => {
          const title = $(el).find(".title a").text().trim();
          const link = $(el).find(".title a").attr("href");
          const cover = $(el).find(".post img").attr("src");
          const ratingText = $(el).find(".rating_nums").text().trim();
          const rating = ratingText || "无评分";
          const abstract = $(el).find(".abstract").text().trim();

          items.push({
            title,
            link,
            cover,
            rating,
            abstract
          });
        });

        return {
          title: "片单结果",
          data: items
        };
      }
    }
  ]
};
