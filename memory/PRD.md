# Admin Console PRD

## Original Problem Statement
Build and iterate on an Admin Console for a Fleet Marketplace / TMS platform. The console includes user management, subscription/bundle management, web analytics, CRM, carrier lookup, and other admin tools. The backend is an external service at `https://api.staging.integratedtech.ca`.

## Architecture
- **Frontend-only** React app (CRA + craco)
- UI: ShadCN/UI + Tailwind CSS
- State: React Context (AuthContext, FeaturesContext, ThemeContext)
- Routing: react-router-dom v7
- Charts: Recharts
- External Backend: `https://api.staging.integratedtech.ca`

## Completed Features

### Web Analytics Dashboard - Completed Jan 14, 2026
- KPI Cards (Visitors, Conversions, Bounce Rate, Session Duration)
- Real-time Visitors (WebSocket)
- Click Heatmap
- Traffic Trends
- Export CSV/PDF
- Scheduled Email Reports (CRUD)

### Bundle Selection in Create User - Completed Mar 18, 2026
- "Subscription Bundle" dropdown in Create New User modal
- Loads active bundles from `/api/bundles`
- "No Bundle" default option
- Auto-assigns bundle via `/api/bundles/assign` after user creation
- Shows product details for selected bundle

### Workspace Selection in Subscription Manager - Completed Mar 18, 2026
- When creating/editing a bundle, each selected product shows workspace checkboxes
- 6 workspaces: Dispatch Operations, Accounting, Sales/Business Dev, HR, Fleet Maintenance, Fleet Safety
- Workspace selections included in bundle create/update API payloads
- Selected workspaces displayed as badges in product summary

### Code Quality Fixes - Completed Mar 18, 2026
- Wrapped fetch functions in `useCallback` to fix `react-hooks/exhaustive-deps` warnings
- Fixed Radix Select empty value handling for bundle dropdown
- Added `data-testid` attributes to key interactive elements

## Key API Endpoints
```
POST /api/auth/login
GET  /api/admin/users
POST /api/admin/users
PUT  /api/admin/users/{id}
PUT  /api/admin/users/{id}/status
GET  /api/admin/users/stats/overview
GET  /api/admin/users/{id}/comments
POST /api/admin/users/{id}/comments
GET  /api/admin/users/{id}/audit-log
GET  /api/bundles
POST /api/bundles
PUT  /api/bundles/{id}
DELETE /api/bundles/{id}
GET  /api/bundles/products
GET  /api/bundles/assignments
POST /api/bundles/assign
PUT  /api/bundles/assignments/{id}/cancel
GET  /api/bundles/stats/overview
GET  /api/dashboard/overview?days=7
GET  /api/dashboard/realtime
GET  /api/dashboard/heatmap-data
GET  /api/dashboard/export/csv
GET  /api/dashboard/export/pdf
POST /api/dashboard/reports/schedule
GET  /api/dashboard/reports/schedules
WSS  /api/ws/analytics
```

## Backlog (Prioritized)

### P0
- Bulk User Import (CSV upload)
- User Invitation Flow (email-based self-registration)
- Subscription Renewal & Usage Tracking
- Billing Integration (Stripe)

### P1
- Display "Last Login" timestamp for users
- Admin-triggered password reset
- Subscription history for users/companies
- Proration logic for subscription changes

### P2/P3
- User/Subscription data export to CSV
- Advanced filtering options
- Trial periods and discount codes
- Two-Factor Authentication (2FA) management

## Refactoring Backlog
- Break down PlatformUserManagement.js (~1200 lines) into smaller components
- Break down SubscriptionManager.js (~1150 lines) into smaller components

## Test Credentials
- Email: aminderpro@gmail.com
- Password: Admin@123!
