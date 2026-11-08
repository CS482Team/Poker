import type { GameState, PlayerState, Phase } from "../../../shared/GameState"
import { returnScore, setRanks } from "./Ender"
import { advanceTurn, isInHand, isPlayersTurn } from "./Turn"
import { getLegalActions, applyAction } from "./Betting"
import type { Card } from "./Card"
import type { LegalAction, PlayerAction } from "../../../shared/Actions"
	
/*Score function:
- Use Ender.ts function to evaluate this hand's current wincond
- From there, Straight or higher does not draw and has a high score for betting
- High values are then further accounted for (except royal flush which has highest score)*/
function botScore(b: PlayerState, state: GameState) {
	let suitRanks = setRanks(p);
    let suits = suitRanks[0];
    const ranks: number[] = suitRanks[1];
	let score = returnScore(b, ranks, suits);
	let highCardVal = b.winningRanks[0];
	let happiness = ((score - 1) x 14) + highCardVal;
	//MUST DECLARE DEFAULT BOTBLUFF AS FALSE IN SAME PLACE WHERE BOTFLAG IS DECLARED
	if(botBluff) {
		happiness = happiness + 14;
	}
	if(state.Phase === "predraw-betting") {
		happiness = happiness + drawPotential(ranks, suits, b);
	}
	return happiness;
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
		let cards1 = Card[];
		let cards2 = Card[];
		let suitbase = [...suits][0];
		for(const c of b.hand) {
			if(c.suit === suitbase) {
				sc1 = sc1 + 1;
				cards1.push(c);
			}
			else {
				sc2 = sc2 + 1;
				cards2.push(c);
			}
		}
		if(sc1 === 4) {
			bonus = bonus + 14;
			b.botDiscard.push(cards2[0]);
		}
		else if(sc2 === 4) {
			bonus = bonus + 14;
			b.botDiscard.push(cards1[0]);
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
	//Maybe change this later to have happiness be part of the PlayerState interface?
	let happiness = botScore(b);
	//Happiness being under 56 means lower than straight (with one special exception)
	if(happiness <= 56) {
		switch (b.winningRanks.length){
			//Two Pair
			case 4:
			//and Three of a Kind
			case 3:
				for(const c of b.hand) {
					if(!(b.winningRanks.includes(c))) {
						//Discard and draw
					}
				}
			break;
			//Pair
			case 2:
			//and High Card
			case 1:
				if(b.botDiscard.length > 0) {
					//Discard that card, only draw one card, reset botDiscard
				}
				else if(bluff) {
					//Bluff mode: discard only lowest 2 cards
				}
				else {
					//Discard 3 lowest cards
				}
			break;
		}

	}
	//Special case: bluffing with three cards
	else if(bluff && happiness <= 70) {
		for(const c of b.hand) {
			if(!(b.winningRanks.includes(c))) {
				//Discard and draw
			}
		}
	}
	//4 of a kind: chance of discarding and drawing
	else if(b.winningRanks.length === 4) {
		let discChance = Math.Random();
		if(discChance > .5) {
			//Discard and draw
		}
	}
}

/*Betting:
- Use score from scoring to 
- For first bet: take into account bonus from potential
- For second bet: take into account whether the score improved or not maybe.*/
export function botBet(b: PlayerState, state: GameState) {
	let happiness = botScore(b);
	let happinessRand = Math.Random();
	//Currently 10% chance to rank up or down, may want more random
	let increment = 14;
	if(happinessRand <= .1) {
		happiness = happiness - increment;
	}
	else if(happinessRand >= .9) {
		happiness = happiness + increment;
	}
	let firstRoundBonusChance = Math.Random(); //Chance of a bonus for first round only
	if(state.phase == "predraw-betting" && firstRoundBonusChance >= .85) {
		happiness = happiness + increment;
	}

	type BetRaise = Extract<LegalAction, { min: number, max: number }>;

	const legalActs: LegalAction[] = getLegalActions(state, b.id);
	const fold = legalActs.find(a => a.type === "fold");
	const bet = legalActs.find((a) a is BetRaise => a.type === "bet");
	const check = legalActs.find(a => a.type === "check");
	if(check) {
		//bet - Happiness greater than/equal to 42
		if(bet && happiness >= 42) {
			b.betThisRound = state.minBet + Math.Random()*happiness*.5;
			applyAction(state, b.id, raise);
		}
		//check - Happiness greater than/equal to 12 (if first round) or bluff
		else if(happiness >= 12) {
			applyAction(state, b.id, check);
		}
		//Fold - Else
		else {
			applyAction(state, b.id, fold);
		}
	}
	else {
		const raise = legalActs.find((a) a is BetRaise => a.type === "raise");
		const call = legalActs.find(a => a.type === "call");
		//TODO: Check if we want more complexity/shift values
		if(state.currentBet >= state.minBet * 5) {
			//Raise - Happiness greater than/equal to 84
			if(happiness >= 84 && raise) {
				//not sure how to handle min and max at the moment
				b.betThisRound = state.minRaise + state.currentBet + Math.Random()*happiness*.75;
				if(b.betThisRound > raise.max) {
					b.betThisRound = raise.max;
				}
				applyAction(state, b.id, raise);
			}
			//Call - Happiness greater than/equal to 42 or bluff
			else if(happiness >= 42 && call) {
				applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				applyAction(state, b.id, fold);
			}
		}
		else if(state.currentBet >= state.minBet * 3) {
			//Raise - Happiness greater than/equal to 56
			if(happiness >= 56 && raise) {
				b.betThisRound = state.minRaise + state.currentBet + Math.Random()*happiness*.5;
				if(b.betThisRound > raise.max) {
					b.betThisRound = raise.max;
				}
				applyAction(state, b.id, raise);
			}
			//Call - Happiness greater than/equal to 28 or bluff
			else if(happiness >= 28 && call) {
				applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				applyAction(state, b.id, fold);
			}
		}
		//CHECK PLEASE: Is this even necessary?
		else if(state.currentBet >= state.minBet) {
			//Raise - Happiness greater than/equal to 42
			if(happiness >= 42 && raise) {
				b.betThisRound = state.minRaise + state.currentBet + Math.Random()*happiness*.25;
				if(b.betThisRound > raise.max) {
					b.betThisRound = raise.max;
				}
				applyAction(state, b.id, raise);
			}
			//Call - Happiness greater than/equal to 25 or bluff
			else if(happiness >= 25 && call) {
				applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				applyAction(state, b.id, fold);
			}
		}
		else {
			//Raise - Happiness greater than/equal to 42
			if(happiness >= 42 && raise) {
				b.betThisRound = state.minRaise + state.currentBet + Math.Random()*happiness*.25;
				if(b.betThisRound > raise.max) {
					b.betThisRound = raise.max;
				}
				applyAction(state, b.id, raise);
			}
			//Call - Happiness greater than/equal to 12 (if first round) or bluff
			else if(happiness >= 12 && call) {
				applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				applyAction(state, b.id, fold);
			}
		}
	}
}