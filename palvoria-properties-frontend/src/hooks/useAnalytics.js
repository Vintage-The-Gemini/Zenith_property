import { useEffect } from 'react';

// Google Analytics utility functions
export const gtag = (...args) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag(...args);
    }
  } catch (error) {
    console.warn('Google Analytics error:', error);
  }
};

// Track page views
export const trackPageView = (url, title) => {
  try {
    gtag('config', import.meta.env.VITE_GA_TRACKING_ID || 'GA_MEASUREMENT_ID', {
      page_title: title,
      page_location: url,
    });
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track events
export const trackEvent = (action, category = 'General', label = '', value = 0) => {
  try {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch (error) {
    console.warn('Analytics event tracking error:', error);
  }
};

// Track property views
export const trackPropertyView = (propertyId, propertyTitle, price, location) => {
  try {
    // Google Analytics event
    gtag('event', 'view_item', {
      currency: 'KES',
      value: price || 0,
      items: [{
        item_id: propertyId,
        item_name: propertyTitle,
        category: 'Property',
        location_id: location?.area || location?.city,
        price: price || 0
      }]
    });

    // Custom property view event
    gtag('event', 'property_view', {
      event_category: 'Property',
      event_label: propertyTitle,
      property_id: propertyId,
      property_price: price,
      property_location: `${location?.area}, ${location?.city}`,
    });
  } catch (error) {
    console.warn('Property view tracking error:', error);
  }
};

// Track property inquiries
export const trackPropertyInquiry = (propertyId, propertyTitle, inquiryType = 'general') => {
  gtag('event', 'generate_lead', {
    currency: 'KES',
    value: 1,
    event_category: 'Property',
    event_label: `${inquiryType}_inquiry`,
    property_id: propertyId,
    property_title: propertyTitle,
  });
};

// Track property shares
export const trackPropertyShare = (propertyId, propertyTitle, shareMethod) => {
  gtag('event', 'share', {
    method: shareMethod,
    content_type: 'property',
    item_id: propertyId,
    event_category: 'Property',
    event_label: `share_${shareMethod}`,
  });
};

// Track property favorites
export const trackPropertyFavorite = (propertyId, propertyTitle, action = 'add') => {
  gtag('event', action === 'add' ? 'add_to_wishlist' : 'remove_from_wishlist', {
    currency: 'KES',
    value: 1,
    items: [{
      item_id: propertyId,
      item_name: propertyTitle,
      category: 'Property'
    }]
  });
};

// Track search events
export const trackPropertySearch = (searchTerm, filters = {}, resultsCount = 0) => {
  gtag('event', 'search', {
    search_term: searchTerm,
    event_category: 'Property',
    event_label: 'property_search',
    results_count: resultsCount,
    ...filters
  });
};

// Track form submissions
export const trackFormSubmission = (formType, propertyId = null) => {
  gtag('event', 'form_submit', {
    event_category: 'Form',
    event_label: formType,
    property_id: propertyId,
  });
};

// Enhanced analytics hook
export const useAnalytics = () => {
  // Track page view on mount
  useEffect(() => {
    const url = window.location.href;
    const title = document.title;
    trackPageView(url, title);
  }, []);

  // Track time spent on page
  useEffect(() => {
    const startTime = Date.now();
    
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      gtag('event', 'timing_complete', {
        name: 'page_view_duration',
        value: timeSpent,
        event_category: 'Engagement',
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Track scroll depth
  useEffect(() => {
    let maxScroll = 0;
    const trackingIntervals = [25, 50, 75, 90, 100];
    const tracked = new Set();

    const handleScroll = () => {
      const scrolled = Math.floor((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      maxScroll = Math.max(maxScroll, scrolled);

      trackingIntervals.forEach(interval => {
        if (scrolled >= interval && !tracked.has(interval)) {
          tracked.add(interval);
          gtag('event', 'scroll', {
            event_category: 'Engagement',
            event_label: `${interval}%`,
            value: interval,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackPropertyView,
    trackPropertyInquiry,
    trackPropertyShare,
    trackPropertyFavorite,
    trackPropertySearch,
    trackFormSubmission,
  };
};

// Property-specific analytics hook
export const usePropertyAnalytics = (property) => {
  const analytics = useAnalytics();

  useEffect(() => {
    if (property) {
      // Track property view
      analytics.trackPropertyView(
        property._id,
        property.title,
        property.price?.amount,
        property.location
      );

      // Send view to backend for property analytics
      const trackView = async () => {
        try {
          const response = await fetch(`/api/properties/${property._id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
              referrer: document.referrer,
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight
              },
              device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
            }),
          });
          
          if (!response.ok) {
            console.warn('Failed to track property view on backend');
          }
        } catch (error) {
          console.warn('Error tracking property view:', error);
        }
      };

      trackView();
    }
  }, [property, analytics]);

  // Return property-specific tracking functions
  return {
    trackInquiry: (inquiryType) => 
      analytics.trackPropertyInquiry(property?._id, property?.title, inquiryType),
    
    trackShare: (method) => 
      analytics.trackPropertyShare(property?._id, property?.title, method),
    
    trackFavorite: (action) => 
      analytics.trackPropertyFavorite(property?._id, property?.title, action),
    
    trackContact: (method) => 
      analytics.trackEvent('contact_click', 'Property', `${method}_${property?._id}`),
    
    trackImageView: (imageIndex) => 
      analytics.trackEvent('image_view', 'Property', `image_${imageIndex}_${property?._id}`, imageIndex),
    
    trackSectionView: (section) => 
      analytics.trackEvent('section_view', 'Property', `${section}_${property?._id}`),
  };
};

export default useAnalytics;