export interface MyProfile {
  id: string
  username: string
  avatarUrl: string | null
  email: string | null // null for guests
  isGuest: boolean
}