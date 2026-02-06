import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const COLLECTION = 'streams'

// GET /api/streams?id=<uuid>       - single stream with user info (for viewer page)
// GET /api/streams?wallet=0x...    - current live stream for this wallet (single or null)
// GET /api/streams?status=live     - all streams with given status (with streamer info)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const params = request.nextUrl.searchParams

    const id = params.get('id')
    if (id) {
      // Single stream lookup + join user info
      const { data: stream, error } = await supabase
        .from('documents')
        .select('*')
        .eq('collection', COLLECTION)
        .eq('id', id)
        .single()

      if (error && error.code === 'PGRST116') {
        return NextResponse.json({ stream: null })
      }
      if (error) throw error

      // Fetch streamer profile
      const streamerWallet = (stream.data as Record<string, unknown>).streamer_wallet as string
      const { data: user } = await supabase
        .from('documents')
        .select('*')
        .eq('collection', 'users')
        .eq('id', streamerWallet)
        .single()

      return NextResponse.json({
        stream: {
          id: stream.id,
          ...stream.data as Record<string, unknown>,
          created_at: stream.created_at,
        },
        streamer: user
          ? { wallet_address: user.id, ...(user.data as Record<string, unknown>) }
          : { wallet_address: streamerWallet, display_name: streamerWallet.slice(0, 8) },
      })
    }

    // List streams by status (e.g. ?status=live)
    const status = params.get('status')
    if (status) {
      const { data: streams, error } = await supabase
        .from('documents')
        .select('*')
        .eq('collection', COLLECTION)
        .eq('data->>status', status)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Batch-fetch streamer profiles for all unique wallets
      const wallets = [...new Set(
        (streams ?? []).map((s) => (s.data as Record<string, unknown>).streamer_wallet as string)
      )]

      const { data: users } = wallets.length > 0
        ? await supabase
            .from('documents')
            .select('*')
            .eq('collection', 'users')
            .in('id', wallets)
        : { data: [] }

      const userMap = new Map(
        (users ?? []).map((u) => [u.id, { wallet_address: u.id, ...(u.data as Record<string, unknown>) }])
      )

      const result = (streams ?? []).map((s) => {
        const streamData = s.data as Record<string, unknown>
        const wallet = streamData.streamer_wallet as string
        return {
          stream: { id: s.id, ...streamData, created_at: s.created_at },
          streamer: userMap.get(wallet) ?? { wallet_address: wallet, display_name: wallet.slice(0, 8) },
        }
      })

      return NextResponse.json({ streams: result })
    }

    // Current live stream by wallet (single)
    const wallet = params.get('wallet')
    if (!wallet) {
      return NextResponse.json({ error: 'id, wallet, or status parameter is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('collection', COLLECTION)
      .eq('data->>streamer_wallet', wallet.toLowerCase())
      .eq('data->>status', 'live')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      stream: data
        ? { id: data.id, ...(data.data as Record<string, unknown>), created_at: data.created_at }
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/streams  { streamer_wallet, title }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamer_wallet, title } = body

    if (!streamer_wallet) {
      return NextResponse.json({ error: 'streamer_wallet is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('documents')
      .insert({
        id,
        collection: COLLECTION,
        data: {
          streamer_wallet: streamer_wallet.toLowerCase(),
          title: title || 'Untitled Stream',
          status: 'live',
          started_at: now,
          ended_at: null,
        },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      stream: { id: data.id, ...(data.data as Record<string, unknown>), created_at: data.created_at },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
