export interface MyProfile {
  id: string
  username: string
  avatarUrl: string | null // an uploaded picture (data: URL) or a link; null for none
  email: string | null // null for guests
  isGuest: boolean
}