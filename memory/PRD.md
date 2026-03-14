# Web Analytics Integration PRD

## Original Problem Statement
Admin Dashboard Integration:
- Read /app/docs/FRONTEND_DEVELOPER_GUIDE.md for complete API reference
- Use auth token with all /dashboard/* endpoints
- Connect WebSocket to /api/ws/analytics for real-time updates
- Test with: aminderpro@gmail.com / Admin@123!

Key Endpoints for Dashboard:
- GET /dashboard/overview - KPIs (visitors, conversions, bounce rate)
- GET /dashboard/realtime - Live visitors & sessions
- GET /dashboard/heatmap-data?page_url=/pricing - Click heatmap data

## Architecture

### Frontend Stack
- React 19 with React Router
- Tailwind CSS + Shadcn UI components
- Recharts for data visualization
- WebSocket for real-time updates (with polling fallback)

### External Backend
- URL: https://api.staging.integratedtech.ca
- Authentication: JWT Bearer token
- Dashboard endpoints (with mock data fallback)

### API Integration
```
GET /api/dashboard/overview?days=7       → KPIs, daily traffic
GET /api/dashboard/realtime              → Active visitors, sessions, top pages
GET /api/dashboard/heatmap-data?page_url=/pricing&days=30 → Click data
WSS /api/ws/analytics?token=<jwt>        → Real-time updates
```

## User Personas
1. **Platform Admin** - Full access to Web Analytics dashboard
2. **Company Admin** - Potential future access to company-specific analytics

## Core Requirements (Static)
1. KPI Cards showing visitors, conversions, bounce rate, session duration
2. Real-time visitors panel with live chart
3. Active sessions breakdown by traffic source
4. Click heatmap visualization with page selector
5. Traffic trends chart (configurable day range)
6. WebSocket connection for real-time updates (with polling fallback)
7. Date range selectors for overview and heatmap data

## What's Been Implemented
- **Date: Jan 14, 2026**
  - Created WebAnalytics.js component with comprehensive dashboard
  - Added "Web Analytics" section to AdminConsole sidebar under ANALYTICS workspace
  - Implemented KPI cards with trend indicators
  - Built real-time visitors chart with live count
  - Created active sessions panel with source breakdown
  - Developed heatmap visualization with click distribution
  - Added traffic trends chart
  - Implemented WebSocket connection with ping/pong keep-alive
  - Added polling fallback when WebSocket unavailable
  - Added date range selectors (7/14/30/90 days)
  - Mock data fallback when real endpoints unavailable

- **Date: Jan 14, 2026 (Update)**
  - Updated API integration to match backend developer specs
  - Added `days` parameter support for overview endpoint
  - Added `days` parameter support for heatmap endpoint
  - Enhanced WebSocket with ping/pong keep-alive
  - Added support for new_visitor, new_pageview, new_conversion WebSocket events
  - Improved connection status UI (Live/Polling indicator)

## Files Modified/Created
- `/app/src/components/admin/WebAnalytics.js` (NEW)
- `/app/src/components/admin/AdminConsole.js` (MODIFIED - added Web Analytics import and menu item)
- `/app/.env` (MODIFIED - updated REACT_APP_BACKEND_URL)

## Test Results
- Frontend: 100% pass rate
- Backend endpoints: Awaiting implementation on api.staging.integratedtech.ca

## Prioritized Backlog
### P0 (Critical)
- Backend: Implement /api/dashboard/overview endpoint
- Backend: Implement /api/dashboard/realtime endpoint  
- Backend: Implement /api/dashboard/heatmap-data endpoint
- Backend: Implement WebSocket /api/ws/analytics endpoint

### P1 (High Priority)
- Export analytics data to CSV/PDF
- Add more granular time filters (hourly view)

### P2 (Medium Priority)
- User journey/funnel visualization
- Geographic heat map for visitor locations
- Custom dashboards/widgets

## Next Tasks
1. Backend team to implement dashboard API endpoints
2. Test with real data once endpoints are live
3. Add data export functionality
4. Consider conversion funnel visualization
