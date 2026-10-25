import type { GameState, PlayerState } from "../../../shared/GameState"
import { isInHand } from "./Turn"

const WINCONDS: Record<string, number> =
    {"Royal Flush": 10,
    "Straight Flush": 9,
    "Four of a Kind": 8,
    "Full House": 7,
    "Flush": 6,
    "Straight": 5,
    "Three of a Kind": 4,
    "Two Pair": 3,
    "Pair": 2,
    "High Card": 1};

export function scoreHands(state: GameState) {
    const players = state.players;
    //Run through each player
    for (let step = 1; step <= players.length; step++) {
        const p = players[(state.dealerIndex + step) % players.length]!
        if(isInHand(p)) {
            p.winningRanks = [];
            let suits = new Set<string>();
            const ranks: number[] = [];
            //Make a set of card ranks and suits in each hand
            for(const c of p.hand) {
                suits.add(c.suit);
                ranks.push(c.rank);
            }
            ranks.sort((r1,r2) => r2 - r1);
            //CHECKING CARDS FOR WIN CONDITION
            //Check If All are In Row (Straight)
            let straight = false;
            if(ranks.every((r, i) => i === 0 || ranks[i-1]! - r === 1)) {
                straight = true;
            }
            if(ranks.join() === "14,5,4,3,2") {
                straight = true;
                ranks.shift();
                ranks.push(1);
            }
            //Check If All Are Same Suit (Flush)
            let flush = false;
            if(suits.size === 1) {
                flush = true;
            }
            //If Both Of Above
            if(flush && straight) {
                //If High Card is Ace:
                if(ranks[0] === 14) {
                    //Royal Flush (10)
                    p.winCond = 10;
                    p.winningRanks = ranks.slice();
                }
                else {
                    //Straight Flush (9)
                    p.winCond = 9;
                    p.winningRanks = ranks.slice();
                }
            }
            //If Only Same Suit:
            else if(flush) {
                //Flush (6)
                p.winCond = 6;
                p.winningRanks = ranks.slice();

            }
            //If Only Same Row
            else if(straight) {
                //Straight (5)
                p.winCond = 5;
                p.winningRanks = ranks.slice();
            }
            else {
                //Check How Many Cards Match
                //Each matchval is a count of how many cards match (minus one) in each hand, matchval2 counts if there is a second match
                //match_state dictates 3 states: 0 - initial (searching for the first match, 1 - found first match, 2 - move on to second match
                //matcher1 and matcher2: values being matched
                let matchval = 0;
                let match_state = 0;
                let matchval2 = 0;
                let matcher1 = 0;
                let matcher2 = 0;
                for(let i = 1; i < ranks.length; i++) {
                    if(match_state === 2 && ranks[i] === ranks[i-1]) {
                        matchval2++;
                        matcher2 = ranks[i]!;
                    }
                    else if(match_state <= 1 && ranks[i] === ranks[i-1]) {
                        match_state = 1;
                        matchval++;
                        matcher1 = ranks[i]!;
                    }
                    else if(match_state === 1){
                        match_state = 2;
                    }
                }
                if(matchval !== 0) {
                    for(let j = 0; j < matchval; j++)  {
                        p.winningRanks.push(matcher1);
                    }
                }
                if(matchval2 !== 0) {
                    for(let j = 0; j < matchval2; j++) {
                        p.winningRanks.push(matcher2);
                    }
                }
                for(const r of ranks) {
                    if(r !== matcher1 && r !== matcher2) {
                        p.winningRanks.push(r);
                    }
                }
                //4 Match
                if(matchval === 3) {
                    //Four Of A Kind (8)
                    p.winCond = 8;
                }
                //1 Set of 3 Match and 1 Set of 2 Match
                else if((matchval === 2 && matchval2 === 1) || (matchval === 1 && matchval2 === 2)) {
                    //Full House (7)
                    p.winCond = 7;
                }
                //Else Just 1 Set of Three Matches
                else if(matchval === 2) {
                    //Three Of A Kind (4)
                    p.winCond = 4;
                }
                //2 Sets of 2 Match
                else if(matchval === 1 && matchval2 === 1) {
                    //2 Pair (3)
                    p.winCond = 3;
                }
                //1 Pair Matches
                else if(matchval === 1) {
                    //Pair (2)
                    p.winCond = 2;
                }
                //Nothing Else Works
                else {
                    //High Card (1)
                    p.winCond = 1;
                }
            }
        }
    }
    const total_pot = state.pot;
    let paid = 0;
    let prev_level = 0;
    const levels = [...new Set(players.filter(isInHand).map(p => p.totalContributed))].sort((a, b) => a - b);
    for(let i = 0; i < levels.length; i++) {
        const level = levels[i]!;
        let side_pot = 0;
        for(const p of players) {
            side_pot += Math.min(p.totalContributed, level) - Math.min(p.totalContributed, prev_level);
        }
        if(i === levels.length - 1) {
            side_pot = total_pot - paid;
        }
        paid += side_pot;
        state.pot = side_pot;
        declareWinner(state, level);
        prev_level = level;
    }
}

function declareWinner(state: GameState, level: number) {
    const players = state.players;
    let maxWinCond = 0;
    let winners: PlayerState[] = [];
    //Search For Player With Highest WINCOND
    for (let step = 1; step <= players.length; step++) {
        const p = players[(state.dealerIndex + step) % players.length]!
        if(isInHand(p) && p.totalContributed >= level) {
            if(p.winCond > maxWinCond) {
                maxWinCond = p.winCond;
                //Empty the winner array
                winners = [];
            }
            //If instead of else if for less redundancy
            if(p.winCond === maxWinCond) {
                //Add player to winner array
                winners.push(p);
            }
        }
    }
    //If 2 or More Players Share Highest WINCOND
    if(winners.length > 1) {
        switch(maxWinCond) {
            //10: Split Pot
            case 10:
                splitPot(state, winners);
                break;
            //8, 4: Check Highest Card Among The Matching Numbers (CANNOT SPLIT)
            case 8:
            case 4: {
                let new_winner: PlayerState[] = [];
                let max_win = 0;
                for(let i = 0; i < winners.length; i++) {
                    if(winners[i]!.winningRanks[0]! > max_win) {
                        new_winner = [];
                        new_winner.push(winners[i]!);
                        max_win = winners[i]!.winningRanks[0]!;
                    }
                }
                new_winner[0]!.stack += state.pot;
                state.pot = 0;
                break;
            }
            //7: Check Highest Card Among The Three Matching Specifically (CANNOT SPLIT)
            case 7: {
                let new_winner: PlayerState[] = [];
                let max_win = 0;
                for(let i = 0; i < winners.length; i++) {
                    let val_check = winners[i]!.winningRanks[0]!;
                    let other_val = 0;
                    let count = 1;
                    for(let j = 1; j < winners[i]!.winningRanks.length; j++) {
                        if(val_check === winners[i]!.winningRanks[j]) {
                            count++;
                        }
                        else {
                            other_val = winners[i]!.winningRanks[j]!;
                        }
                    }
                    if(count < 2) {
                        val_check = other_val;
                    }
                    if(val_check > max_win) {
                        new_winner = [];
                        new_winner.push(winners[i]!);
                        max_win = val_check;
                    }
                }
                new_winner[0]!.stack += state.pot;
                state.pot = 0;
                break;
            }
            //9, 5: Check Highest Card Rank, If Same: split pot, otherwise highest wins
            case 9:
            case 5:
            //3: Check Highest Pair, If Same: Check Other Pair, If Still Same: Split Pot
            case 3:
            //2: Check Which Pair Is Higher, If Same: Split Pot, otherwise highest wins
            case 2:
            //1: Check Which Card Is Higher, If Same: Split Pot
            case 1:
            //6: Check Highest Card, If Same Check 2nd Highest Card Until Lowest, If Still Same Split Pot
            case 6: {
                let new_winners: PlayerState[] = winners;
                for(let k = 0; k < new_winners[0]!.winningRanks.length && new_winners.length > 1; k++) {
                    let next_winners: PlayerState[] = [];
                    let max_win = 0;
                    for(let i = 0; i < new_winners.length; i++) {
                        if(new_winners[i]!.winningRanks[k]! > max_win) {
                            next_winners = [];
                            next_winners.push(new_winners[i]!);
                            max_win = new_winners[i]!.winningRanks[k]!;
                        }
                        else if(new_winners[i]!.winningRanks[k] === max_win) {
                            next_winners.push(new_winners[i]!);
                        }
                    }
                    new_winners = next_winners;
                }
                if(new_winners.length > 1) {
                    splitPot(state, new_winners);
                }
                else {
                    new_winners[0]!.stack += state.pot;
                    state.pot = 0;
                }
                break;
            }
        }
    }
    else {
        winners[0]!.stack += state.pot;
        state.pot = 0;
    }
    //END GAME
    state.phase = "hand-complete";
}

//Splits the pot among winners who tied
function splitPot(state: GameState, winners: PlayerState[]) {
    let new_pot = Math.floor(state.pot / winners.length);
    let remainder = state.pot % winners.length;
    for(const winner of winners) {
    winner.stack += new_pot;
        if(remainder !== 0) {
            winner.stack += remainder;
            remainder = 0;
        }
    }
    state.pot = 0;
}