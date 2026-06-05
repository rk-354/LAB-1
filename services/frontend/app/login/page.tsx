'use client'
import Login from '@/components/Login'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  return <Login onLogin={() => router.push('/')} />
}
