import type { GameState, PlayerState, PlayerId, Phase } from "../../../shared/GameState"
import { returnScore, setRanks } from "./Ender"
import { advanceTurn, isInHand, isPlayersTurn } from "./Turn"
import { getLegalActions, applyAction } from "./Betting"
import type { LegalAction, PlayerAction } from "../../../shared/Actions"
	
/*Score function:
- Use Ender.ts function to evaluate this hand's current wincond
- From there, Straight or higher does not draw and has a high score for betting
- High values are then further accounted for (except royal flush which has highest score)*/
function botScore(b: PlayerState, state: GameState) {
	const copy: PlayerState = { ...b, winningRanks: [] }
	const [suits, ranks] = setRanks(copy)
	const score = returnScore(copy, ranks, suits)
	const highCardVal = copy.winningRanks[0] ?? 0

	let happiness = ((score - 1) * 14) + highCardVal;
	if(b.botBluff) {
		happiness = happiness + 14;
	}
	if(state.phase === "predraw-betting") {
		happiness = happiness + drawPotential(ranks, suits, b);
	}
	return happiness;
}

/*Evaluate draw potential function:
- High card and Pair further check for straight and flush potential (2 off or less of either results in discarding those in hope)
- Kept separate as this is only needed for first scoring*/
function drawPotential(ranks: number[], suits: Set<string>(), b: PlayerState) {
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
		let cards1: number[] = [];
		let cards2: number[] = [];
		let suitbase = [...suits][0];
		for(let i = 0; i < b.hand.length; i++) {
			if(b.hand[i].suit === suitbase) {
				sc1 = sc1 + 1;
				cards1.push(i);
			}
			else {
				sc2 = sc2 + 1;
				cards2.push(i);
			}
		}
		if(sc1 === 4) {
			bonus = bonus + 14;
			b.botToDiscard.push(cards2[0]);
		}
		else if(sc2 === 4) {
			bonus = bonus + 14;
			b.botToDiscard.push(cards1[0]);
		}
	}
	//10%ish chance for bot to bluff, adding a rank up of confidence
	let bluffScore = Math.random();
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
export function botDiscard(playerId: PlayerId, state: GameState)  {
	let b = state.players.find(b => b.id === playerId)!
	const copy: PlayerState = { ...b, winningRanks: [] }
	const [suits, ranks] = setRanks(copy)
	const score = returnScore(copy, ranks, suits)

	const counts = new Map<number, number>()
	for (const c of b.hand) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
	const unmatched = b.hand.map((c, i) => ({ i, rank: c.rank })).filter(c => counts.get(c.rank) === 1)
	
	if (score === 8) return rng() > 0.5 ? unmatched.map(c => c.i) : [] // four of a kind
	if (score >= 5) return []                    // straight or better keeps everything
	//TODO: Fix this so the bot actually discards correctly with a straight or flush
	if (score >= 2) return unmatched.map(c => c.i) // pair, two pair, three of a kind
	// high card: throw the lowest 3 (2 when bluffing)
	return [...unmatched].sort((x, y) => x.rank - y.rank).slice(0, b.botBluff ? 2 : 3).map(c => c.i)

}

/*Betting:
- Use score from scoring to 
- For first bet: take into account bonus from potential
- For second bet: take into account whether the score improved or not maybe.*/
export function botBet(playerId: PlayerId, state: GameState) {
	let b = state.players.find(b => b.id === playerId)!
	let happiness = botScore(b, state);
	let happinessRand = Math.random();
	//Currently 10% chance to rank up or down, may want more random
	let increment = 14;
	if(happinessRand <= .1) {
		happiness = happiness - increment;
	}
	else if(happinessRand >= .9) {
		happiness = happiness + increment;
	}
	let firstRoundBonusChance = Math.random(); //Chance of a bonus for first round only
	if(state.phase == "predraw-betting" && firstRoundBonusChance >= .85) {
		happiness = happiness + increment;
	}

	type BetRaise = Extract<LegalAction, { min: number, max: number }>;

	const legalActs: LegalAction[] = getLegalActions(state, b.id);
	const fold = legalActs.find(a => a.type === "fold");
	const bet = legalActs.find((a): a is BetRaise => a.type === "bet");
	const check = legalActs.find(a => a.type === "check");
	if(check) {
		//bet - Happiness greater than/equal to 42
		if(bet && happiness >= 42) {
			const sized = (option: BetRaise, to: number): PlayerAction => ({ type: option.type, amount: Math.min(option.max, Math.max(option.min, Math.round(to))) });

			return sized(bet, minBet + rng() * happiness * 0.5);

		}
		//check - otherwise
		else {
			return applyAction(state, b.id, check);
		}
	}
	else {
		const raise = legalActs.find((a) a is BetRaise => a.type === "raise");
		const call = legalActs.find(a => a.type === "call");
		//TODO: Check if we want more complexity/shift values
		if(state.round?.currentBet ?? 0 >= state.config.minBet * 5) {
			//Raise - Happiness greater than/equal to 84
			if(happiness >= 84 && raise) {
				const sized = (option: BetRaise, to: number): PlayerAction => ({ type: option.type, amount: Math.min(option.max, Math.max(option.min, Math.round(to))) });

				return sized(bet, minBet + rng() * happiness * 0.5);
			}
			//Call - Happiness greater than/equal to 42 or bluff
			else if((happiness >= 42 || b.botBluff) && call) {
				return applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				return applyAction(state, b.id, fold);
			}
		}
		else if(state.round?.currentBet ?? 0 >= state.config.minBet * 3) {
			//Raise - Happiness greater than/equal to 56
			if(happiness >= 56 && raise) {
				const sized = (option: BetRaise, to: number): PlayerAction => ({ type: option.type, amount: Math.min(option.max, Math.max(option.min, Math.round(to))) });

				return sized(bet, minBet + rng() * happiness * 0.5);
			}
			//Call - Happiness greater than/equal to 28 or bluff
			else if((happiness >= 28 || b.botBluff) && call) {
				return applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				return applyAction(state, b.id, fold);
			}
		}
		//CHECK PLEASE: Is this even necessary?
		else if(state.round?.currentBet ?? 0 >= state.config.minBet) {
			//Raise - Happiness greater than/equal to 42
			if(happiness >= 42 && raise) {
				const sized = (option: BetRaise, to: number): PlayerAction => ({ type: option.type, amount: Math.min(option.max, Math.max(option.min, Math.round(to))) });

				return sized(bet, minBet + rng() * happiness * 0.5);
			}
			//Call - Happiness greater than/equal to 25 or bluff
			else if((happiness >= 25 || b.botBluff) && call) {
				return applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				return applyAction(state, b.id, fold);
			}
		}
		else {
			//Raise - Happiness greater than/equal to 42
			if(happiness >= 42 && raise) {
				const sized = (option: BetRaise, to: number): PlayerAction => ({ type: option.type, amount: Math.min(option.max, Math.max(option.min, Math.round(to))) });

				return sized(bet, minBet + rng() * happiness * 0.5);
			}
			//Call - Happiness greater than/equal to 12 (if first round) or bluff
			else if((happiness >= 12 || b.botBluff) && call) {
				return applyAction(state, b.id, call);
			}
			//Fold - Else
			else {
				return applyAction(state, b.id, fold);
			}
		}
	}
}