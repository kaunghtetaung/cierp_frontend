import { redirect } from 'next/navigation'
import { requireAppAccess } from '@/lib/auth-utils'

interface AppRootRedirectProps {
  params: Promise<{ appId: string }>
}

export default async function AppRootRedirect({ params }: AppRootRedirectProps) {
  const { appId } = await params

  // Server-side authorization check - this will redirect if unauthorized
  await requireAppAccess(appId)

  // If we reach here, user is authorized - redirect to dashboard
  redirect(`/${appId}/dashboard`)
}