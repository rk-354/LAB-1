import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const LoginSchema = z.object({ email: z.string().email() })

// POST /api/auth — send magic link
export async function POST(req: Request) {
  try {
    const body = LoginSchema.parse(await req.json())
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
    return NextResponse.json({ data: { message: 'Magic link sent' }, error: null })
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE /api/auth — sign out
export async function DELETE() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ data: { message: 'Signed out' }, error: null })
}
