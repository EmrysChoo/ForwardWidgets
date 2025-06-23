var WidgetMetadata = {
  id: "forward.tmdb.person.credits",
  title: "个人作品集",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取 TMDB 个人相关作品数据（全部/演员/导演/其他）",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets", 
  cacheDuration: 172800, // 2天缓存
  modules: [
    // ✅ 模块顺序调整为：全部作品 → 演员作品 → 导演作品 → 其他作品
    {
      id: "allWorks",
      title: "全部作品",
      functionName: "getAllWorks",
      cacheDuration: 172800,
      params: [
        {
          name: "personId",
          title: "个人ID",
          type: "input",
          description: "在 TMDB 网站获取的数字 ID",
          value: "500"
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN"
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "电影", value: "movie" },
            { title: "电视剧", value: "tv" }
          ],
          value: "all"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门降序", value: "popularity.desc" },
            { title: "评分降序", value: "vote_average.desc" },
            { title: "发行日期降序", value: "release_date.desc" }
          ],
          value: "popularity.desc"
        }
      ]
    },
    {
      id: "actorWorks",
      title: "演员作品",
      functionName: "getActorWorks",
      cacheDuration: 172800,
      params: [
        {
          name: "personId",
          title: "个人ID",
          type: "input",
          description: "在 TMDB 网站获取的数字 ID",
          value: "500", // 示例：Tom Cruise
          placeholders: [
            { title: "示例：Leonardo DiCaprio", value: "6194" }
          ]
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN"
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "电影", value: "movie" },
            { title: "电视剧", value: "tv" }
          ],
          value: "all"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门降序", value: "popularity.desc" },
            { title: "评分降序", value: "vote_average.desc" },
            { title: "发行日期降序", value: "release_date.desc" }
          ],
          value: "popularity.desc"
        }
      ]
    },
    {
      id: "directorWorks",
      title: "导演作品",
      functionName: "getDirectorWorks",
      cacheDuration: 172800,
      params: [
        {
          name: "personId",
          title: "个人ID",
          type: "input",
          description: "在 TMDB 网站获取的数字 ID",
          value: "500", // 示例：Tom Cruise
          placeholders: [
            { title: "示例：Christopher Nolan", value: "525" }
          ]
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN"
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "电影", value: "movie" },
            { title: "电视剧", value: "tv" }
          ],
          value: "all"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门降序", value: "popularity.desc" },
            { title: "评分降序", value: "vote_average.desc" },
            { title: "发行日期降序", value: "release_date.desc" }
          ],
          value: "popularity.desc"
        }
      ]
    },
    {
      id: "otherWorks",
      title: "其他作品",
      functionName: "getOtherWorks",
      cacheDuration: 172800,
      params: [
        {
          name: "personId",
          title: "个人ID",
          type: "input",
          description: "在 TMDB 网站获取的数字 ID",
          value: "500"
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN"
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "电影", value: "movie" },
            { title: "电视剧", value: "tv" }
          ],
          value: "all"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门降序", value: "popularity.desc" },
            { title: "评分降序", value: "vote_average.desc" },
            { title: "发行日期降序", value: "release_date.desc" }
          ],
          value: "popularity.desc"
        }
      ]
    }
  ]
};

// 基础获取TMDB人员作品方法
async function fetchCredits(personId, language) {
  try {
    const api = `person/${personId}/movie_credits`;
    const response = await Widget.tmdb.get(api, {
      params: { language: language || "zh-CN" }
    });
    
    if (!response || (!response.cast && !response.crew)) {
      throw new Error("获取作品数据失败");
    }

    // 统一字段名：mediaType
    const cast = response.cast?.map(item => ({
      ...item,
      mediaType: item.media_type,
      releaseDate: item.release_date || item.first_air_date
    })) || [];
    
    const crew = response.crew?.map(item => ({
      ...item,
      mediaType: item.media_type,
      releaseDate: item.release_date || item.first_air_date
    })) || [];
    
    return { cast, crew };
  } catch (error) {
    console.error("调用 TMDB API 失败:", error);
    throw error;
  }
}

// 过滤函数：按类型筛选
function filterByType(items, targetType) {
  if (targetType === "all") return items;
  return items.filter(item => item.mediaType === targetType);
}

// 排序函数：按字段排序
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

// 获取全部作品（合并演员和导演作品）
async function getAllWorks(params = {}) {
  try {
    const { personId, language, type, sort_by } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { cast, crew } = await fetchCredits(personId, language);
    
    // 合并数据并去重
    const allWorksMap = {};
    [...cast, ...crew].forEach(movie => {
      if (!allWorksMap[movie.id]) {
        allWorksMap[movie.id] = {
          ...movie,
          title: movie.title || movie.name,
          releaseDate: movie.release_date || movie.first_air_date,
          mediaType: movie.media_type === "tv" ? "tv" : "movie"
        };
      }
    });
    
    // 按类型筛选
    const filtered = filterByType(Object.values(allWorksMap), type);
    
    // 按排序方式处理
    const sorted = applySorting(filtered, sort_by);
    
    return sorted.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
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
async function getActorWorks(params = {}) {
  try {
    const { personId, language, type, sort_by } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { cast } = await fetchCredits(personId, language);
    
    // 按类型筛选
    const filtered = filterByType(cast, type);
    
    // 按排序方式处理
    const sorted = applySorting(filtered, sort_by);
    
    return sorted.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.releaseDate,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.mediaType
    }));
  } catch (error) {
    console.error("获取演员作品失败:", error);
    throw error;
  }
}

// 获取导演作品
async function getDirectorWorks(params = {}) {
  try {
    const { personId, language, type, sort_by } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { crew } = await fetchCredits(personId, language);
    
    // 筛选导演作品
    const directorWorks = crew.filter(item => 
      item.job?.toLowerCase().includes("director")
    );
    
    // 按类型筛选
    const filtered = filterByType(directorWorks, type);
    
    // 按排序方式处理
    const sorted = applySorting(filtered, sort_by);
    
    return sorted.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.releaseDate,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.mediaType
    }));
  } catch (error) {
    console.error("获取导演作品失败:", error);
    throw error;
  }
}

// 获取其他作品（排除导演和演员）
async function getOtherWorks(params = {}) {
  try {
    const { personId, language, type, sort_by } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { crew } = await fetchCredits(personId, language);
    
    // 排除导演和演员相关的作品
    const otherWorks = crew.filter(item => {
      const job = item.job?.toLowerCase();
      return !job.includes("director") && !job.includes("actor");
    });
    
    // 按类型筛选
    const filtered = filterByType(otherWorks, type);
    
    // 按排序方式处理
    const sorted = applySorting(filtered, sort_by);
    
    return sorted.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.releaseDate,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.mediaType
    }));
  } catch (error) {
    console.error("获取其他作品失败:", error);
    throw error;
  }
}
