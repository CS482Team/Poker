export interface Ad {
  id: string
  title: string
  rewardAmount: number
  active: boolean
  imageUrl?: string | null
}

export interface NewAd {
  title: string
  rewardAmount: number
  imageUrl?: string | null
}
