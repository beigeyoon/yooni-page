module.exports = {
  siteUrl: 'https://yooni.seoul.kr',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/editor'],
  additionalPaths: async (config) => {
    // 여기서 동적으로 포스트 URL들을 추가할 수 있습니다
    // 실제 구현에서는 데이터베이스에서 포스트 목록을 가져와야 합니다
    return [];
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/editor', '/api/*'],
      },
    ],
    additionalSitemaps: [
      'https://yooni.seoul.kr/sitemap.xml',
    ],
  },
};