import type { GameState, PlayerState, Result, SeatInput, TableConfig } from "./GameState"
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
                    p.matcher
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
                break;
            //7: Check Highest Card Among The Three Matching Specifically (CANNOT SPLIT)
            case 7:
                break;
            //6: Check Highest Card, If Same Check 2nd Highest Card Until Lowest, If Still Same Split Pot
            case 6:
                break;
            //3: Check Highest Pair, If Same: Check Other Pair, If Still Same: Split Pot
            case 3:
                break;
            //2: Check Which Pair Is Higher, If Same: Split Pot, otherwise highest wins
            case 2:
                break;
            //1: Check Which Card Is Higher, If Same: Split Pot
            //Check if this is correct
            case 1:
                break;
        }
    }
}

//Splits the pot among winners who tied
function splitPot(state: GameState, winners: PlayerState[]) {
    let new_pot = Math.floor(state.pot / winners.length);
    let remainder = state.pot % winners.length;
    for(Player winner of winners) {
    winner.stack += new_pot;
        if(remainder !== 0) {
            winner.strack += remainder;
            remainder = 0;
        }
    }
    state.pot = 0;
}