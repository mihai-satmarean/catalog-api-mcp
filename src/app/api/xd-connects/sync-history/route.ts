import { NextRequest, NextResponse } from 'next/server';
import { db, dbPath } from '@/db';
import { xdConnectsSyncHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { resolve } from 'path';

// Ensure table exists - create it if it doesn't exist
function ensureTableExists() {
  try {
    // Use absolute path to ensure we're using the correct database
    const actualDbPath = dbPath.startsWith('/') ? dbPath : resolve(process.cwd(), dbPath);
    console.log('Ensuring xd_connects_sync_history table exists in:', actualDbPath);
    const sqlite = new Database(actualDbPath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS xd_connects_sync_history (
        id TEXT PRIMARY KEY,
        feed_type TEXT NOT NULL,
        synced_at INTEGER NOT NULL,
        record_count INTEGER,
        success INTEGER DEFAULT 1 NOT NULL,
        error_message TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_xd_connects_sync_history_feed_type ON xd_connects_sync_history(feed_type);
      CREATE INDEX IF NOT EXISTS idx_xd_connects_sync_history_synced_at ON xd_connects_sync_history(synced_at);
    `);
    sqlite.close();
    console.log('xd_connects_sync_history table ensured');
  } catch (error) {
    console.error('Error ensuring xd_connects_sync_history table exists:', error);
  }
}

// Ensure table exists on module load
ensureTableExists();

// POST /api/xd-connects/sync-history - Save sync history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('XD Connects sync history POST request:', body);
    const { feedType, recordCount, success = true, errorMessage } = body;

    if (!feedType) {
      return NextResponse.json(
        { success: false, error: 'feedType is required' },
        { status: 400 }
      );
    }

    const validFeedTypes = ['product-data', 'product-prices', 'print-data', 'print-prices', 'stock'];
    if (!validFeedTypes.includes(feedType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedType' },
        { status: 400 }
      );
    }

    const syncData = {
      id: randomUUID(),
      feedType,
      syncedAt: new Date(),
      recordCount: recordCount || null,
      success: !!success, // Convert to boolean
      errorMessage: errorMessage || null,
      createdAt: new Date(),
    };
    
    console.log('Inserting XD Connects sync history with data:', syncData);
    
    const syncRecord = await db.insert(xdConnectsSyncHistory).values(syncData).returning();

    console.log('XD Connects sync history saved successfully:', syncRecord[0]);

    return NextResponse.json({
      success: true,
      data: syncRecord[0],
    });
  } catch (error) {
    console.error('Error saving XD Connects sync history:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save sync history' },
      { status: 500 }
    );
  }
}

// GET /api/xd-connects/sync-history - Get last sync dates for all feed types
export async function GET() {
  try {
    console.log('Fetching XD Connects sync history from database:', dbPath);
    const feedTypes = ['product-data', 'product-prices', 'print-data', 'print-prices', 'stock'];
    
    const lastSyncDates: Record<string, any> = {};

    for (const feedType of feedTypes) {
      try {
        const lastSync = await db
          .select()
          .from(xdConnectsSyncHistory)
          .where(eq(xdConnectsSyncHistory.feedType, feedType))
          .orderBy(desc(xdConnectsSyncHistory.syncedAt))
          .limit(1);

        if (lastSync.length > 0) {
          lastSyncDates[feedType] = {
            syncedAt: lastSync[0].syncedAt,
            recordCount: lastSync[0].recordCount,
            success: Boolean(lastSync[0].success), // Convert INTEGER to boolean
          };
          console.log(`Found sync history for ${feedType}:`, lastSyncDates[feedType]);
        }
      } catch (feedError) {
        console.error(`Error fetching sync history for ${feedType}:`, feedError);
      }
    }

    console.log('Returning sync history data:', lastSyncDates);
    return NextResponse.json({
      success: true,
      data: lastSyncDates,
    });
  } catch (error) {
    console.error('Error fetching XD Connects sync history:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}
