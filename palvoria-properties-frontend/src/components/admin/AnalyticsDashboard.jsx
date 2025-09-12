import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  PhoneIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  MapPinIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalViews: 0,
      uniqueVisitors: 0,
      inquiries: 0,
      favorites: 0,
      shares: 0,
      avgTimeOnSite: 0,
      bounceRate: 0,
      conversionRate: 0
    },
    properties: [],
    traffic: {
      sources: [],
      devices: { mobile: 0, desktop: 0, tablet: 0 },
      locations: [],
      timeStats: []
    },
    seo: {
      searchKeywords: [],
      impressions: 0,
      clicks: 0,
      avgPosition: 0,
      ctr: 0
    }
  });

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics?range=${timeRange}&property=${selectedProperty}`);
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Mock data for development
        setAnalytics({
          overview: {
            totalViews: 15420,
            uniqueVisitors: 8934,
            inquiries: 156,
            favorites: 892,
            shares: 234,
            avgTimeOnSite: 185, // seconds
            bounceRate: 34.2,
            conversionRate: 1.75
          },
          properties: [
            { id: '1', title: '4BR Villa in Karen', views: 1250, inquiries: 23, favorites: 89, conversionRate: 1.84 },
            { id: '2', title: '3BR Apartment in Westlands', views: 980, inquiries: 18, favorites: 67, conversionRate: 1.83 },
            { id: '3', title: '2BR Condo in Kilimani', views: 750, inquiries: 12, favorites: 45, conversionRate: 1.60 }
          ],
          traffic: {
            sources: [
              { source: 'Google Search', visitors: 4520, percentage: 50.6 },
              { source: 'Direct', visitors: 2010, percentage: 22.5 },
              { source: 'Facebook', visitors: 1234, percentage: 13.8 },
              { source: 'WhatsApp', visitors: 689, percentage: 7.7 },
              { source: 'Other', visitors: 481, percentage: 5.4 }
            ],
            devices: { mobile: 6234, desktop: 2456, tablet: 244 },
            locations: [
              { country: 'Kenya', city: 'Nairobi', visitors: 6780 },
              { country: 'Kenya', city: 'Mombasa', visitors: 1234 },
              { country: 'Uganda', city: 'Kampala', visitors: 567 },
              { country: 'Tanzania', city: 'Dar es Salaam', visitors: 353 }
            ],
            timeStats: [
              { hour: '09:00', views: 234 },
              { hour: '12:00', views: 456 },
              { hour: '15:00', views: 389 },
              { hour: '18:00', views: 678 },
              { hour: '21:00', views: 567 }
            ]
          },
          seo: {
            searchKeywords: [
              { keyword: 'houses for sale nairobi', impressions: 12450, clicks: 890, position: 3.2 },
              { keyword: 'apartments rent westlands', impressions: 8930, clicks: 567, position: 4.1 },
              { keyword: 'karen properties', impressions: 6780, clicks: 456, position: 2.8 },
              { keyword: 'kilimani apartments', impressions: 5670, clicks: 234, position: 5.2 }
            ],
            impressions: 156780,
            clicks: 12456,
            avgPosition: 3.8,
            ctr: 7.95
          }
        });
      }
    };

    fetchAnalytics();
  }, [timeRange, selectedProperty]);

  const StatCard = ({ title, value, change, icon: Icon, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'percentage') return `${val}%`;
      if (format === 'time') return `${Math.floor(val / 60)}m ${val % 60}s`;
      if (format === 'currency') return `KES ${val.toLocaleString()}`;
      return val.toLocaleString();
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            {change && (
              <p className={`text-sm flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
                {Math.abs(change)}% vs last period
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your property performance and visitor insights</p>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Properties</option>
            {analytics.properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.title.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={analytics.overview.totalViews}
          change={12.5}
          icon={EyeIcon}
        />
        <StatCard
          title="Unique Visitors"
          value={analytics.overview.uniqueVisitors}
          change={8.3}
          icon={GlobeAltIcon}
        />
        <StatCard
          title="Inquiries"
          value={analytics.overview.inquiries}
          change={-2.1}
          icon={ChatBubbleLeftRightIcon}
        />
        <StatCard
          title="Conversion Rate"
          value={analytics.overview.conversionRate}
          change={0.3}
          icon={ArrowUpIcon}
          format="percentage"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Favorites"
          value={analytics.overview.favorites}
          change={15.7}
          icon={HeartIcon}
        />
        <StatCard
          title="Shares"
          value={analytics.overview.shares}
          change={22.4}
          icon={ShareIcon}
        />
        <StatCard
          title="Avg. Time on Site"
          value={analytics.overview.avgTimeOnSite}
          change={5.2}
          icon={ClockIcon}
          format="time"
        />
        <StatCard
          title="Bounce Rate"
          value={analytics.overview.bounceRate}
          change={-3.8}
          icon={CursorArrowRaysIcon}
          format="percentage"
        />
      </div>

      {/* Property Performance */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Properties</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Views</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Inquiries</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Favorites</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {analytics.properties.map((property, index) => (
                <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{property.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{property.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{property.inquiries}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{property.favorites}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${
                      property.conversionRate > 1.5 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {property.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Traffic Sources</h2>
          <div className="space-y-4">
            {analytics.traffic.sources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">{source.source}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{source.visitors.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">({source.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Device Types</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Mobile</span>
              </div>
              <span className="text-sm text-gray-600">{analytics.traffic.devices.mobile.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ComputerDesktopIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Desktop</span>
              </div>
              <span className="text-sm text-gray-600">{analytics.traffic.devices.desktop.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ComputerDesktopIcon className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Tablet</span>
              </div>
              <span className="text-sm text-gray-600">{analytics.traffic.devices.tablet.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Performance */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">SEO Performance</h2>
        
        {/* SEO Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.seo.impressions.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Impressions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.seo.clicks.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analytics.seo.ctr}%</p>
            <p className="text-sm text-gray-600">CTR</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{analytics.seo.avgPosition}</p>
            <p className="text-sm text-gray-600">Avg Position</p>
          </div>
        </div>

        {/* Top Keywords */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Search Keywords</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Keyword</th>
                <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Impressions</th>
                <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Clicks</th>
                <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Position</th>
                <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">CTR</th>
              </tr>
            </thead>
            <tbody>
              {analytics.seo.searchKeywords.map((keyword, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 px-4 text-sm text-gray-900">{keyword.keyword}</td>
                  <td className="py-2 px-4 text-sm text-gray-600">{keyword.impressions.toLocaleString()}</td>
                  <td className="py-2 px-4 text-sm text-gray-600">{keyword.clicks}</td>
                  <td className="py-2 px-4 text-sm text-gray-600">{keyword.position}</td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    {((keyword.clicks / keyword.impressions) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Geographic Distribution</h2>
        <div className="space-y-3">
          {analytics.traffic.locations.map((location, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-700">
                  {location.city}, {location.country}
                </span>
              </div>
              <span className="text-sm text-gray-600">{location.visitors.toLocaleString()} visitors</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;