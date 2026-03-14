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
  WifiOff,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
  Mail,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Use the backend URL from environment or default to staging
const ANALYTICS_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.staging.integratedtech.ca';

const WebAnalytics = ({ fetchWithAuth, BACKEND_URL }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [selectedPage, setSelectedPage] = useState('/pricing');
  const [daysRange, setDaysRange] = useState(7);
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Fetch Overview KPIs with days parameter
  const fetchOverview = useCallback(async (days = daysRange) => {
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/overview?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
        return data;
      } else {
        console.error('Overview endpoint error:', response.status);
        toast.error('Failed to load overview data');
      }
    } catch (error) {
      console.error('Overview fetch error:', error);
      toast.error('Failed to connect to analytics API');
    }
  }, [fetchWithAuth, daysRange]);

  // Fetch Realtime Data
  const fetchRealtime = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealtime(data);
        return data;
      } else {
        console.error('Realtime endpoint error:', response.status);
      }
    } catch (error) {
      console.error('Realtime fetch error:', error);
    }
  }, [fetchWithAuth]);

  // Fetch Heatmap Data with page_url and days parameters
  const fetchHeatmap = useCallback(async (pageUrl, days = heatmapDays) => {
    try {
      const response = await fetchWithAuth(
        `${ANALYTICS_BACKEND_URL}/api/dashboard/heatmap-data?page_url=${encodeURIComponent(pageUrl)}&days=${days}`
      );
      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);
        return data;
      } else {
        console.error('Heatmap endpoint error:', response.status);
      }
    } catch (error) {
      console.error('Heatmap fetch error:', error);
    }
  }, [fetchWithAuth, heatmapDays]);

  // Initial data load
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      setLoading(true);
      await Promise.all([
        fetchOverview(daysRange),
        fetchRealtime(),
        fetchHeatmap(selectedPage, heatmapDays)
      ]);
      if (isMounted) {
        setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchOverview, fetchRealtime, fetchHeatmap, selectedPage, daysRange, heatmapDays]);

  // Separate effect for WebSocket connection
  useEffect(() => {
    // Connect WebSocket on mount
    const initWebSocket = () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('No auth token for WebSocket connection');
          return;
        }
        
        // Use wss:// for secure connections
        const wsProtocol = ANALYTICS_BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
        const wsHost = ANALYTICS_BACKEND_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}://${wsHost}/api/ws/analytics?token=${token}`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          toast.success('Real-time analytics connected');
          
          // Keep alive ping every 30 seconds
          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send('ping');
            }
          }, 30000);
        };
        
        wsRef.current.onmessage = (event) => {
          // Handle pong response
          if (event.data === 'pong') return;
          
          try {
            const { type, payload } = JSON.parse(event.data);
            setLastUpdate(new Date());
            
            switch (type) {
              case 'realtime_update':
                setRealtime(prev => ({ ...prev, ...payload }));
                break;
              case 'overview_update':
                setOverview(prev => ({ ...prev, ...payload }));
                break;
              case 'new_visitor':
                console.log('New visitor:', payload);
                break;
              case 'new_pageview':
                console.log('New pageview:', payload);
                break;
              case 'new_conversion':
                console.log('New conversion:', payload);
                toast.success(`New conversion: ${payload.event_name}`);
                break;
              default:
                console.log('Unknown WebSocket message type:', type);
            }
          } catch (e) {
            console.error('WebSocket message parse error:', e);
          }
        };
        
        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }
          // Attempt reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(initWebSocket, 5000);
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };
      } catch (error) {
        console.log('WebSocket connection failed, using polling:', error);
        setWsConnected(false);
      }
    };
    
    initWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  // Polling interval effect
  useEffect(() => {
    // Poll for realtime updates every 30 seconds as fallback when WS disconnected
    const pollInterval = setInterval(() => {
      if (!wsConnected) {
        fetchRealtime();
      }
    }, 30000);
    
    // Refresh overview every 60 seconds
    const overviewInterval = setInterval(() => {
      fetchOverview(daysRange);
    }, 60000);
    
    return () => {
      clearInterval(pollInterval);
      clearInterval(overviewInterval);
    };
  }, [fetchRealtime, fetchOverview, daysRange, wsConnected]);

  // Handle page selection change for heatmap
  const handlePageChange = (page) => {
    setSelectedPage(page);
    fetchHeatmap(page, heatmapDays);
  };

  // Handle days range change
  const handleDaysRangeChange = (days) => {
    const numDays = parseInt(days, 10);
    setDaysRange(numDays);
    fetchOverview(numDays);
  };

  // Handle heatmap days change
  const handleHeatmapDaysChange = (days) => {
    const numDays = parseInt(days, 10);
    setHeatmapDays(numDays);
    fetchHeatmap(selectedPage, numDays);
  };

  // Manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(daysRange),
      fetchRealtime(),
      fetchHeatmap(selectedPage, heatmapDays)
    ]);
    setLoading(false);
    setLastUpdate(new Date());
    toast.success('Data refreshed');
  };

  // Export to CSV
  const handleExportCSV = async (dataType = 'overview') => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${ANALYTICS_BACKEND_URL}/api/dashboard/export/csv?data_type=${dataType}&days=${daysRange}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${dataType}_${daysRange}days.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success(`${dataType} data exported to CSV`);
      } else {
        toast.error('Failed to export CSV');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Export failed');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${ANALYTICS_BACKEND_URL}/api/dashboard/export/pdf?days=${daysRange}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${daysRange}days.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Report exported to PDF');
      } else {
        toast.error('Failed to export PDF');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Export failed');
    }
  };

  // Fetch scheduled reports
  const fetchSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/reports/schedules`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setSchedulesLoading(false);
    }
  }, [fetchWithAuth]);

  // Create new schedule
  const createSchedule = async (scheduleData) => {
    try {
      const response = await fetchWithAuth(`${ANALYTICS_BACKEND_URL}/api/dashboard/reports/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      if (response.ok) {
        toast.success('Report schedule created');
        fetchSchedules();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create schedule');
        return false;
      }
    } catch (error) {
      console.error('Create schedule error:', error);
      toast.error('Failed to create schedule');
      return false;
    }
  };

  // Toggle schedule active/inactive
  const toggleSchedule = async (scheduleId) => {
    try {
      const response = await fetchWithAuth(
        `${ANALYTICS_BACKEND_URL}/api/dashboard/reports/schedule/${scheduleId}/toggle`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        toast.success('Schedule updated');
        fetchSchedules();
      } else {
        toast.error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Toggle schedule error:', error);
      toast.error('Failed to update schedule');
    }
  };

  // Delete schedule
  const deleteSchedule = async (scheduleId) => {
    try {
      const response = await fetchWithAuth(
        `${ANALYTICS_BACKEND_URL}/api/dashboard/reports/schedule/${scheduleId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        toast.success('Schedule deleted');
        fetchSchedules();
      } else {
        toast.error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Delete schedule error:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Load schedules when modal opens
  useEffect(() => {
    if (showScheduleModal) {
      fetchSchedules();
    }
  }, [showScheduleModal, fetchSchedules]);

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
          {/* Date Range Selector */}
          <Select value={String(daysRange)} onValueChange={handleDaysRangeChange}>
            <SelectTrigger className="w-[140px]" data-testid="days-range-select">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
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
          
          {/* Export Buttons */}
          <div className="flex items-center gap-1 border-l border-border pl-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV('overview')}
              data-testid="export-csv-btn"
              title="Export to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              data-testid="export-pdf-btn"
              title="Export to PDF"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScheduleModal(true)}
              data-testid="schedule-reports-btn"
              title="Schedule Email Reports"
            >
              <Mail className="w-4 h-4 mr-1" />
              Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Reports Modal */}
      {showScheduleModal && (
        <ScheduleReportsModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          schedules={schedules}
          loading={schedulesLoading}
          onCreate={createSchedule}
          onToggle={toggleSchedule}
          onDelete={deleteSchedule}
        />
      )}

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
            <div className="flex items-center gap-2">
              <Select value={selectedPage} onValueChange={handlePageChange}>
                <SelectTrigger className="w-[160px]" data-testid="heatmap-page-select">
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
              <Select value={String(heatmapDays)} onValueChange={handleHeatmapDaysChange}>
                <SelectTrigger className="w-[120px]" data-testid="heatmap-days-select">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <CardTitle>Traffic Trends (Last {daysRange} Days)</CardTitle>
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

// Schedule Reports Modal Component
const ScheduleReportsModal = ({ isOpen, onClose, schedules, loading, onCreate, onToggle, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    frequency: 'weekly',
    email: '',
    report_type: 'full',
    day_of_week: 1,
    time: '09:00',
    include_csv: true,
    report_days: 7
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    const success = await onCreate(formData);
    if (success) {
      setShowForm(false);
      setFormData({
        frequency: 'weekly',
        email: '',
        report_type: 'full',
        day_of_week: 1,
        time: '09:00',
        include_csv: true,
        report_days: 7
      });
    }
  };

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  };

  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="schedule-modal">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Scheduled Email Reports</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Add New Schedule Button */}
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full mb-4"
              data-testid="add-schedule-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Schedule
            </Button>
          )}

          {/* New Schedule Form */}
          {showForm && (
            <Card className="mb-4" data-testid="schedule-form">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">New Report Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin@company.com"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                        required
                        data-testid="schedule-email-input"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="text-sm font-medium">Frequency</label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="schedule-frequency-select"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Day of Week (for weekly) */}
                    {formData.frequency === 'weekly' && (
                      <div>
                        <label className="text-sm font-medium">Day</label>
                        <select
                          value={formData.day_of_week}
                          onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                        >
                          {dayLabels.map((day, idx) => (
                            <option key={idx} value={idx}>{day}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Time */}
                    <div>
                      <label className="text-sm font-medium">Time</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>

                    {/* Report Type */}
                    <div>
                      <label className="text-sm font-medium">Report Type</label>
                      <select
                        value={formData.report_type}
                        onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="full">Full Report</option>
                        <option value="summary">Summary</option>
                        <option value="kpi_only">KPIs Only</option>
                      </select>
                    </div>

                    {/* Data Range */}
                    <div>
                      <label className="text-sm font-medium">Data Range</label>
                      <select
                        value={formData.report_days}
                        onChange={(e) => setFormData({ ...formData, report_days: parseInt(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                      </select>
                    </div>

                    {/* Include CSV */}
                    <div className="col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_csv"
                        checked={formData.include_csv}
                        onChange={(e) => setFormData({ ...formData, include_csv: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="include_csv" className="text-sm">Attach CSV data files</label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" data-testid="save-schedule-btn">
                      Create Schedule
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Existing Schedules List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {schedules.length > 0 ? 'Active Schedules' : 'No scheduled reports'}
            </h4>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div 
                  key={schedule.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  data-testid={`schedule-item-${schedule.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{schedule.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {frequencyLabels[schedule.frequency]} at {schedule.time}
                      {schedule.frequency === 'weekly' && ` on ${dayLabels[schedule.day_of_week]}`}
                      {' • '}{schedule.report_type} report • {schedule.report_days} days
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggle(schedule.id)}
                      title={schedule.is_active ? 'Pause' : 'Activate'}
                    >
                      {schedule.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(schedule.id)}
                      className="text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Reports are sent via email at the scheduled time. Ensure SMTP is configured on the server.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebAnalytics;
