var WidgetMetadata = {
  id: "TMDB person Movie",
  title: "TMDB个人作品集",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取 TMDB 个人相关作品数据",
  author: "Evan",
  site: "https://github.com/EmrysChoo/ForwardWidgets", 
  cacheDuration: 172800, // 48小时缓存
  modules: [
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
          value: "500",
          placeholders: [
            { title: "示例：周星驰", value: "57607" }
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
          value: "500",
          placeholders: [
            { title: "示例：Tom Cruise", value: "500" }
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
        }
      ]
    },
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
    
    return {
      cast: response.cast || [],
      crew: response.crew || []
    };
  } catch (error) {
    console.error("调用 TMDB API 失败:", error);
    throw error;
  }
}

// 过滤函数：按类型筛选
function filterByType(items, targetType) {
  if (targetType === "all") return items;
  return items.filter(item => item.media_type === targetType);
}

// 获取导演作品
async function getDirectorWorks(params = {}) {
  try {
    const { personId, language, type } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { crew } = await fetchCredits(personId, language);
    
    // 筛选导演作品
    const directorWorks = crew.filter(item => 
      item.job?.toLowerCase().includes("director")
    );
    
    // 按类型筛选
    const filtered = filterByType(directorWorks, type);
    
    return filtered.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.release_date || movie.first_air_date,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.media_type === "tv" ? "tv" : "movie"
    }));
  } catch (error) {
    console.error("获取导演作品失败:", error);
    throw error;
  }
}

// 获取演员作品
async function getActorWorks(params = {}) {
  try {
    const { personId, language, type } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { cast } = await fetchCredits(personId, language);
    
    // 按类型筛选
    const filtered = filterByType(cast, type);
    
    return filtered.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.release_date || movie.first_air_date,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.media_type === "tv" ? "tv" : "movie"
    }));
  } catch (error) {
    console.error("获取演员作品失败:", error);
    throw error;
  }
}

// 获取其他作品（排除导演和演员）
async function getOtherWorks(params = {}) {
  try {
    const { personId, language, type } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { crew } = await fetchCredits(personId, language);
    
    // 排除导演和演员相关的作品
    const otherWorks = crew.filter(item => {
      const job = item.job?.toLowerCase();
      return !job.includes("director") && !job.includes("actor");
    });
    
    // 按类型筛选
    const filtered = filterByType(otherWorks, type);
    
    return filtered.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.release_date || movie.first_air_date,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.media_type === "tv" ? "tv" : "movie"
    }));
  } catch (error) {
    console.error("获取其他作品失败:", error);
    throw error;
  }
}

// 获取全部作品（合并演员和导演作品）
async function getAllWorks(params = {}) {
  try {
    const { personId, language, type } = params;
    if (!personId) throw new Error("缺少个人ID参数");
    
    const { cast, crew } = await fetchCredits(personId, language);
    
    // 合并数据并去重
    const allWorksMap = {};
    [...cast, ...crew].forEach(movie => {
      if (!allWorksMap[movie.id]) {
        allWorksMap[movie.id] = movie;
      }
    });
    
    // 按类型筛选
    const filtered = filterByType(Object.values(allWorksMap), type);
    
    return filtered.map(movie => ({
      id: movie.id,
      type: "tmdb",
      title: movie.title || movie.name,
      description: movie.overview,
      releaseDate: movie.release_date || movie.first_air_date,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      mediaType: movie.media_type === "tv" ? "tv" : "movie"
    }));
  } catch (error) {
    console.error("获取全部作品失败:", error);
    throw error;
  }
}
