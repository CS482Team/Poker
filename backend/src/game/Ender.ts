import type { GameState, PlayerState, Result, SeatInput, TableConfig } from "./GameState"
import type { Suit, Rank } from "./Card"

export const WINCONDS: Record<string, number> =
    {"Royal Flush": 10,
    "Straight Flush": 9,
    "Four of a Kind": 8,
    "Full House": 7,
    "Flush": 6,
    "Straight": 5,
    "Three of a Kind": 4,
    "Two Pair": 3,
    "Pair": 2,
    "High Card": 1} as const

export function scoreHands() {
    //for every player who has not folded
        //CHECKING CARDS FOR WIN CONDITION
        //Check If All Are Same Suit
        //Check If All are In Row
            //If Both Of Above
                //If High Card is Ace:
                    //Royal Flush (10)
                //Else:
                    //Straight Flush (9)
            //If Only Same Suit:
                //Flush (6)
            //If Only Same Row
                //Straight (5)
        //Else Check How Many Cards Match
            //4 Match
                //Four Of A Kind (8)
            //1 Set of 3 Match and 1 Set of 2 Match
                //Full House (7)
            //Else Just 1 Set of Three Matches
                //Three Of A Kind (4)
            //2 Sets of 2 Match
                //2 Pair (3)
            //1 Pair Matches
                //Pair (2)
        //Nothing Else Works
           //High Card (1)
}

export function declareWinner() {
    //Search For Player With Highest WINCOND
    //If 2 or More Players Share Highest WINCOND
        //10: Split Pot
        //9, 5: Check Highest Card Rank, If Same: split pot, otherwise highest wins
        //8, 4: Check Highest Card Among The Matching Numbers (CANNOT SPLIT)
        //7: Check Highest Card Among The Three Matching Specifically (CANNOT SPLIT)
        //6: Check Highest Card, If Same Check 2nd Highest Card Until Lowest, If Still Same Split Pot
        //3: Check Highest Pair, If Same: Check Other Pair, If Still Same: Split Pot
        //2: Check Which Pair Is Higher, If Same: Split Pot, otherwise highest wins
        //1: Check Which Card Is Higher, If Same: Split Pot
}