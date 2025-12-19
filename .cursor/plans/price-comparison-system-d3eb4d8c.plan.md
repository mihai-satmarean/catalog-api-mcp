<!-- d3eb4d8c-1178-45ce-ae7b-8537b879e366 20a9ec2c-abd7-4ddf-b669-e6233e569385 -->
# Price Comparison System Implementation

## Overview

When a product request is created, automatically query 3 simulated provider APIs with random delays and display comparison results showing different prices, delivery times, and reliability scores.

## Database Schema Changes

### Add `provider_quotes` table to `src/db/schema.ts`

```typescript
export const providerQuotes = pgTable('provider_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => productRequests.id),
  providerName: varchar('provider_name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  reliabilityScore: decimal('reliability_score', { precision: 3, scale: 2 }).notNull(), // 0-100
  responseTime: integer('response_time').notNull(), // milliseconds
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Add corresponding types and schemas for the new table.

### Update `init.sql` with new table

Add CREATE TABLE statement for `provider_quotes`.

## Backend API Implementation

### Create provider simulation service: `src/lib/providers.ts`

- Define 3 providers: "ProviderA", "ProviderB", "ProviderC"
- Function `getProviderQuote(providerName, productId, quantity, basePrice)`:
  - Simulate random delay (500-3000ms)
  - Generate price variation (basePrice ± 5-20%)
  - Generate delivery time (3-14 days)
  - Generate reliability score (75-99)
  - Return quote object

### Create quote fetching API: `src/app/api/quotes/[requestId]/route.ts`

- GET endpoint to retrieve all quotes for a request
- Returns array of provider quotes from database

### Update `src/app/api/requests/route.ts` POST handler

After creating the request:

1. Get base product price from products table
2. Call all 3 providers in parallel using `Promise.all()`
3. Insert all quotes into `provider_quotes` table
4. Return request with quotes embedded in response

## Frontend Changes

### Update `src/app/requests/page.tsx`

#### Add interfaces

```typescript
interface ProviderQuote {
  id: string;
  providerName: string;
  price: string;
  deliveryDays: number;
  reliabilityScore: string;
  responseTime: number;
}

interface ProductRequestWithQuotes extends ProductRequest {
  quotes?: ProviderQuote[];
}
```

#### Update state

```typescript
const [requests, setRequests] = useState<ProductRequestWithQuotes[]>([]);
const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<ProviderQuote[] | null>(null);
const [showQuotesModal, setShowQuotesModal] = useState(false);
```

#### Modify handleSubmit

After successful POST:

- Response will include quotes
- Update UI to show loading state during quote fetching
- Display quotes in a new modal or expandable section

#### Add quotes display component

Create a quotes table/card showing:

- Provider name
- Price (color-coded: green for lowest)
- Delivery time
- Reliability score with visual indicator
- Response time

#### Update requests table

Add "View Quotes" button for each request that opens quotes modal.

### Create quotes modal component

Use shadcn Dialog to display:

- Table with all 3 provider quotes
- Highlight best price in green
- Show delivery days with calendar icon
- Display reliability as progress bar or badge
- Show response times

## Implementation Steps

1. Update database schema and run migrations
2. Create provider simulation service
3. Create quotes API endpoint
4. Update requests POST endpoint to fetch quotes
5. Update frontend interfaces and state
6. Add quotes display modal
7. Update requests table with "View Quotes" action
8. Test with various quantities and products

### To-dos

- [ ] Add provider_quotes table to schema.ts with types and Zod schemas
- [ ] Add CREATE TABLE for provider_quotes in init.sql
- [ ] Create src/lib/providers.ts with provider simulation logic
- [ ] Create GET endpoint at src/app/api/quotes/[requestId]/route.ts
- [ ] Update POST handler in src/app/api/requests/route.ts to fetch quotes
- [ ] Update src/app/requests/page.tsx with quotes interfaces and state
- [ ] Add quotes display modal component to requests page
- [ ] Add 'View Quotes' button to requests table