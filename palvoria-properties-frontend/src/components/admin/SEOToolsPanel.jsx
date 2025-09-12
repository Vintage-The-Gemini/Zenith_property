import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  LinkIcon,
  DocumentTextIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

const SEOToolsPanel = ({ property, seo, onRecommendationsUpdate }) => {
  const [toolsData, setToolsData] = useState({
    pageSpeed: { score: 0, loading: true },
    keywordAnalysis: { difficulty: 0, volume: 0, loading: true },
    backlinks: { count: 0, quality: 0, loading: true },
    socialMetrics: { shares: 0, likes: 0, loading: true },
    competitors: [],
    technicalSEO: { issues: [], score: 0 }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [recommendations, setRecommendations] = useState([]);

  // Free SEO APIs Integration
  useEffect(() => {
    const fetchSEOData = async () => {
      if (!property || !seo) return;

      const url = `https://www.palvoria.com/property/${seo.slug}`;
      
      try {
        // 1. Google PageSpeed Insights (Free)
        await fetchPageSpeedData(url);
        
        // 2. Keyword Analysis (Free tier from various APIs)
        await fetchKeywordData(seo.focusKeyword);
        
        // 3. Social Media Metrics (Free APIs)
        await fetchSocialMetrics(url);
        
        // 4. Technical SEO Analysis
        await performTechnicalSEOAudit();
        
        // 5. Generate comprehensive recommendations
        generateRecommendations();
        
      } catch (error) {
        console.error('Error fetching SEO data:', error);
        // Use mock data for development
        setMockData();
      }
    };

    fetchSEOData();
  }, [property, seo]);

  // Google PageSpeed Insights API (Free)
  const fetchPageSpeedData = async (url) => {
    try {
      // Note: Replace with your Google PageSpeed API key
      const API_KEY = import.meta.env.VITE_GOOGLE_PAGESPEED_API_KEY || 'demo';
      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}&strategy=mobile`
      );
      
      if (response.ok) {
        const data = await response.json();
        const score = Math.round(data.lighthouseResult.categories.performance.score * 100);
        
        setToolsData(prev => ({
          ...prev,
          pageSpeed: {
            score,
            loading: false,
            metrics: {
              fcp: data.lighthouseResult.audits['first-contentful-paint']?.displayValue,
              lcp: data.lighthouseResult.audits['largest-contentful-paint']?.displayValue,
              cls: data.lighthouseResult.audits['cumulative-layout-shift']?.displayValue,
              fid: data.lighthouseResult.audits['first-input-delay']?.displayValue
            },
            opportunities: data.lighthouseResult.audits.diagnostics?.details?.items || []
          }
        }));
      }
    } catch (error) {
      console.error('PageSpeed API error:', error);
      setToolsData(prev => ({
        ...prev,
        pageSpeed: { score: 85, loading: false, metrics: {} }
      }));
    }
  };

  // Free Keyword Analysis APIs
  const fetchKeywordData = async (keyword) => {
    try {
      // Using free tier APIs like KeywordTool.io API or DataForSEO free tier
      // Note: Replace with actual API endpoints and keys
      
      // Mock implementation - replace with real API calls
      const mockKeywordData = {
        difficulty: Math.floor(Math.random() * 100),
        volume: Math.floor(Math.random() * 10000) + 1000,
        cpc: (Math.random() * 5 + 0.5).toFixed(2),
        competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        trends: generateTrendData(),
        relatedKeywords: generateRelatedKeywords(keyword),
        loading: false
      };
      
      setToolsData(prev => ({
        ...prev,
        keywordAnalysis: mockKeywordData
      }));
    } catch (error) {
      console.error('Keyword analysis error:', error);
    }
  };

  // Social Media Metrics (Free APIs)
  const fetchSocialMetrics = async (url) => {
    try {
      // Using APIs like SharedCount.com (free tier) or similar
      // Note: Many social APIs have become restricted, using approximations
      
      const mockSocialData = {
        facebook: Math.floor(Math.random() * 100),
        twitter: Math.floor(Math.random() * 50),
        linkedin: Math.floor(Math.random() * 30),
        pinterest: Math.floor(Math.random() * 20),
        total: 0,
        loading: false
      };
      
      mockSocialData.total = Object.values(mockSocialData).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0
      );
      
      setToolsData(prev => ({
        ...prev,
        socialMetrics: mockSocialData
      }));
    } catch (error) {
      console.error('Social metrics error:', error);
    }
  };

  // Technical SEO Audit
  const performTechnicalSEOAudit = () => {
    const issues = [];
    let score = 100;
    
    // Check meta title length
    if (!seo?.metaTitle || seo.metaTitle.length === 0) {
      issues.push({
        type: 'error',
        title: 'Missing Meta Title',
        description: 'Page is missing a meta title tag',
        impact: 'High',
        fix: 'Add a compelling meta title (50-60 characters)'
      });
      score -= 20;
    } else if (seo.metaTitle.length > 60) {
      issues.push({
        type: 'warning',
        title: 'Meta Title Too Long',
        description: 'Meta title exceeds recommended 60 characters',
        impact: 'Medium',
        fix: 'Shorten meta title to under 60 characters'
      });
      score -= 10;
    }
    
    // Check meta description
    if (!seo?.metaDescription || seo.metaDescription.length === 0) {
      issues.push({
        type: 'error',
        title: 'Missing Meta Description',
        description: 'Page is missing a meta description',
        impact: 'High',
        fix: 'Add a compelling meta description (120-160 characters)'
      });
      score -= 15;
    }
    
    // Check keywords
    if (!seo?.keywords || seo.keywords.length === 0) {
      issues.push({
        type: 'warning',
        title: 'No Keywords Defined',
        description: 'No target keywords specified',
        impact: 'Medium',
        fix: 'Add relevant target keywords for this property'
      });
      score -= 10;
    }
    
    // Check images
    if (!property?.images || property.images.length === 0) {
      issues.push({
        type: 'error',
        title: 'Missing Images',
        description: 'Property has no images',
        impact: 'High',
        fix: 'Add high-quality property images with alt text'
      });
      score -= 25;
    } else {
      // Check for alt text (simulated)
      issues.push({
        type: 'info',
        title: 'Image Optimization',
        description: 'Ensure all images have descriptive alt text',
        impact: 'Low',
        fix: 'Add descriptive alt text to all property images'
      });
    }
    
    // Check structured data
    if (!seo?.structuredData) {
      issues.push({
        type: 'warning',
        title: 'Missing Structured Data',
        description: 'Property lacks structured data markup',
        impact: 'Medium',
        fix: 'Add JSON-LD structured data for better search visibility'
      });
      score -= 15;
    }
    
    setToolsData(prev => ({
      ...prev,
      technicalSEO: {
        issues,
        score: Math.max(0, score),
        loading: false
      }
    }));
  };

  // Generate SEO Recommendations
  const generateRecommendations = () => {
    const recs = [];
    
    // Title optimization
    if (seo?.metaTitle && seo.metaTitle.length < 50) {
      recs.push({
        priority: 'high',
        category: 'Content',
        title: 'Expand Meta Title',
        description: 'Your meta title is shorter than optimal. Consider adding location or price information.',
        action: 'Expand title to 50-60 characters for better visibility'
      });
    }
    
    // Keyword density
    if (property?.description && seo?.focusKeyword) {
      const density = calculateKeywordDensity(property.description, seo.focusKeyword);
      if (density < 0.5) {
        recs.push({
          priority: 'medium',
          category: 'Content',
          title: 'Increase Keyword Density',
          description: `Focus keyword "${seo.focusKeyword}" appears ${density.toFixed(2)}% in content.`,
          action: 'Naturally include your focus keyword 2-3 times in the description'
        });
      }
    }
    
    // Image optimization
    if (property?.images && property.images.length < 5) {
      recs.push({
        priority: 'high',
        category: 'Media',
        title: 'Add More Images',
        description: 'Properties with 5+ high-quality images get 3x more views.',
        action: 'Add exterior, interior, and neighborhood photos'
      });
    }
    
    // Local SEO
    if (!property?.location?.coordinates) {
      recs.push({
        priority: 'medium',
        category: 'Local SEO',
        title: 'Add GPS Coordinates',
        description: 'Location coordinates improve local search visibility.',
        action: 'Add latitude and longitude coordinates for this property'
      });
    }
    
    // Social sharing
    recs.push({
      priority: 'low',
      category: 'Social',
      title: 'Optimize Social Sharing',
      description: 'Well-optimized social tags increase shares by 40%.',
      action: 'Ensure Open Graph and Twitter Card tags are properly configured'
    });
    
    setRecommendations(recs);
    onRecommendationsUpdate?.(recs);
  };

  // Helper functions
  const generateTrendData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      volume: Math.floor(Math.random() * 1000) + 500
    }));
  };

  const generateRelatedKeywords = (baseKeyword) => {
    const base = baseKeyword.toLowerCase();
    const variations = [
      `best ${base}`,
      `${base} price`,
      `${base} near me`,
      `affordable ${base}`,
      `luxury ${base}`,
      `${base} for families`,
      `${base} with parking`,
      `${base} 2024`
    ];
    
    return variations.map(keyword => ({
      keyword,
      volume: Math.floor(Math.random() * 1000) + 100,
      difficulty: Math.floor(Math.random() * 100),
      cpc: (Math.random() * 3 + 0.2).toFixed(2)
    }));
  };

  const calculateKeywordDensity = (text, keyword) => {
    if (!text || !keyword) return 0;
    const words = text.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    let matches = 0;
    
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const slice = words.slice(i, i + keywordWords.length);
      if (slice.join(' ') === keywordWords.join(' ')) {
        matches++;
      }
    }
    
    return (matches / words.length) * 100;
  };

  const setMockData = () => {
    setToolsData({
      pageSpeed: {
        score: 87,
        loading: false,
        metrics: {
          fcp: '1.2s',
          lcp: '2.1s',
          cls: '0.05',
          fid: '12ms'
        }
      },
      keywordAnalysis: {
        difficulty: 65,
        volume: 3400,
        cpc: '2.45',
        competition: 'Medium',
        loading: false,
        trends: generateTrendData(),
        relatedKeywords: generateRelatedKeywords(seo?.focusKeyword || 'property')
      },
      socialMetrics: {
        facebook: 45,
        twitter: 23,
        linkedin: 12,
        pinterest: 8,
        total: 88,
        loading: false
      },
      technicalSEO: {
        score: 82,
        issues: [],
        loading: false
      }
    });
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">SEO Tools & Analysis</h3>
        <button
          onClick={() => window.open('https://search.google.com/search-console', '_blank')}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <GlobeAltIcon className="h-4 w-4" />
          <span>Open Search Console</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <TabButton id="overview" label="Overview" icon={ChartBarIcon} />
        <TabButton id="keywords" label="Keywords" icon={MagnifyingGlassIcon} />
        <TabButton id="performance" label="Performance" icon={CursorArrowRaysIcon} />
        <TabButton id="social" label="Social" icon={StarIcon} />
        <TabButton id="technical" label="Technical" icon={DocumentTextIcon} />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">SEO Score</p>
                  <p className="text-2xl font-bold">{toolsData.technicalSEO.score}/100</p>
                </div>
                <ChartBarIcon className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Page Speed</p>
                  <p className="text-2xl font-bold">{toolsData.pageSpeed.score}</p>
                </div>
                <ClockIcon className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Keyword Volume</p>
                  <p className="text-2xl font-bold">{toolsData.keywordAnalysis.volume?.toLocaleString()}</p>
                </div>
                <MagnifyingGlassIcon className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Social Shares</p>
                  <p className="text-2xl font-bold">{toolsData.socialMetrics.total}</p>
                </div>
                <StarIcon className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Focus Keyword Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{toolsData.keywordAnalysis.volume?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Search Volume</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{toolsData.keywordAnalysis.difficulty}</p>
                  <p className="text-sm text-gray-600">Difficulty</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${toolsData.keywordAnalysis.cpc}</p>
                  <p className="text-sm text-gray-600">CPC</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{toolsData.keywordAnalysis.competition}</p>
                  <p className="text-sm text-gray-600">Competition</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Related Keywords</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Keyword</th>
                      <th className="text-left py-2">Volume</th>
                      <th className="text-left py-2">Difficulty</th>
                      <th className="text-left py-2">CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolsData.keywordAnalysis.relatedKeywords?.slice(0, 8).map((kw, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{kw.keyword}</td>
                        <td className="py-2 text-gray-600">{kw.volume.toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            kw.difficulty < 30 ? 'bg-green-100 text-green-800' :
                            kw.difficulty < 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {kw.difficulty}
                          </span>
                        </td>
                        <td className="py-2 text-gray-600">${kw.cpc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Core Web Vitals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {toolsData.pageSpeed.metrics && Object.entries(toolsData.pageSpeed.metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-lg font-bold text-blue-600">{value}</p>
                    <p className="text-sm text-gray-600">{key.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Performance Score</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      toolsData.pageSpeed.score >= 90 ? 'bg-green-500' :
                      toolsData.pageSpeed.score >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${toolsData.pageSpeed.score}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold">{toolsData.pageSpeed.score}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(toolsData.socialMetrics).filter(([key]) => key !== 'total' && key !== 'loading').map(([platform, count]) => (
                <div key={platform} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{platform}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Social Media Optimization Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use high-quality images (1200x630px for Facebook)</li>
                <li>• Write compelling Open Graph descriptions</li>
                <li>• Include property price in social titles</li>
                <li>• Use location-based hashtags</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Technical SEO Issues</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                toolsData.technicalSEO.score >= 80 ? 'bg-green-100 text-green-800' :
                toolsData.technicalSEO.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Score: {toolsData.technicalSEO.score}/100
              </span>
            </div>

            <div className="space-y-3">
              {toolsData.technicalSEO.issues.length === 0 ? (
                <div className="bg-green-50 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Great! No critical issues found.</p>
                    <p className="text-sm text-green-700">Your property's technical SEO looks good.</p>
                  </div>
                </div>
              ) : (
                toolsData.technicalSEO.issues.map((issue, index) => (
                  <div key={index} className={`rounded-lg p-4 flex items-start space-x-3 ${
                    issue.type === 'error' ? 'bg-red-50' :
                    issue.type === 'warning' ? 'bg-yellow-50' :
                    'bg-blue-50'
                  }`}>
                    {issue.type === 'error' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        issue.type === 'error' ? 'text-red-900' :
                        issue.type === 'warning' ? 'text-yellow-900' :
                        'text-blue-900'
                      }`}>
                        {issue.title}
                      </p>
                      <p className={`text-sm ${
                        issue.type === 'error' ? 'text-red-700' :
                        issue.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {issue.description}
                      </p>
                      <p className={`text-sm font-medium mt-1 ${
                        issue.type === 'error' ? 'text-red-800' :
                        issue.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        Fix: {issue.fix}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">SEO Recommendations</h4>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                      </span>
                      <span className="text-xs text-gray-600">{rec.category}</span>
                    </div>
                    <p className="font-medium text-gray-900">{rec.title}</p>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm text-blue-600 font-medium">{rec.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOToolsPanel;