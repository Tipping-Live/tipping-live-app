import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection by checking auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Test database query (will work even without tables)
    const { error: dbError } = await supabase.from('_test_connection').select('*').limit(1)

    // 42P01 (table doesn't exist) and PGRST205 (not in schema cache)
    // both confirm the database connection works, just no table
    const expectedCodes = ['42P01', 'PGRST205']
    const dbConnected = !dbError || expectedCodes.includes(dbError.code)

    return NextResponse.json({
      status: 'ok',
      supabase: {
        database: dbConnected ? 'connected' : 'error',
        databaseError: dbError && !expectedCodes.includes(dbError.code) ? {
          code: dbError.code,
          message: dbError.message,
        } : null,
        auth: authError ? 'no session' : 'authenticated',
        user: user?.email ?? null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}


// GET streamerInfo()
