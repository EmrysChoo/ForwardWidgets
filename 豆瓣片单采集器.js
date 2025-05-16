const WidgetMetadata = {
  id: "douban_doulist",
  title: "豆瓣片单采集器",
  version: "1.0.0",
  author: "ChatGPT",
  modules: [
    {
      id: "fetch",
      title: "采集片单",
      description: "根据豆瓣片单链接采集影片信息",
      parameters: [
        {
          name: "url",
          type: "input",
          required: true,
          default: "https://www.douban.com/doulist/12345678/",
          description: "豆瓣片单链接（须包含 https://）"
        }
      ],
      async handler({ url }) {
        const html = await Widget.http.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });
        const $ = Widget.html.load(html);
        const results = [];

        $(".doulist-item").each((index, element) => {
          const title = $(element).find(".title a").text().trim();
          const link = $(element).find(".title a").attr("href");
          const cover = $(element).find(".post img").attr("src");
          const rating = $(element).find(".rating_nums").text().trim() || "无评分";
          const abstract = $(element).find(".abstract").text().trim();

          results.push({
            标题: title,
            链接: link,
            封面: cover,
            评分: rating,
            简介: abstract
          });
        });

        return {
          title: "采集结果",
          data: results
        };
      }
    }
  ]
};
