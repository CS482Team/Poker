import type { GameState, PlayerState } from "../../../shared/GameState"
import { returnScore, setRanks } from "./Ender"
import { advanceTurn, isInHand, isPlayersTurn } from "./Turn"
	
/*Score function:
- Use Ender.ts function to evaluate this hand's current wincond
- From there, Straight or higher does not draw and has a high score for betting
- High values are then further accounted for (except royal flush which has highest score)*/
function botScore(b: PlayerState) {
	let suitRanks = setRanks(p);
    let suits = suitRanks[0];
    const ranks: number[] = suitRanks[1];
	let score = returnScore(b, ranks, suits);
	let highCardVal = b.winningRanks[0];
	let happiness = ((score - 1) x 14) + highCardVal;
	//IF ROUND IS FIRST BETTING ROUND {
		happiness = happiness + drawPotential(ranks, suits, b);
	//}
	return happiness;
	//Random number generator 10% chance bluff score
}

/*Evaluate draw potential function:
- High card and Pair further check for straight and flush potential (2 off or less of either results in discarding those in hope)
- Kept separate as this is only needed for first scoring*/
function drawPotential(ranks: number[], suits: Set<string>(), PlayerState: b) {
	let bonus = 0;
	//Close to flush: 4 of same suit
	let breaks = 0;
	//Currently ignores ace having the ability to be 1
	for(let i = 0; i < ranks.length-1; i++) {
		if(ranks[i] !== ranks[i+1]) {
			breaks = breaks + 1;
		}
	}
	if(breaks === 1) {
		bonus = bonus + 14;
	}
	//Close to straight: 4 in row
	if(suits.size == 2) {
		let sc1 = 0; //Suit count 1
		let sc2 = 0; //Suit count 2
		let suitbase = [...suits][0];
		for(const c of p.hand) {
			if(c.suit === suitbase) {
				sc1 = sc1 + 1;
			}
			else {
				sc2 = sc2 + 1;
			}
		}
		if(sc1 === 4 || sc2 === 4) {
			bonus = bonus + 14;
		}
	}
	//10%ish chance for bot to bluff, adding a rank up of confidence
	let bluffScore = Math.Random();
	if(bluffScore > .9) {
		bonus = bonus + 14;
		b.botBluff = true;
	}
	return bonus;
}

/*Discard:
- Straight or higher does not draw
- Three of a kind either discards 2 out cards or the lower of the two (unsure which direction to go or make it a chance)
- Two pair discards the odd card out
- Pair and High Card will be harder, this will be based on prior evaluation, especially since these are likely to result in fold*/
export function botDiscard(b: PlayerState) {
	//Bluff mode: always hold at least 2 cards
	//4 of a kind: chance of discarding or drawing
}

/*Betting:
- Use score from scoring to 
- For first bet: take into account bonus from potential
- For second bet: take into account whether the score improved or not maybe.*/
export function botBet(b: PlayerState) {
	let happiness = botScore(b);
}