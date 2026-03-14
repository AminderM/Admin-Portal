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
- WebSocket (react-use-websocket) for real-time updates

### External Backend
- URL: https://api.staging.integratedtech.ca
- Authentication: JWT Bearer token
- Dashboard endpoints (with mock data fallback)

## User Personas
1. **Platform Admin** - Full access to Web Analytics dashboard
2. **Company Admin** - Potential future access to company-specific analytics

## Core Requirements (Static)
1. KPI Cards showing visitors, conversions, bounce rate, session duration
2. Real-time visitors panel with live chart
3. Active sessions breakdown by traffic source
4. Click heatmap visualization with page selector
5. Traffic trends chart (7-day view)
6. WebSocket connection for real-time updates (with polling fallback)

## What's Been Implemented
- **Date: Jan 14, 2026**
  - Created WebAnalytics.js component with comprehensive dashboard
  - Added "Web Analytics" section to AdminConsole sidebar under ANALYTICS workspace
  - Implemented KPI cards with trend indicators
  - Built real-time visitors chart with live count
  - Created active sessions panel with source breakdown
  - Developed heatmap visualization with click distribution
  - Added traffic trends chart
  - Implemented WebSocket connection with polling fallback
  - Added manual refresh functionality
  - Mock data fallback when real endpoints unavailable

## Files Modified/Created
- `/app/src/components/admin/WebAnalytics.js` (NEW)
- `/app/src/components/admin/AdminConsole.js` (MODIFIED - added Web Analytics import and menu item)
- `/app/.env` (MODIFIED - updated REACT_APP_BACKEND_URL)

## Prioritized Backlog
### P0 (Critical)
- None - Core feature complete

### P1 (High Priority)
- Connect to real backend endpoints when available
- Add date range selector for historical data
- Export analytics data to CSV/PDF

### P2 (Medium Priority)
- Add more granular time filters (hourly, daily, weekly, monthly)
- Implement user journey/funnel visualization
- Add geographic heat map for visitor locations
- Custom dashboards/widgets

## Next Tasks
1. When real dashboard endpoints are available, test with live data
2. Consider adding more KPIs based on business requirements
3. Implement date range filtering
4. Add export functionality for reports
