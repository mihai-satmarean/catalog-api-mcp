import { NextRequest, NextResponse } from 'next/server';
import { db, dbPath } from '@/db';
import { midoceanSyncHistory } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { resolve } from 'path';

// Ensure table exists - create it if it doesn't exist
function ensureTableExists() {
  try {
    // Use absolute path to ensure we're using the correct database
    const actualDbPath = dbPath.startsWith('/') ? dbPath : resolve(process.cwd(), dbPath);
    console.log('Ensuring midocean_sync_history table exists in:', actualDbPath);
    const sqlite = new Database(actualDbPath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS midocean_sync_history (
        id TEXT PRIMARY KEY,
        endpoint_type TEXT NOT NULL,
        environment TEXT NOT NULL,
        synced_at INTEGER NOT NULL,
        record_count INTEGER,
        success INTEGER DEFAULT 1 NOT NULL,
        error_message TEXT,
        status_message TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_midocean_sync_history_endpoint_type ON midocean_sync_history(endpoint_type);
      CREATE INDEX IF NOT EXISTS idx_midocean_sync_history_environment ON midocean_sync_history(environment);
      CREATE INDEX IF NOT EXISTS idx_midocean_sync_history_synced_at ON midocean_sync_history(synced_at);
    `);
    sqlite.close();
    console.log('midocean_sync_history table ensured');
  } catch (error) {
    console.error('Error ensuring midocean_sync_history table exists:', error);
  }
}

// Ensure table exists on module load
ensureTableExists();

// POST /api/midocean/sync-history - Save sync history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Midocean sync history POST request:', body);
    const { endpointType, environment, recordCount, success = true, errorMessage, statusMessage } = body;

    if (!endpointType) {
      console.error('Missing endpointType in request');
      return NextResponse.json(
        { success: false, error: 'endpointType is required' },
        { status: 400 }
      );
    }

    if (!environment) {
      console.error('Missing environment in request');
      return NextResponse.json(
        { success: false, error: 'environment is required' },
        { status: 400 }
      );
    }

    const validEndpointTypes = ['print-pricelist', 'pricelist', 'stock', 'products', 'order-create', 'order-detail', 'printdata'];
    if (!validEndpointTypes.includes(endpointType)) {
      console.error('Invalid endpointType:', endpointType);
      return NextResponse.json(
        { success: false, error: `Invalid endpointType: ${endpointType}` },
        { status: 400 }
      );
    }

    const validEnvironments = ['test', 'production'];
    if (!validEnvironments.includes(environment)) {
      console.error('Invalid environment:', environment);
      return NextResponse.json(
        { success: false, error: `Invalid environment: ${environment}` },
        { status: 400 }
      );
    }

    const syncData = {
      id: randomUUID(),
      endpointType,
      environment,
      syncedAt: new Date(),
      recordCount: recordCount || null,
      success: success ? 1 : 0, // SQLite uses INTEGER for boolean
      errorMessage: errorMessage || null,
      statusMessage: statusMessage || null,
      createdAt: new Date(),
    };
    
    console.log('Inserting sync history with data:', syncData);
    
    const syncRecord = await db.insert(midoceanSyncHistory).values(syncData).returning();

    console.log('Sync history saved successfully:', syncRecord[0]);

    return NextResponse.json({
      success: true,
      data: syncRecord[0],
    });
  } catch (error) {
    console.error('Error saving Midocean sync history:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save sync history' },
      { status: 500 }
    );
  }
}

// GET /api/midocean/sync-history - Get last sync dates for all endpoint types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') || 'test'; // Default to 'test'
    
    const endpointTypes = ['print-pricelist', 'pricelist', 'stock', 'products', 'order-create', 'order-detail', 'printdata'];
    
    const lastSyncDates: Record<string, any> = {};

    for (const endpointType of endpointTypes) {
      const lastSync = await db
        .select()
        .from(midoceanSyncHistory)
        .where(
          and(
            eq(midoceanSyncHistory.endpointType, endpointType),
            eq(midoceanSyncHistory.environment, environment)
          )
        )
        .orderBy(desc(midoceanSyncHistory.syncedAt))
        .limit(1);

      if (lastSync.length > 0) {
        lastSyncDates[endpointType] = {
          syncedAt: lastSync[0].syncedAt,
          recordCount: lastSync[0].recordCount,
          success: Boolean(lastSync[0].success), // Convert INTEGER to boolean
          statusMessage: lastSync[0].statusMessage || null,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: lastSyncDates,
    });
  } catch (error) {
    console.error('Error fetching Midocean sync history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}
