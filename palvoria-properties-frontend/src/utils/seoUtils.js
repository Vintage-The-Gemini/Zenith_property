// SEO utilities for property management
export const SEOUtils = {
  // Generate optimized meta title
  generateMetaTitle: (property) => {
    const { title, propertyType, category, location, price, features } = property;
    const area = location?.area === 'Other' ? location?.customArea : location?.area;
    
    // Template variations based on property type
    const templates = [
      `${features?.bedrooms || 'Spacious'} Bedroom ${propertyType} for ${category} in ${area}`,
      `${propertyType} for ${category} in ${area} - ${price?.currency} ${price?.amount?.toLocaleString()}`,
      `Premium ${propertyType} in ${area} | ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      `${area} ${propertyType} for ${category} | ${features?.bedrooms || 'Multi'} BR`,
    ];
    
    // Choose best template that fits within 60 characters
    for (const template of templates) {
      if (template.length <= 60) {
        return template;
      }
    }
    
    // Fallback - truncate the first template
    return templates[0].substring(0, 57) + '...';
  },

  // Generate optimized meta description
  generateMetaDescription: (property) => {
    const { description, propertyType, category, location, price, features, amenities } = property;
    const area = location?.area === 'Other' ? location?.customArea : location?.area;
    
    const highlights = [];
    
    // Add key features
    if (features?.bedrooms) highlights.push(`${features.bedrooms} bedroom`);
    if (features?.bathrooms) highlights.push(`${features.bathrooms} bathroom`);
    if (features?.area?.size) highlights.push(`${features.area.size}${features.area.unit}`);
    if (features?.parking) highlights.push(`${features.parking} parking`);
    
    // Add key amenities
    const topAmenities = amenities?.slice(0, 3)?.map(a => a.name) || [];
    
    // Construct description
    let metaDesc = `${highlights.join(', ')} ${propertyType} for ${category} in ${area}, ${location?.city}.`;
    
    if (topAmenities.length > 0) {
      metaDesc += ` Features: ${topAmenities.join(', ')}.`;
    }
    
    if (price?.amount) {
      metaDesc += ` ${price.currency} ${price.amount.toLocaleString()}`;
      if (price.period !== 'one-time') metaDesc += `/${price.period}`;
      metaDesc += '.';
    }
    
    // Add CTA
    metaDesc += ' Contact us for viewing.';
    
    // Ensure it fits within 160 characters
    if (metaDesc.length > 160) {
      const words = metaDesc.split(' ');
      let truncated = '';
      for (const word of words) {
        if ((truncated + word + ' ').length <= 157) {
          truncated += word + ' ';
        } else {
          break;
        }
      }
      metaDesc = truncated.trim() + '...';
    }
    
    return metaDesc;
  },

  // Generate SEO-friendly slug
  generateSlug: (property) => {
    const { propertyType, category, location, features, _id } = property;
    const area = location?.area === 'Other' ? location?.customArea : location?.area;
    
    const slugParts = [
      propertyType,
      category,
      area?.toLowerCase(),
      features?.bedrooms ? `${features.bedrooms}br` : null,
      _id?.slice(-6) // Last 6 chars of ID for uniqueness
    ].filter(Boolean);
    
    return slugParts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },

  // Generate keywords
  generateKeywords: (property) => {
    const { propertyType, category, location, features, amenities } = property;
    const area = location?.area === 'Other' ? location?.customArea : location?.area;
    
    const keywords = new Set([
      // Primary keywords
      propertyType,
      category,
      area?.toLowerCase(),
      location?.city?.toLowerCase(),
      
      // Combinations
      `${propertyType} ${category}`,
      `${area?.toLowerCase()} ${propertyType}`,
      `${propertyType} in ${area?.toLowerCase()}`,
      `${location?.city?.toLowerCase()} ${propertyType}`,
      
      // Feature-based keywords
      features?.bedrooms ? `${features.bedrooms} bedroom ${propertyType}` : null,
      features?.bathrooms ? `${features.bathrooms} bathroom` : null,
      
      // General real estate keywords
      'property',
      'real estate',
      'kenya property',
      `${location?.city?.toLowerCase()} property`,
      
      // Amenity-based keywords
      ...(amenities?.slice(0, 5)?.map(a => a.name?.toLowerCase()) || []),
      
      // Long-tail keywords
      `${propertyType} for ${category} in ${area?.toLowerCase()}`,
      `best ${propertyType} in ${area?.toLowerCase()}`,
      `affordable ${propertyType} ${location?.city?.toLowerCase()}`,
    ]);
    
    return Array.from(keywords).filter(Boolean).slice(0, 10);
  },

  // Generate focus keyword
  generateFocusKeyword: (property) => {
    const { propertyType, category, location } = property;
    const area = location?.area === 'Other' ? location?.customArea : location?.area;
    
    return `${propertyType} for ${category} in ${area}`.toLowerCase();
  },

  // Generate structured data
  generateStructuredData: (property, seo, baseUrl = 'https://www.palvoria.com') => {
    const area = property.location?.area === 'Other' ? property.location?.customArea : property.location?.area;
    
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": seo?.metaTitle || property.title,
      "description": seo?.metaDescription,
      "url": `${baseUrl}/property/${seo?.slug || property._id}`,
      "identifier": property._id,
      "datePosted": property.createdAt,
      "validThrough": property.availability?.availableFrom,
      
      "address": {
        "@type": "PostalAddress",
        "streetAddress": property.location?.address,
        "addressLocality": area,
        "addressRegion": property.location?.county,
        "addressCountry": "Kenya"
      },
      
      "geo": property.location?.coordinates ? {
        "@type": "GeoCoordinates",
        "latitude": property.location.coordinates.latitude,
        "longitude": property.location.coordinates.longitude
      } : undefined,
      
      "floorSize": property.features?.area ? {
        "@type": "QuantitativeValue",
        "value": property.features.area.size,
        "unitCode": property.features.area.unit?.toUpperCase()
      } : undefined,
      
      "numberOfRooms": property.features?.bedrooms,
      "numberOfBedrooms": property.features?.bedrooms,
      "numberOfBathroomsTotal": property.features?.bathrooms,
      "yearBuilt": property.yearBuilt,
      
      "offers": {
        "@type": "Offer",
        "price": property.price?.amount,
        "priceCurrency": property.price?.currency || "KES",
        "availability": property.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "validFrom": property.createdAt,
        
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": property.price?.amount,
          "priceCurrency": property.price?.currency || "KES",
          "unitText": property.price?.period === 'month' ? "per month" : 
                      property.price?.period === 'year' ? "per year" : undefined
        }
      },
      
      "image": property.images?.map(img => img.url) || [],
      "photo": property.images?.map(img => ({
        "@type": "ImageObject",
        "url": img.url,
        "caption": img.caption
      })) || [],
      
      "category": property.category === 'sale' ? 'Property for Sale' : 'Property for Rent',
      
      "amenityFeature": property.amenities?.map(amenity => ({
        "@type": "LocationFeatureSpecification",
        "name": amenity.name,
        "value": true
      })) || [],
      
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Property Type",
          "value": property.propertyType
        },
        {
          "@type": "PropertyValue", 
          "name": "Furnishing",
          "value": property.furnishing
        },
        {
          "@type": "PropertyValue",
          "name": "Condition", 
          "value": property.condition
        }
      ].filter(prop => prop.value),
      
      "potentialAction": {
        "@type": "ContactAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/contact?property=${property._id}`,
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform"
          ]
        },
        "name": "Contact about this property"
      }
    };
  },

  // Calculate SEO score
  calculateSEOScore: (property, seo) => {
    let score = 0;
    const issues = [];
    
    // Meta title (25 points max)
    if (seo?.metaTitle) {
      score += 10;
      if (seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60) {
        score += 15;
      } else if (seo.metaTitle.length > 60) {
        issues.push('Meta title exceeds 60 characters');
      } else if (seo.metaTitle.length < 30) {
        issues.push('Meta title is too short');
      }
    } else {
      issues.push('Meta title is missing');
    }
    
    // Meta description (25 points max)
    if (seo?.metaDescription) {
      score += 10;
      if (seo.metaDescription.length >= 120 && seo.metaDescription.length <= 160) {
        score += 15;
      } else if (seo.metaDescription.length > 160) {
        issues.push('Meta description exceeds 160 characters');
      } else if (seo.metaDescription.length < 120) {
        issues.push('Meta description could be longer');
      }
    } else {
      issues.push('Meta description is missing');
    }
    
    // Focus keyword (20 points max)
    if (seo?.focusKeyword) {
      score += 5;
      const titleHasKeyword = seo.metaTitle?.toLowerCase().includes(seo.focusKeyword.toLowerCase());
      const descHasKeyword = seo.metaDescription?.toLowerCase().includes(seo.focusKeyword.toLowerCase());
      
      if (titleHasKeyword && descHasKeyword) {
        score += 15;
      } else if (titleHasKeyword || descHasKeyword) {
        score += 10;
        issues.push('Focus keyword should appear in both title and description');
      } else {
        issues.push('Focus keyword not found in title or description');
      }
    } else {
      issues.push('Focus keyword is missing');
    }
    
    // Keywords (10 points max)
    if (seo?.keywords?.length > 0) {
      score += 5;
      if (seo.keywords.length <= 10) {
        score += 5;
      } else {
        issues.push('Too many keywords (max 10 recommended)');
      }
    } else {
      issues.push('No keywords defined');
    }
    
    // URL slug (10 points max)
    if (seo?.slug) {
      score += 5;
      if (!seo.slug.includes(' ') && seo.slug.length > 10) {
        score += 5;
      } else {
        issues.push('URL slug should be longer and contain no spaces');
      }
    } else {
      issues.push('URL slug is missing');
    }
    
    // Social media tags (10 points max)
    if (seo?.ogTitle && seo?.ogDescription) {
      score += 5;
    } else {
      issues.push('Open Graph tags incomplete');
    }
    
    if (seo?.twitterTitle && seo?.twitterDescription) {
      score += 5;
    }
    
    return { score, issues };
  },

  // Generate canonical URL
  generateCanonicalUrl: (property, seo, baseUrl = 'https://www.palvoria.com') => {
    const slug = seo?.slug || SEOUtils.generateSlug(property);
    return `${baseUrl}/property/${slug}`;
  },

  // Generate Open Graph data
  generateOpenGraphData: (property, seo, baseUrl = 'https://www.palvoria.com') => {
    const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
    
    return {
      ogTitle: seo?.ogTitle || seo?.metaTitle || property.title,
      ogDescription: seo?.ogDescription || seo?.metaDescription,
      ogImage: seo?.ogImage || primaryImage?.url,
      ogUrl: SEOUtils.generateCanonicalUrl(property, seo, baseUrl),
      ogType: 'website',
      ogSiteName: 'Palvoria Properties'
    };
  },

  // Generate Twitter Card data
  generateTwitterCardData: (property, seo, baseUrl = 'https://www.palvoria.com') => {
    const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
    
    return {
      twitterCard: 'summary_large_image',
      twitterTitle: seo?.twitterTitle || seo?.metaTitle || property.title,
      twitterDescription: seo?.twitterDescription || seo?.metaDescription,
      twitterImage: seo?.twitterImage || primaryImage?.url,
      twitterSite: '@PalvoriaKE',
      twitterCreator: '@PalvoriaKE'
    };
  }
};

export default SEOUtils;