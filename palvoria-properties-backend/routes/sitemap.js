const express = require('express');
const SitemapGenerator = require('../utils/sitemapGenerator');

const router = express.Router();

// Generate and serve sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const generator = new SitemapGenerator();
    const sitemap = await generator.generateSitemap();

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;