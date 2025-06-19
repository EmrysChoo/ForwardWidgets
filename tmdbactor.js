var WidgetMetadata = {
  id: "actor_films_enhanced",
  title: "演员影视档案",
  version: "1.2.0",
  requiredVersion: "0.0.2",
  description: "获取演员详细信息及完整影视作品集",
  author: "YourName",
  site: "https://github.com/EmrysChoo/ForwardWidgets/new/main",
  modules: [{
    id: "actorProfile",
    title: "演员档案",
    functionName: "getActorProfile",
    params: [{
      name: "actorUrl",
      title: "演员主页URL",
      type: "url",
      description: "输入演员TMDB个人主页完整URL",
      value: "https://www.themoviedb.org/person/123456",
      pattern: "^https://www\\.themoviedb\\.org/person/\\d+/?$",
      placeholder: "https://www.themoviedb.org/person/123456"
    }]
  }]
};

// 缓存管理
const cache = new Map();
const CACHE_TTL = 3600; // 缓存有效期1小时

async function getActorProfile(params) {
  try {
    const personId = extractPersonId(params.actorUrl);
    const cacheKey = `actor_${personId}`;
    
    // 检查缓存
    if (cache.has(cacheKey)) {
      const data = cache.get(cacheKey);
      if (Date.now() - data.timestamp < CACHE_TTL) {
        return data.value;
      }
    }

    // 获取演员详情
    const profile = await fetchActorDetails(personId);
    
    // 获取作品列表
    const filmography = await fetchFilmography(personId);
    
    // 组合数据
    const result = {
      profile,
      filmography,
      lastUpdated: Date.now()
    };

    // 写入缓存
    cache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error("获取演员档案失败:", error.message);
    throw error;
  }
}

async function fetchActorDetails(personId) {
  const url = `person/${personId}`;
  const response = await Widget.tmdb.get(url);
  
  if (!response) throw new Error("演员信息获取失败");
  
  return {
    id: personId,
    name: response.name,
    biography: response.biography,
    profilePath: response.profile_path,
    popularity: response.popularity,
    birthday: response.birthday,
    deathday: response.deathday || null,
    placeOfBirth: response.place_of_birth,
    genrePreferences: response.known_for_department
  };
}

async function fetchFilmography(personId) {
  const url = `person/${personId}/movie_credits`;
  const response = await Widget.tmdb.get(url, {
    params: { language: "zh-CN" }
  });

  return response.cast.map(item => ({
    id: `tmdb.${item.media_type}.${item.id}`,
    type: "tmdb",
    title: item.title || item.name,
    posterPath: item.poster_path,
    releaseDate: item.release_date || item.first_air_date,
    rating: item.vote_average,
    mediaType: item.media_type,
    role: item.character,
    overview: item.overview
  }));
}

function extractPersonId(url) {
  const regex = /\/person\/(\d+)\/?$/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error("无效的演员主页URL格式");
  }
  
  return match[1];
}
