# Backend Developer Instructions

## Feature: Bundle Assignment During User Creation

### Context
The frontend "Create New User" form in the Admin Console now includes an optional **Subscription Bundle** dropdown. When an admin creates a new user and selects a bundle, the frontend will:

1. `POST /api/admin/users` to create the user
2. If a bundle was selected (and it's not "No Bundle"), immediately follow up with `POST /api/bundles/assign` to assign the bundle to the newly created user

### Required API Behavior

#### `POST /api/admin/users`
- **Existing endpoint** - no changes needed
- Response must include `id` or `user_id` field for the newly created user (already present)

#### `POST /api/bundles/assign`
- **Existing endpoint** - no changes needed
- Request body sent by the frontend:
  ```json
  {
    "bundle_id": "<bundle_id>",
    "entity_type": "user",
    "entity_id": "<user_id from creation response>",
    "notes": "Assigned during user creation"
  }
  ```

### No Backend Changes Needed
This feature reuses existing endpoints. The frontend handles the two-step flow (create user, then assign bundle).

---

## Feature: Workspace-to-Product Mapping in Bundles

### Context
The frontend "Create/Edit Bundle" modal in the Subscription Manager now allows admins to assign **workspaces** to each product within a bundle. This controls which areas of the TMS platform a product grants access to.

### Available Workspaces (hardcoded in frontend)
| Workspace ID | Name | Description |
|---|---|---|
| `dispatch_operations` | Dispatch Operations | Route planning, load assignment, driver dispatch |
| `accounting` | Accounting | Invoicing, payments, financial reporting |
| `sales_business_dev` | Sales/Business Development | Lead generation, CRM, rate quotes |
| `hr` | HR | Recruitment, training, employee management |
| `fleet_maintenance` | Fleet Maintenance | Preventive maintenance, repairs, inspections |
| `fleet_safety` | Fleet Safety | Safety compliance, accident prevention, training |

### Updated API Payload

#### `POST /api/bundles` (Create Bundle)
#### `PUT /api/bundles/{bundle_id}` (Update Bundle)

The `products` array in the request body now includes a `workspaces` field:

```json
{
  "name": "Enterprise Suite",
  "description": "Full access bundle",
  "products": [
    {
      "product_id": "tms_pro",
      "product_name": "TMS Pro",
      "included_seats": 5,
      "included_storage_gb": 10,
      "workspaces": ["dispatch_operations", "accounting", "sales_business_dev"]
    },
    {
      "product_id": "fleet_manager",
      "product_name": "Fleet Manager",
      "included_seats": 5,
      "included_storage_gb": 10,
      "workspaces": ["fleet_maintenance", "fleet_safety"]
    }
  ],
  "monthly_price": 299.99,
  "is_active": true
}
```

### Backend Changes Required

1. **Update Bundle Schema/Model**
   - Add `workspaces` field (array of strings) to each product entry within a bundle
   - Valid values: `dispatch_operations`, `accounting`, `sales_business_dev`, `hr`, `fleet_maintenance`, `fleet_safety`
   - Field is optional (defaults to empty array `[]`)

2. **Store and Return Workspaces**
   - When creating/updating a bundle, persist the `workspaces` array for each product
   - When returning bundles via `GET /api/bundles`, include the `workspaces` array in each product entry:
     ```json
     {
       "bundles": [
         {
           "id": "...",
           "name": "Enterprise Suite",
           "products": [
             {
               "product_id": "tms_pro",
               "product_name": "TMS Pro",
               "product_price": 99,
               "included_seats": 5,
               "workspaces": ["dispatch_operations", "accounting"]
             }
           ],
           "monthly_price": 299.99,
           "is_active": true
         }
       ]
     }
     ```

3. **Access Control (Future Use)**
   - The workspace assignments can later be used to enforce access control:
     - When a user is assigned a bundle, check which products and workspaces they have access to
     - Gate access to TMS modules based on the user's active bundle's workspace list
   - This is not required now but is the intended use case

### Database Schema Suggestion (PostgreSQL)
```sql
-- Add workspaces column to bundle_products table
ALTER TABLE bundle_products 
ADD COLUMN workspaces TEXT[] DEFAULT '{}';
```

Or if using a JSONB column for the products array:
```sql
-- The workspaces field is simply added to each product object in the JSONB array
-- No schema change needed if products are stored as JSONB
```

### Validation Rules
- `workspaces` must be an array of strings
- Each value must be one of the 6 valid workspace IDs listed above
- Empty array is valid (product with no workspace restrictions)
- Duplicate workspace IDs should be silently deduplicated

---

## Minor Issues Noted During Testing

| Endpoint | Issue | Priority |
|---|---|---|
| `GET /api/companies` | Returns 405 Method Not Allowed | LOW - Company list unavailable in Assign Subscription modal's company tab |
| `GET /api/companies/my` | Returns 404 | LOW - Theme preferences not loading |
