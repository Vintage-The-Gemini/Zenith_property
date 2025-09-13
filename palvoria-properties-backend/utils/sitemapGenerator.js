const Property = require('../models/Property');

class SitemapGenerator {
  constructor(baseUrl = 'https://www.palvoria.com') {
    this.baseUrl = baseUrl;
  }

  async generateSitemap() {
    try {
      const staticPages = [
        { url: '/', priority: 1.0, changefreq: 'weekly' },
        { url: '/properties', priority: 0.9, changefreq: 'daily' },
        { url: '/contact', priority: 0.8, changefreq: 'monthly' },
        { url: '/about', priority: 0.7, changefreq: 'monthly' }
      ];

      // Get all active properties
      const properties = await Property.find({ status: 'active' })
        .select('_id slug title updatedAt category location')
        .lean();

      const propertyPages = properties.map(property => ({
        url: `/properties/${property._id}`,
        priority: 0.8,
        changefreq: 'weekly',
        lastmod: property.updatedAt
      }));

      // Combine all URLs
      const allPages = [...staticPages, ...propertyPages];

      // Generate XML
      const sitemap = this.generateSitemapXML(allPages);

      return sitemap;
    } catch (error) {
      console.error('Error generating sitemap:', error);
      throw error;
    }
  }

  generateSitemapXML(pages) {
    const urls = pages.map(page => {
      const lastmod = page.lastmod ?
        `<lastmod>${new Date(page.lastmod).toISOString()}</lastmod>` : '';

      return `
    <url>
      <loc>${this.baseUrl}${page.url}</loc>
      <priority>${page.priority}</priority>
      <changefreq>${page.changefreq}</changefreq>
      ${lastmod}
    </url>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
  }
}

module.exports = SitemapGenerator;