/* Strategy:

Score function:
- Refactor Ender.ts to have a function which returns a score.
- Use Ender.ts function to evaluate this hand's current wincond
- From there, Straight or higher does not draw and has a high score for betting
- High values are then further accounted for (except royal flush which has highest score)

Evaluate draw potential function:
- High card and Pair further check for straight and flush potential (2 off or less of either results in discarding those in hope)
- Kept separate as this is only needed for first scoring

Discard:
- Straight or higher does not draw
- Three of a kind either discards 2 out cards or the lower of the two (unsure which direction to go or make it a chance)
- Two pair discards the odd card out
- Pair and High Card will be harder, this will be based on prior evaluation, especially since these are likely to result in fold

Betting:
- Use score from scoring to 
- For first bet: take into account bonus from potential
- For second bet: take into account whether the score improved or not maybe.

*/