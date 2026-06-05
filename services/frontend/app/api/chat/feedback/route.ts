export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const FeedbackSchema = z.object({
  message_id: z.string().uuid(),
  feedback: z.enum(['up', 'down']),
})

// POST /api/chat/feedback
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = FeedbackSchema.parse(await req.json())
    const admin = createAdminClient()

    const { error } = await admin
      .from('chat_messages')
      .update({ feedback: body.feedback })
      .eq('id', body.message_id)

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    return NextResponse.json({ data: { updated: true }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}

