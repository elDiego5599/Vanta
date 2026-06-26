import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: { usuario: string } | null
  login: (u: { usuario: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (u) => set({ user: u }),
      logout: () => set({ user: null }),
    }),
    { name: 'vanta-auth' },
  ),
)
