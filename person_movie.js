var WidgetMetadata = {
  id: "TMDB person Movie",
  title: "TMDB个人作品集",
  version: "1.0.6",
  requiredVersion: "0.0.1",
  description: "获取 TMDB 个人相关作品数据（Forward 5折优惠码 LUCKY.5)",
  author: "Evan",
  site: "https://github.com/EmrysChoo/ForwardWidgets",
  cacheDuration: 172800,
  modules: [
    {
      id: "allWorks",
      title: "全部作品",
      functionName: "fetchAllWorks",
      params: [
        { name: "personId", title: "个人ID", type: "input", description: "在 TMDB 网站获取的数字 ID", value: "500" },
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { name: "type", title: "类型", type: "enumeration", enumOptions: [
          { title: "全部", value: "all" }, { title: "电影", value: "movie" }, { title: "电视剧", value: "tv" }
        ], value: "all" },
        { name: "sort_by", title: "排序方式", type: "enumeration", enumOptions: [
          { title: "热门降序", value: "popularity.desc" },
          { title: "评分降序", value: "vote_average.desc" },
          { title: "发行日期降序", value: "release_date.desc" }
        ], value: "popularity.desc" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "actorWorks",
      title: "演员作品",
      functionName: "fetchActorWorks",
      params: [
        { name: "personId", title: "个人ID", type: "input", description: "在 TMDB 网站获取的数字 ID", value: "500", placeholders: [{ title: "示例：Leonardo DiCaprio", value: "6194" }] },
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { name: "type", title: "类型", type: "enumeration", enumOptions: [
          { title: "全部", value: "all" }, { title: "电影", value: "movie" }, { title: "电视剧", value: "tv" }
        ], value: "all" },
        { name: "sort_by", title: "排序方式", type: "enumeration", enumOptions: [
          { title: "热门降序", value: "popularity.desc" },
          { title: "评分降序", value: "vote_average.desc" },
          { title: "发行日期降序", value: "release_date.desc" }
        ], value: "popularity.desc" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "directorWorks",
      title: "导演作品",
      functionName: "fetchDirectorWorks",
      params: [
        { name: "personId", title: "个人ID", type: "input", description: "在 TMDB 网站获取的数字 ID", value: "500", placeholders: [{ title: "示例：Christopher Nolan", value: "525" }] },
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { name: "type", title: "类型", type: "enumeration", enumOptions: [
          { title: "全部", value: "all" }, { title: "电影", value: "movie" }, { title: "电视剧", value: "tv" }
        ], value: "all" },
        { name: "sort_by", title: "排序方式", type: "enumeration", enumOptions: [
          { title: "热门降序", value: "popularity.desc" },
          { title: "评分降序", value: "vote_average.desc" },
          { title: "发行日期降序", value: "release_date.desc" }
        ], value: "popularity.desc" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "otherWorks",
      title: "其他作品",
      functionName: "fetchOtherWorks",
      params: [
        { name: "personId", title: "个人ID", type: "input", description: "在 TMDB 网站获取的数字 ID", value: "500" },
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { name: "type", title: "类型", type: "enumeration", enumOptions: [
          { title: "全部", value: "all" }, { title: "电影", value: "movie" }, { title: "电视剧", value: "tv" }
        ], value: "all" },
        { name: "sort_by", title: "排序方式", type: "enumeration", enumOptions: [
          { title: "热门降序", value: "popularity.desc" },
          { title: "评分降序", value: "vote_average.desc" },
          { title: "发行日期降序", value: "release_date.desc" }
        ], value: "popularity.desc" },
        { name: "page", title: "页码", type: "page" }
      ]
    }
  ]
};

// 公共函数：获取 TMDB 人物作品数据
async function fetchCredits(personId, language, mediaType = 'movie') {
  try {
    const api = `person/${personId}/${mediaType}_credits`;
    const response = await Widget.tmdb.get(api, {
      params: { language: language || "zh-CN" }
    });

    if (!response || (!response.cast && !response.crew)) {
      throw new Error(`获取 ${mediaType} 作品数据失败`);
    }

    return {
      cast: response.cast?.map(item => ({
        ...item,
        mediaType: item.media_type,
        releaseDate: item.release_date || item.first_air_date
      })) || [],
      crew: response.crew?.map(item => ({
        ...item,
        mediaType: item.media_type,
        releaseDate: item.release_date || item.first_air_date
      })) || []
    };
  } catch (error) {
    console.error(`调用 TMDB API 获取 ${mediaType} 作品失败:`, error);
    throw error;
  }
}

// 核心函数：获取全部作品（演员、导演、编剧、制片人等）
async function fetchAllWorks(params = {}) {
  try {
    const { personId, language, type, sort_by, page = 1 } = params;

    if (!personId) throw new Error("缺少个人ID参数");

    const [movieCredits, tvCredits] = await Promise.all([
      fetchCredits(personId, language, 'movie'),
      fetchCredits(personId, language, 'tv')
    ]);

    const allWorksMap = {};

    [...movieCredits.cast, ...movieCredits.crew, ...tvCredits.cast, ...tvCredits.crew].forEach(item => {
      const key = `${item.id}-${item.media_type}`;
      if (!allWorksMap[key]) {
        allWorksMap[key] = {
          ...item,
          title: item.title || item.name,
          releaseDate: item.releaseDate,
          mediaType: item.media_type === "tv" ? "tv" : "movie"
        };
      }
    });

    let allWorks = Object.values(allWorksMap);
    allWorks = filterByType(allWorks, type);
    allWorks = applySorting(allWorks, sort_by);

    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = allWorks.slice(start, end);

    return paginated.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title,
      description: movie.overview,
      releaseDate: movie.releaseDate,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.mediaType
    }));
  } catch (error) {
    console.error("获取全部作品失败:", error);
    throw error;
  }
}

// 获取演员作品
async function fetchActorWorks(params = {}) {
  try {
    const { personId, language, type, sort_by, page } = params;
    const { cast } = await fetchCredits(personId, language, 'movie');
    let filtered = filterByType(cast, type);
    filtered = applySorting(filtered, sort_by);
    return processPaginatedResults(filtered, page, "movie");
  } catch (error) {
    console.error("获取演员作品失败:", error);
    throw error;
  }
}

// 获取导演作品
async function fetchDirectorWorks(params = {}) {
  try {
    const { personId, language, type, sort_by, page } = params;
    const { crew } = await fetchCredits(personId, language, 'movie');
    let directorWorks = crew.filter(item => 
      item.job?.toLowerCase().match(/director|directing/i)
    );
    let filtered = filterByType(directorWorks, type);
    filtered = applySorting(filtered, sort_by);
    return processPaginatedResults(filtered, page, "movie");
  } catch (error) {
    console.error("获取导演作品失败:", error);
    throw error;
  }
}

// 获取其他作品（排除导演和演员）
async function fetchOtherWorks(params = {}) {
  try {
    const { personId, language, type, sort_by, page } = params;
    const { crew } = await fetchCredits(personId, language, 'movie');
    let otherWorks = crew.filter(item => 
      !item.job?.toLowerCase().match(/director|actor|acting/i)
    );
    let filtered = filterByType(otherWorks, type);
    filtered = applySorting(filtered, sort_by);
    return processPaginatedResults(filtered, page, "movie");
  } catch (error) {
    console.error("获取其他作品失败:", error);
    throw error;
  }
}

// 辅助函数：过滤、排序、分页
function filterByType(items, targetType) {
  if (targetType === "all") return items;
  return items.filter(item => item.mediaType === targetType);
}

function applySorting(items, sortBy) {
  if (!sortBy) return items;
  switch (sortBy) {
    case "vote_average.desc":
      return [...items].sort((a, b) => b.vote_average - a.vote_average);
    case "release_date.desc":
      return [...items].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    case "popularity.desc":
      return [...items].sort((a, b) => b.popularity - a.popularity);
    default:
      return items;
  }
}

function processPaginatedResults(items, page, defaultMediaType = "movie") {
  const pageSize = 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = items.slice(start, end);
  return paginated.map(movie => ({
    id: movie.id,
    type: "tmdb",
    title: movie.title,
    description: movie.overview,
    releaseDate: movie.releaseDate,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    rating: movie.vote_average,
    mediaType: movie.mediaType || defaultMediaType
  }));
}
```
