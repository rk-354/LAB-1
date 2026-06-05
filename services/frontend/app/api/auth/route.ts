import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const MagicLinkSchema = z.object({ email: z.string().email() })
const PasswordSchema = z.object({ email: z.string().email(), password: z.string().min(6) })

// POST /api/auth — magic link (default) or password login (if password provided)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient()

    // Password login if password is provided
    if (body.password) {
      const { email, password } = PasswordSchema.parse(body)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
      return NextResponse.json({ data: { message: 'Signed in' }, error: null })
    }

    // Magic link
    const { email } = MagicLinkSchema.parse(body)
    const { error } = await supabase.auth.signInWithOtp({
      email,
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
