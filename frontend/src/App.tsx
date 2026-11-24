import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { RequireAuth } from '@/components/RequireAuth'
import { Toaster } from '@/components/ui/sonner'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { ListingPage } from '@/pages/ListingPage'
import { SellPage } from '@/pages/SellPage'
import { InboxPage } from '@/pages/InboxPage'
import { ChatPage } from '@/pages/ChatPage'
import { SavedPage } from '@/pages/SavedPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import { EscrowPage, NotFoundPage } from '@/pages/EscrowPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<AppShell />}>
            <Route index element={<DiscoverPage />} />
            <Route path="listings/:id" element={<ListingPage />} />
            <Route path="how-escrow-works" element={<EscrowPage />} />
            <Route path="sell" element={<RequireAuth><SellPage /></RequireAuth>} />
            <Route path="saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
            <Route path="inbox" element={<RequireAuth><InboxPage /></RequireAuth>} />
            <Route path="inbox/:id" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}
