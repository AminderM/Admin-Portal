import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointerClick, 
  Eye, 
  ArrowUpRight,
  Activity,
  Globe,
  Clock,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ANALYTICS_BACKEND_URL = 'https://api.staging.integratedtech.ca';

const WebAnalytics = ({ fetchWithAuth, BACKEND_URL }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [selectedPage, setSelectedPage] = useState('/pricing');
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch Overview KPIs
  const fetchOverview = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/overview`);
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      } else {
        // Use mock data if endpoint not available
        setOverview(generateMockOverview());
      }
    } catch (error) {
      console.log('Using mock overview data:', error);
      setOverview(generateMockOverview());
    }
  }, [fetchWithAuth]);

  // Fetch Realtime Data
  const fetchRealtime = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealtime(data);
      } else {
        setRealtime(generateMockRealtime());
      }
    } catch (error) {
      console.log('Using mock realtime data:', error);
      setRealtime(generateMockRealtime());
    }
  }, [fetchWithAuth]);

  // Fetch Heatmap Data
  const fetchHeatmap = useCallback(async (pageUrl) => {
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/heatmap-data?page_url=${encodeURIComponent(pageUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);
      } else {
        setHeatmapData(generateMockHeatmap(pageUrl));
      }
    } catch (error) {
      console.log('Using mock heatmap data:', error);
      setHeatmapData(generateMockHeatmap(pageUrl));
    }
  }, [fetchWithAuth]);

  // WebSocket Connection for Real-time Updates
  const connectWebSocket = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `wss://api.staging.integratedtech.ca/api/ws/analytics?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        toast.success('Real-time analytics connected');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastUpdate(new Date());
          
          if (data.type === 'realtime_update') {
            setRealtime(prev => ({ ...prev, ...data.payload }));
          } else if (data.type === 'overview_update') {
            setOverview(prev => ({ ...prev, ...data.payload }));
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Attempt reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    } catch (error) {
      console.log('WebSocket connection failed, using polling:', error);
      setWsConnected(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchRealtime(),
        fetchHeatmap(selectedPage)
      ]);
      setLoading(false);
    };
    
    loadData();
    connectWebSocket();
    
    // Poll for updates every 30 seconds as fallback
    const pollInterval = setInterval(() => {
      if (!wsConnected) {
        fetchRealtime();
      }
    }, 30000);
    
    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchOverview, fetchRealtime, fetchHeatmap, selectedPage, connectWebSocket, wsConnected]);

  // Handle page selection change for heatmap
  const handlePageChange = (page) => {
    setSelectedPage(page);
    fetchHeatmap(page);
  };

  // Manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchRealtime(),
      fetchHeatmap(selectedPage)
    ]);
    setLoading(false);
    setLastUpdate(new Date());
    toast.success('Data refreshed');
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="web-analytics-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading web analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="web-analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Web Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Real-time visitor insights, conversions, and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            wsConnected 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {wsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {wsConnected ? 'Live' : 'Polling'}
          </div>
          
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            data-testid="refresh-analytics-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Visitors"
          value={overview?.total_visitors || 0}
          change={overview?.visitors_change || 0}
          icon={Users}
          color="blue"
          testId="kpi-total-visitors"
        />
        <KPICard
          title="Conversions"
          value={overview?.conversions || 0}
          change={overview?.conversions_change || 0}
          icon={MousePointerClick}
          color="green"
          format="number"
          testId="kpi-conversions"
        />
        <KPICard
          title="Bounce Rate"
          value={overview?.bounce_rate || 0}
          change={overview?.bounce_rate_change || 0}
          icon={TrendingDown}
          color="orange"
          format="percent"
          invertChange
          testId="kpi-bounce-rate"
        />
        <KPICard
          title="Avg Session Duration"
          value={overview?.avg_session_duration || 0}
          change={overview?.session_duration_change || 0}
          icon={Clock}
          color="purple"
          format="duration"
          testId="kpi-session-duration"
        />
      </div>

      {/* Real-time Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" data-testid="realtime-visitors-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Real-time Visitors
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {realtime?.active_visitors || 0}
                </span>
                <span className="text-muted-foreground">active now</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={realtime?.visitors_timeline || []}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#10b981" 
                  fill="url(#colorVisitors)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Sessions Breakdown */}
        <Card data-testid="active-sessions-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-foreground">
                  {realtime?.active_sessions || 0}
                </div>
                <p className="text-muted-foreground mt-1">Total Sessions</p>
              </div>
              
              <div className="space-y-3">
                {realtime?.sessions_by_source?.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSourceColor(source.name)}`}></div>
                      <span className="text-sm">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{source.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({((source.count / (realtime?.active_sessions || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Top Pages</h4>
                {realtime?.top_pages?.slice(0, 5).map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                      {page.path}
                    </span>
                    <span className="text-sm font-medium">{page.visitors}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Section */}
      <Card data-testid="heatmap-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Click Heatmap
            </CardTitle>
            <Select value={selectedPage} onValueChange={handlePageChange}>
              <SelectTrigger className="w-[200px]" data-testid="heatmap-page-select">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/pricing">Pricing Page</SelectItem>
                <SelectItem value="/features">Features Page</SelectItem>
                <SelectItem value="/home">Home Page</SelectItem>
                <SelectItem value="/contact">Contact Page</SelectItem>
                <SelectItem value="/signup">Signup Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap Visualization */}
            <div className="relative bg-muted rounded-lg p-4 min-h-[400px]">
              <div className="absolute inset-0 p-4">
                <HeatmapVisualization data={heatmapData} page={selectedPage} />
              </div>
            </div>
            
            {/* Click Statistics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Click Distribution</h4>
              
              <div className="space-y-3">
                {heatmapData?.click_zones?.map((zone, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{zone.element}</span>
                      <span className="font-medium">{zone.clicks} clicks</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getHeatColor(zone.intensity)}`}
                        style={{ width: `${zone.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Page Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-bold">{heatmapData?.total_clicks || 0}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Click-through Rate</p>
                    <p className="text-2xl font-bold">{heatmapData?.ctr || 0}%</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Avg Scroll Depth</p>
                    <p className="text-2xl font-bold">{heatmapData?.avg_scroll_depth || 0}%</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Engagement Score</p>
                    <p className="text-2xl font-bold">{heatmapData?.engagement_score || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Trends */}
      <Card data-testid="traffic-trends-card">
        <CardHeader>
          <CardTitle>Traffic Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overview?.daily_traffic || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="visitors" stroke="#3b82f6" name="Visitors" strokeWidth={2} />
              <Line type="monotone" dataKey="pageviews" stroke="#10b981" name="Page Views" strokeWidth={2} />
              <Line type="monotone" dataKey="conversions" stroke="#f59e0b" name="Conversions" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, change, icon: Icon, color, format = 'number', invertChange = false, testId }) => {
  const formatValue = (val) => {
    switch (format) {
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'duration':
        const mins = Math.floor(val / 60);
        const secs = val % 60;
        return `${mins}m ${secs}s`;
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = invertChange ? change < 0 : change > 0;
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  };

  return (
    <Card data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{formatValue(value)}</p>
            <div className={`flex items-center gap-1 text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Heatmap Visualization Component
const HeatmapVisualization = ({ data, page }) => {
  if (!data?.click_points) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No heatmap data available
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
      {/* Page mockup */}
      <div className="absolute inset-4 bg-white dark:bg-slate-950 rounded shadow-lg">
        {/* Header mockup */}
        <div className="h-12 bg-slate-100 dark:bg-slate-800 border-b flex items-center px-4 gap-2">
          <div className="w-20 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="flex-1"></div>
          <div className="w-16 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="w-16 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
        </div>
        
        {/* Content mockup */}
        <div className="p-4 space-y-4">
          <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="w-1/2 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="w-32 h-10 bg-blue-500 rounded mx-auto mt-4"></div>
        </div>
        
        {/* Heatmap overlay */}
        {data.click_points.map((point, idx) => (
          <div
            key={idx}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${Math.max(20, point.intensity * 2)}px`,
              height: `${Math.max(20, point.intensity * 2)}px`,
              background: `radial-gradient(circle, ${getHeatColorRGB(point.intensity)} 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              opacity: Math.min(0.8, point.intensity / 100)
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Helper functions
const getSourceColor = (source) => {
  const colors = {
    'Direct': 'bg-blue-500',
    'Organic': 'bg-green-500',
    'Referral': 'bg-purple-500',
    'Social': 'bg-pink-500',
    'Paid': 'bg-orange-500',
    'Email': 'bg-cyan-500'
  };
  return colors[source] || 'bg-gray-500';
};

const getHeatColor = (intensity) => {
  if (intensity >= 80) return 'bg-red-500';
  if (intensity >= 60) return 'bg-orange-500';
  if (intensity >= 40) return 'bg-yellow-500';
  if (intensity >= 20) return 'bg-green-500';
  return 'bg-blue-500';
};

const getHeatColorRGB = (intensity) => {
  if (intensity >= 80) return 'rgba(239, 68, 68, 0.8)';
  if (intensity >= 60) return 'rgba(249, 115, 22, 0.7)';
  if (intensity >= 40) return 'rgba(234, 179, 8, 0.6)';
  if (intensity >= 20) return 'rgba(34, 197, 94, 0.5)';
  return 'rgba(59, 130, 246, 0.4)';
};

// Mock data generators
const generateMockOverview = () => ({
  total_visitors: 12847,
  visitors_change: 12.5,
  conversions: 423,
  conversions_change: 8.3,
  bounce_rate: 42.7,
  bounce_rate_change: -3.2,
  avg_session_duration: 245,
  session_duration_change: 5.7,
  daily_traffic: [
    { date: 'Mon', visitors: 1823, pageviews: 4521, conversions: 58 },
    { date: 'Tue', visitors: 1945, pageviews: 4832, conversions: 62 },
    { date: 'Wed', visitors: 2103, pageviews: 5214, conversions: 71 },
    { date: 'Thu', visitors: 1876, pageviews: 4654, conversions: 59 },
    { date: 'Fri', visitors: 2234, pageviews: 5543, conversions: 78 },
    { date: 'Sat', visitors: 1456, pageviews: 3612, conversions: 45 },
    { date: 'Sun', visitors: 1410, pageviews: 3501, conversions: 50 }
  ]
});

const generateMockRealtime = () => ({
  active_visitors: Math.floor(Math.random() * 50) + 30,
  active_sessions: Math.floor(Math.random() * 60) + 40,
  visitors_timeline: Array.from({ length: 12 }, (_, i) => ({
    time: `${String(i * 2).padStart(2, '0')}:00`,
    visitors: Math.floor(Math.random() * 100) + 20
  })),
  sessions_by_source: [
    { name: 'Direct', count: Math.floor(Math.random() * 30) + 15 },
    { name: 'Organic', count: Math.floor(Math.random() * 25) + 10 },
    { name: 'Referral', count: Math.floor(Math.random() * 15) + 5 },
    { name: 'Social', count: Math.floor(Math.random() * 10) + 3 },
    { name: 'Paid', count: Math.floor(Math.random() * 8) + 2 }
  ],
  top_pages: [
    { path: '/pricing', visitors: Math.floor(Math.random() * 20) + 10 },
    { path: '/features', visitors: Math.floor(Math.random() * 15) + 8 },
    { path: '/home', visitors: Math.floor(Math.random() * 12) + 6 },
    { path: '/contact', visitors: Math.floor(Math.random() * 8) + 3 },
    { path: '/signup', visitors: Math.floor(Math.random() * 6) + 2 }
  ]
});

const generateMockHeatmap = (pageUrl) => ({
  page_url: pageUrl,
  total_clicks: Math.floor(Math.random() * 5000) + 2000,
  ctr: (Math.random() * 10 + 2).toFixed(1),
  avg_scroll_depth: Math.floor(Math.random() * 30) + 60,
  engagement_score: Math.floor(Math.random() * 30) + 65,
  click_zones: [
    { element: 'CTA Button', clicks: Math.floor(Math.random() * 800) + 400, percentage: 85, intensity: 95 },
    { element: 'Pricing Cards', clicks: Math.floor(Math.random() * 600) + 300, percentage: 72, intensity: 78 },
    { element: 'Navigation Menu', clicks: Math.floor(Math.random() * 400) + 200, percentage: 58, intensity: 62 },
    { element: 'Feature List', clicks: Math.floor(Math.random() * 300) + 150, percentage: 45, intensity: 48 },
    { element: 'Footer Links', clicks: Math.floor(Math.random() * 150) + 50, percentage: 22, intensity: 25 }
  ],
  click_points: Array.from({ length: 25 }, () => ({
    x: Math.random() * 80 + 10,
    y: Math.random() * 70 + 15,
    intensity: Math.floor(Math.random() * 100)
  }))
});

export default WebAnalytics;
