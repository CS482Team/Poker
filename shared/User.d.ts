export interface MyProfile {
  id: string
  username: string
  avatarUrl: string | ""
  email: string | null // null for guests
  isGuest: boolean
}