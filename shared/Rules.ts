export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6
export const AD_WATCH_SECONDS = 10

export const MAX_CHAT_LENGTH = 160 // the database allows up to 500
export const CHAT_HISTORY_SIZE = 50

export const DAILY_REWARDS = [100, 200, 300, 400, 500, 750, 1000] as const
export const MAX_REPORT_LENGTH = 500
export const SHOP_PURCHASE_REASON = "shop_purchase" // balance_log.reason for cosmetic purchases
export const EMOTE_COOLDOWN_SECONDS = 3

export const LEADERBOARD_SIZE = 10 // places on the board
export const LEADERBOARD_TIMEFRAMES = ["week", "month", "season", "all"] as const
// hands a player must finish in the period before they're ranked
export const LEADERBOARD_MIN_HANDS = { week: 5, month: 10, season: 20, all: 20 } as const
