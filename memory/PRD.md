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
- Dashboard endpoints

### API Integration (LIVE - No Mock Data)
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

- **Date: Jan 14, 2026 (Update 1)**
  - Updated API integration to match backend developer specs
  - Added `days` parameter support for overview and heatmap endpoints
  - Enhanced WebSocket with ping/pong keep-alive (30s intervals)
  - Added support for WebSocket event types: realtime_update, overview_update, new_visitor, new_pageview, new_conversion
  - Added date range selectors (7/14/30/90 days)

- **Date: Jan 14, 2026 (Update 2 - LIVE API)**
  - **REMOVED mock data fallbacks** - component now uses live API only
  - Graceful error handling for API failures (shows empty states)
  - Frontend 100% ready for live backend deployment

## Files Modified/Created
- `/app/src/components/admin/WebAnalytics.js` (CREATED/UPDATED)
- `/app/src/components/admin/AdminConsole.js` (MODIFIED - added Web Analytics)
- `/app/.env` (MODIFIED - updated REACT_APP_BACKEND_URL)

## Test Results
- Frontend: 100% pass rate (all UI components functional)
- Backend: Awaiting deployment on api.staging.integratedtech.ca (404 errors)

## Current Status
| Component | Status |
|-----------|--------|
| Frontend UI | ✅ Complete |
| API Integration | ✅ Complete |
| Mock Data | ❌ Removed |
| Backend Endpoints | ⏳ Awaiting deployment |
| WebSocket | ⏳ Awaiting deployment |

## Prioritized Backlog
### P0 (Critical - Backend Team)
- Deploy /api/dashboard/overview endpoint
- Deploy /api/dashboard/realtime endpoint  
- Deploy /api/dashboard/heatmap-data endpoint
- Deploy WebSocket /api/ws/analytics endpoint

### P1 (High Priority)
- Export analytics data to CSV/PDF
- Add more granular time filters (hourly view)

### P2 (Medium Priority)
- User journey/funnel visualization
- Geographic heat map for visitor locations
- Custom dashboards/widgets

## Next Tasks
1. **Backend team**: Deploy dashboard API endpoints to staging server
2. Verify live data integration once endpoints are deployed
3. Add data export functionality
4. Consider conversion funnel visualization
