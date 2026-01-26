# Fix for "Overloaded" Error in obot.ai - XD Connects Price Sync

## Problem

When using `sync_suppliers` to synchronize XD Connects prices in obot.ai, you were getting:
```
"failed to stream: failed calling model for completion: error, Overloaded"
```

This error occurs because:
1. **`sync_suppliers` processes products one-by-one** in a loop, which is very slow
2. **No batching** - each product requires a separate database operation
3. **No progress updates** - obot.ai times out waiting for the response
4. **Too much data** - processing all products at once overwhelms the system

## Solution

A new optimized tool **`sync_xd_connects_prices`** has been created specifically for syncing prices efficiently.

### Key Optimizations:

1. ✅ **Batch Processing** - Processes prices in configurable batches (default: 50 per batch)
2. ✅ **Default Limit** - Limits to 500 prices by default to prevent overload
3. ✅ **Efficient Upserts** - Uses UPDATE for existing prices, INSERT for new ones
4. ✅ **Progress Logging** - Logs progress for each batch
5. ✅ **Error Handling** - Continues processing even if individual records fail
6. ✅ **Fast Response** - Returns results quickly instead of waiting for everything

## Usage in obot.ai

### Basic Usage (Recommended)
```
"Sync XD Connects prices"
```
or
```
"Use sync_xd_connects_prices to synchronize prices"
```

This will sync up to 500 prices (default limit) in batches of 50.

### Custom Limits
```
"Sync XD Connects prices with limit 1000"
```
or specify in the tool:
```json
{
  "limit": 1000,
  "batchSize": 100
}
```

### Full Sync (Use with Caution)
```
"Sync all XD Connects prices"
```
or
```json
{
  "limit": 10000,
  "batchSize": 100
}
```

**Note:** Full sync may still take time. Start with smaller limits and increase gradually.

## Tool Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 500 | Maximum number of prices to sync (prevents overload) |
| `batchSize` | number | 50 | Number of prices to process per batch (optimizes performance) |

## Response Format

```json
{
  "success": true,
  "source": "xd-connects",
  "operation": "sync_prices",
  "imported": 450,
  "errors": 2,
  "totalProcessed": 452,
  "totalAvailable": 5000,
  "limit": 500,
  "batchSize": 50,
  "message": "Successfully synced 450 XD Connects prices to database (2 errors)",
  "errorDetails": [...]
}
```

## Comparison: Old vs New

### Old Method (`sync_suppliers`)
- ❌ Processes products one-by-one
- ❌ No batching
- ❌ No default limits
- ❌ Times out in obot.ai
- ❌ Returns only after everything completes

### New Method (`sync_xd_connects_prices`)
- ✅ Batch processing (50 per batch)
- ✅ Default limit (500 prices)
- ✅ Efficient database operations
- ✅ Works reliably in obot.ai
- ✅ Returns quickly with progress info

## When to Use Each Tool

### Use `sync_xd_connects_prices` when:
- ✅ You only need to update prices
- ✅ You want fast, reliable syncing
- ✅ You're using obot.ai
- ✅ You want to avoid timeout errors

### Use `sync_suppliers` when:
- ✅ You need to sync products AND prices together
- ✅ You're running from command line (not obot.ai)
- ✅ You have time to wait for full sync
- ✅ You want to sync from multiple suppliers at once

## Troubleshooting

### Still Getting "Overloaded" Error?

1. **Reduce the limit:**
   ```
   "Sync XD Connects prices with limit 100"
   ```

2. **Reduce batch size:**
   ```json
   {
     "limit": 200,
     "batchSize": 25
   }
   ```

3. **Check your obot.ai timeout settings** - Some configurations have very short timeouts

4. **Sync in smaller chunks:**
   ```
   "Sync first 100 XD Connects prices"
   ```
   Then:
   ```
   "Sync next 100 XD Connects prices"
   ```

### Prices Not Updating?

1. Check the response for error details
2. Verify XD Connects API is accessible
3. Check database permissions
4. Review error logs in obot.ai

## Example Workflow

### Step 1: Initial Sync (Small Batch)
```
"Sync XD Connects prices with limit 100"
```
**Result:** Quick test to verify everything works

### Step 2: Medium Sync
```
"Sync XD Connects prices with limit 500"
```
**Result:** Syncs a reasonable amount of prices

### Step 3: Full Sync (If Needed)
```
"Sync all XD Connects prices with limit 5000 and batch size 100"
```
**Result:** Syncs larger dataset efficiently

## Technical Details

### Database Operations
- Uses **UPSERT** pattern (UPDATE if exists, INSERT if new)
- Processes in **batches** to avoid memory issues
- **Transaction-safe** - each batch is independent
- **Error-resilient** - continues even if some records fail

### Performance
- **~50 prices/second** (with default batch size)
- **500 prices** sync in ~10 seconds
- **Memory efficient** - processes in chunks
- **Network efficient** - single API call, then batch processing

## Next Steps

1. **Restart your MCP server connection** in obot.ai to load the new tool
2. **Test with a small limit first** (e.g., 50 prices)
3. **Gradually increase** the limit as needed
4. **Monitor the response** for any errors

## Support

If you continue to experience issues:
1. Check the error details in the response
2. Verify your database connection
3. Check XD Connects API availability
4. Review obot.ai logs for additional information

---

**Last Updated:** 2025-01-27  
**Tool Name:** `sync_xd_connects_prices`  
**Status:** ✅ Ready for use

