WidgetMetadata = {
  id: "forward.meta.subtitlecat",
  title: "SubtitleCat 字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "从 subtitlecat.com 搜索中文字幕",
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

// subtitlecat 配置
const SUBTITLECAT_CONFIG = {
  baseUrl: "https://www.subtitlecat.com",
  searchPath: "/index.php",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
  },
  timeout: 15000,
  maxResults: 10
};

/**
 * 主函数：搜索并返回字幕列表
 */
async function loadSubtitle(params) {
  const { searchKey, seriesName, type } = params;

  // 1. 提取关键词
  let key = searchKey?.trim() || seriesName || "";
  if (!key) return [];

  // 2. 清理关键词（保留字母数字中文空格）
  key = key.replace(/[^\w\s\u4e00-\u9fa5]/g, " ").trim();

  try {
    // 3. 搜索请求
    const searchUrl = `${SUBTITLECAT_CONFIG.baseUrl}${SUBTITLECAT_CONFIG.searchPath}?search=${encodeURIComponent(key)}`;
    const resp = await Widget.http.get(searchUrl, {
      headers: SUBTITLECAT_CONFIG.headers,
      timeout: SUBTITLECAT_CONFIG.timeout,
      rejectUnauthorized: false,
      followRedirects: true
    });

    const html = resp?.data || "";
    // 4. 解析搜索结果，获取字幕详情页 URL 列表
    const detailPages = parseSearchResult(html);

    // 5. 并发获取每个详情页的真实字幕下载链接（限制数量）
    const subtitles = [];
    const fetchPromises = detailPages.slice(0, SUBTITLECAT_CONFIG.maxResults).map(async (item, idx) => {
      const downloadUrl = await fetchSubtitleDownloadUrl(item.detailUrl);
      if (downloadUrl) {
        return {
          id: `subcat-${item.id || idx}`,
          title: item.title,
          lang: "zh-CN",
          count: 100,
          url: downloadUrl
        };
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    for (const sub of results) {
      if (sub) subtitles.push(sub);
    }

    return subtitles;

  } catch (e) {
    console.error("subtitlecat 请求失败:", e.message);
    return [];
  }
}

/**
 * 解析搜索结果 HTML，提取每一个字幕的标题和详情页链接
 */
function parseSearchResult(html) {
  const results = [];
  // 匹配类似: <a href="/subs/12345/Some_Movie.html">Some Movie (2023)</a>
  const regex = /<a\s+href="([^"]+subs\/\d+\/[^"]+\.html)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const detailUrl = match[1];
    const title = match[2].trim();
    if (title && detailUrl) {
      // 提取数字 ID（用于标识）
      const idMatch = detailUrl.match(/subs\/(\d+)\//);
      const id = idMatch ? idMatch[1] : "";
      results.push({
        detailUrl: detailUrl.startsWith("http") ? detailUrl : SUBTITLECAT_CONFIG.baseUrl + detailUrl,
        title: title,
        id: id
      });
    }
  }
  return results;
}

/**
 * 从字幕详情页 HTML 中提取实际字幕文件的下载链接
 * 支持常见模式：直接 .srt/.ass 链接；或 download?id=xxx 重定向；或嵌入的下载按钮 href
 */
async function fetchSubtitleDownloadUrl(detailPageUrl) {
  try {
    const resp = await Widget.http.get(detailPageUrl, {
      headers: SUBTITLECAT_CONFIG.headers,
      timeout: 8000,
      rejectUnauthorized: false
    });
    const html = resp?.data || "";
    
    // 模式1：直接匹配 .srt 或 .ass 文件的链接
    let match = html.match(/href="([^"]+\.(?:srt|ass))"/i);
    if (match && match[1]) {
      let url = match[1];
      if (url.startsWith("//")) url = "https:" + url;
      else if (url.startsWith("/")) url = SUBTITLECAT_CONFIG.baseUrl + url;
      return url;
    }
    
    // 模式2：匹配下载按钮，可能是 ?download=1 或 &act=down
    match = html.match(/href="([^"]*download[^"]*\.html?)"/i);
    if (match && match[1]) {
      let url = match[1];
      if (url.startsWith("/")) url = SUBTITLECAT_CONFIG.baseUrl + url;
      // 尝试直接访问这个下载页，可能会返回文件或再次跳转
      // 为了简化，再次请求并跟进重定向
      const dlResp = await Widget.http.get(url, {
        headers: SUBTITLECAT_CONFIG.headers,
        followRedirects: true,
        timeout: 8000
      });
      // 如果最终响应是文本内容且以字幕格式开头，则视为字幕内容
      const finalUrl = dlResp?.finalUrl || url;
      if (finalUrl.match(/\.(srt|ass)$/i)) return finalUrl;
      // 否则尝试从返回的 HTML 中再次提取
      if (dlResp?.data) {
        const innerMatch = dlResp.data.match(/href="([^"]+\.(?:srt|ass))"/i);
        if (innerMatch) return innerMatch[1];
      }
    }
    
    // 模式3：某些字幕站把字幕内容直接嵌入页面中，需要提取并构造临时 blob（不考虑，太复杂）
    return null;
  } catch (e) {
    console.error("获取字幕下载链接失败:", detailPageUrl, e.message);
    return null;
  }
}
