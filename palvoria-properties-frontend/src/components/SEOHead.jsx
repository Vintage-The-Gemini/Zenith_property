import React, { useEffect } from 'react';
import SEOUtils from '../utils/seoUtils';

const SEOHead = ({ 
  property, 
  seo, 
  pageType = 'property', 
  customTitle,
  customDescription,
  customKeywords = [],
  noIndex = false
}) => {
  // Generate SEO data if not provided
  const metaTitle = seo?.metaTitle || customTitle || (property ? SEOUtils.generateMetaTitle(property) : 'Palvoria Properties');
  const metaDescription = seo?.metaDescription || customDescription || (property ? SEOUtils.generateMetaDescription(property) : 'Find your dream property in Kenya with Palvoria Properties');
  const keywords = seo?.keywords || customKeywords || (property ? SEOUtils.generateKeywords(property) : ['real estate', 'property', 'kenya']);
  const canonicalUrl = seo?.canonicalUrl || (property ? SEOUtils.generateCanonicalUrl(property, seo) : 'https://www.palvoria.com');

  // Open Graph data
  const ogData = property ? SEOUtils.generateOpenGraphData(property, seo) : {
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: '/images/og-default.jpg',
    ogUrl: canonicalUrl,
    ogType: 'website',
    ogSiteName: 'Palvoria Properties'
  };

  // Twitter Card data
  const twitterData = property ? SEOUtils.generateTwitterCardData(property, seo) : {
    twitterCard: 'summary_large_image',
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    twitterImage: '/images/twitter-default.jpg',
    twitterSite: '@PalvoriaKE',
    twitterCreator: '@PalvoriaKE'
  };

  // Structured Data
  const structuredData = property ? SEOUtils.generateStructuredData(property, seo) : null;

  // Update document head using useEffect
  useEffect(() => {
    // Update title
    document.title = metaTitle;

    // Helper function to set or update meta tags
    const setMetaTag = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper function to set or update link tags
    const setLinkTag = (rel, href, attributes = {}) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    };

    try {
      // Basic Meta Tags
      setMetaTag('description', metaDescription);
      setMetaTag('keywords', keywords.join(', '));
      setLinkTag('canonical', canonicalUrl);

      // Robots meta
      setMetaTag('robots', noIndex ? 'noindex,nofollow' : 'index,follow');

      // Open Graph Tags
      setMetaTag('og:title', ogData.ogTitle, true);
      setMetaTag('og:description', ogData.ogDescription, true);
      setMetaTag('og:image', ogData.ogImage, true);
      setMetaTag('og:url', ogData.ogUrl, true);
      setMetaTag('og:type', ogData.ogType, true);
      setMetaTag('og:site_name', ogData.ogSiteName, true);
      setMetaTag('og:locale', 'en_US', true);

      // Twitter Card Tags
      setMetaTag('twitter:card', twitterData.twitterCard);
      setMetaTag('twitter:title', twitterData.twitterTitle);
      setMetaTag('twitter:description', twitterData.twitterDescription);
      setMetaTag('twitter:image', twitterData.twitterImage);
      setMetaTag('twitter:site', twitterData.twitterSite);
      setMetaTag('twitter:creator', twitterData.twitterCreator);

      // Property-specific Twitter data
      if (property) {
        setMetaTag('twitter:label1', 'Price');
        setMetaTag('twitter:data1', `${property.price?.currency} ${property.price?.amount?.toLocaleString()}`);
        setMetaTag('twitter:label2', 'Bedrooms');
        setMetaTag('twitter:data2', property.features?.bedrooms || 'N/A');
      }

      // Property-specific meta tags
      if (property && pageType === 'property') {
        const area = property.location?.area === 'Other' ? property.location?.customArea : property.location?.area;
        
        setMetaTag('geo.region', 'KE');
        if (area && property.location?.city) {
          setMetaTag('geo.placename', `${area}, ${property.location.city}`);
        }
        
        if (property.location?.coordinates) {
          setMetaTag('ICBM', `${property.location.coordinates.latitude}, ${property.location.coordinates.longitude}`);
          setMetaTag('geo.position', `${property.location.coordinates.latitude};${property.location.coordinates.longitude}`);
        }

        if (property.location?.address) {
          setMetaTag('business:contact_data:street_address', property.location.address, true);
        }
        if (property.location?.city) {
          setMetaTag('business:contact_data:locality', property.location.city, true);
        }
        if (property.location?.county) {
          setMetaTag('business:contact_data:region', property.location.county, true);
        }
        setMetaTag('business:contact_data:country_name', 'Kenya', true);
        
        if (property.price?.amount) {
          setMetaTag('product:price:amount', property.price.amount.toString(), true);
          setMetaTag('product:price:currency', property.price.currency || 'KES', true);
        }

        if (property.propertyType) {
          setMetaTag('property:type', property.propertyType);
        }

        if (property.features?.bedrooms) {
          setMetaTag('property:bedrooms', property.features.bedrooms.toString());
        }

        if (property.features?.bathrooms) {
          setMetaTag('property:bathrooms', property.features.bathrooms.toString());
        }

        setMetaTag('product:availability', property.status === 'active' ? 'in stock' : 'out of stock', true);
      }

      // Structured Data
      if (structuredData) {
        let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        if (!jsonLdScript) {
          jsonLdScript = document.createElement('script');
          jsonLdScript.type = 'application/ld+json';
          document.head.appendChild(jsonLdScript);
        }
        jsonLdScript.textContent = JSON.stringify(structuredData);
      }

      // Theme and mobile app meta tags
      setMetaTag('theme-color', '#f59e0b');
      setMetaTag('msapplication-TileColor', '#f59e0b');
      setMetaTag('apple-mobile-web-app-capable', 'yes');
      setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
      setMetaTag('apple-mobile-web-app-title', 'Palvoria Properties');

      // Preconnect to external resources
      setLinkTag('preconnect', 'https://fonts.googleapis.com');
      setLinkTag('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });

      // Sitemap
      setLinkTag('sitemap', '/sitemap.xml', { type: 'application/xml' });

      // Property image preloading
      if (property?.images?.length > 0) {
        property.images.slice(0, 2).forEach((image, index) => {
          const linkElement = document.createElement('link');
          linkElement.rel = 'preload';
          linkElement.as = 'image';
          linkElement.href = image.url;
          if (index === 0) {
            linkElement.fetchPriority = 'high';
          }
          document.head.appendChild(linkElement);
        });
      }

    } catch (error) {
      console.warn('Error setting SEO meta tags:', error);
    }

    // Cleanup function (optional)
    return () => {
      // Cleanup is usually not necessary for meta tags
      // as they don't cause memory leaks
    };
  }, [
    metaTitle,
    metaDescription,
    keywords,
    canonicalUrl,
    ogData.ogTitle,
    ogData.ogDescription,
    ogData.ogImage,
    twitterData.twitterTitle,
    twitterData.twitterDescription,
    property?._id,
    structuredData,
    pageType,
    noIndex
  ]);

  // This component doesn't render anything visible
  return null;
};

export default SEOHead;