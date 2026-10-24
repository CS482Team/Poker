import type { GameState, PlayerState, Result, SeatInput, TableConfig, Phase } from "./GameState"
import type { Suit, Rank } from "./Card"

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
    players = state.players;
    //Run through each player
    for (let step = 1; step <= players.length; step++) {
        const p = players[(dealerIndex + step) % players.length]!
        if(p.status == "active") {
            let suits = new Set<string>();
            const ranks: number[] = [];
            //Make a set of card ranks and suits in each hand
            for(Card c of p.hand) {
                suits.add(c.Suit);
                ranks.push(c.Rank);
            }
            ranks.sort((r1,r2) => r2 - r1);
            //CHECKING CARDS FOR WIN CONDITION
            //Check If All are In Row (Straight)
            let straight = false;
            if(ranks[0]+0 === ranks[1]+1 === ranks[2]+2 === ranks[3]+3 === ranks[4]+4) {
                straight = true;
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
                p.winCond = 8;
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
                        matcher2 = ranks[i];
                    }
                    else if(match_state <= 1 && ranks[i] === ranks[i-1]) {
                        match_state === 1;
                        matchval++;
                        matcher1 = ranks[i];
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
                    p.winningRanks.push(ranks[0]);
                }
            }
        }
    }
    declareWinner(state);
}

function declareWinner(state: GameState) {
    let maxWinCond = 0;
    const winners: PlayerState[] = [];
    //Search For Player With Highest WINCOND
    for (let step = 1; step <= players.length; step++) {
        const p = players[(dealerIndex + step) % players.length]!
        if(p.status == "active") {
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
            //9, 5: Check Highest Card Rank, If Same: split pot, otherwise highest wins
            case 9:
            case 5:
                
                break;
            //8, 4: Check Highest Card Among The Matching Numbers (CANNOT SPLIT)
            case 8:
            case 4:
                const new_winner: PlayerState[] = [];
                let max_win = 0;
                for(let i = 0; i < winners.length; i++) {
                    if(winners[i].winningRanks[0] > max_win) {
                        new_winner = [];
                        new_winner.push(winners[i]);
                        max_win = winners[i].winningRanks[0];
                    }
                }
                new_winner[0].stack += state.pot;
                state.pot = 0;
                break;
            //7: Check Highest Card Among The Three Matching Specifically (CANNOT SPLIT)
            case 7:
                const new_winner: PlayerState[] = [];
                let max_win = 0;
                for(let i = 0; i < winners.length; i++) {
                    let val_check = winners[i].winningRanks[0];
                    let other_val = 0;
                    let count = 1;
                    for(int j = 1; j < winners[i].winningRanks.length; j++) {
                        if(val_check === winners[i].winningRanks[j]) {
                            count++;
                        }
                        else {
                            other_val = winners[i].winningRanks[j];
                        }
                    }
                    if(count < 3) {
                        val_check = other_val;
                    }
                    if(val_check > max_win) {
                        new_winner = [];
                        new_winner.push(winners[i]);
                        max_win = val_check;
                    }
                }
                new_winner[0].stack += state.pot;
                state.pot = 0;
                break;
            //6: Check Highest Card, If Same Check 2nd Highest Card Until Lowest, If Still Same Split Pot
            case 6:
                //TODO: Implement this!
                //To allow time to submit PR, I skipped this one. Basically it would require either a for loop to check each card until there is a winner
                //Or a recursive function (which I hope to avoid)
                break;
            //3: Check Highest Pair, If Same: Check Other Pair, If Still Same: Split Pot
            case 3:
                const new_winners: PlayerState[] = [];
                let max_win = 0;
                for(let i = 0; i < winners.length; i++) {
                    let val_check = winners[i].winningRanks[0];
                    let other_val = 0;
                    let count = 1;
                    for(int j = 1; j < winners[i].winningRanks.length; j++) {
                        if(val_check === winners[i].winningRanks[j]) {
                            count++;
                        }
                        else {
                            other_val = winners[i].winningRanks[j];
                        }
                    }
                    if(val_check < other_val) {
                        let temp = val_check;
                        val_check = other_val;
                        other_val = temp;
                    }
                    if(val_check > max_win) {
                        new_winners = [];
                        new_winners.push(winners[i]);
                        max_win = val_check;
                    }
                    else if(val_check === max_win) {
                        new_winners.push(winners[i]);
                    }
                }
                if(new_winners.length > 1) {
                    const new_new_winners: PlayerState[] = [];
                    let max_win = 0;
                    for(let i = 0; i < new_winners.length; i++) {
                        let val_check = new_winners[i].winningRanks[0];
                        let other_val = 0;
                        let count = 1;
                        for(int j = 1; j < new_winners[i].winningRanks.length; j++) {
                            if(val_check === new_winners[i].winningRanks[j]) {
                                count++;
                            }
                            else {
                                other_val = new_winners[i].winningRanks[j];
                            }
                        }
                        if(val_check > other_val) {
                            let temp = val_check;
                            val_check = other_val;
                            other_val = temp;
                        }
                        if(val_check > max_win) {
                            new_new_winners = [];
                            new_new_winners.push(new_winners[i]);
                            max_win = val_check;
                        }
                        else if(val_check === max_win) {
                            new_new_winners.push(new_winners[i]);
                        }
                    }
                    if(new_new_winners.length > 1) {
                        splitPot(state, new_new_winners);
                    }
                    else {
                        new_new_winners[0].stack += state.pot;
                        state.pot = 0;
                    }
                }
                else {
                    new_winners[0].stack += state.pot;
                    state.pot = 0;
                }
                break;
            //2: Check Which Pair Is Higher, If Same: Split Pot, otherwise highest wins
            case 2:
            //1: Check Which Card Is Higher, If Same: Split Pot
            case 1:
                const new_winners: PlayerState[] = [];
                let max_win = 0;
                for(let i = 0; i < winners.length; i++) {
                    if(winners[i].winningRanks[0] > max_win) {
                        new_winners = [];
                        new_winners.push(winners[i]);
                        max_win = winners[i].winningRanks[0];
                    }
                    else if(winners[i].winningRanks[0] === max_win) {
                        new_winners.push(winners[i]);
                    }
                }
                if(new_winners.length > 1) {
                    splitPot(state, new_winners);
                }
                else {
                    new_winners[0].stack += state.pot;
                    state.pot = 0;
                }
                break;
        }
    }
    else {
        winners[0].stack += state.pot;
        state.pot = 0;
    }
    //END GAME
    state.Phase = "hand-complete";
}

//Splits the pot among winners who tied
function splitPot(state: GameState, winners: PlayerState[]) {
    let new_pot = Math.floor(state.pot / winners.length);
    let remainder = state.pot % winners.length;
    for(PlayerState winner of winners) {
    winner.stack += new_pot;
        if(remainder !== 0) {
            winner.stack += remainder;
            remainder = 0;
        }
    }
    state.pot = 0;
}