import type { GameState, PlayerState, Result, SeatInput, TableConfig } from "./GameState"
import { nextSeat } from "./Dealer"
import type { deck } from "./Dealer"

//function to move between players?
//for (let step = 1; step <= players.length; step++) {
//Base on betting turns

//Very unfinished, not even usable but lays out kind of a plan for the main functions I want here
//The trouble is figuring out which cards are selected, making the cards buttons, etc.

//remove selected cards from hand
export function removeCards(step: int) {
    const p = players[(dealerIndex + step) % players.length]!
    int num_selected = 0;
    //for each card selected by this player
        p.hand.pop();
        num_selected++;
    drawCards(num_selected, p);
}

//draw random cards from the deck equal to number of cards removed
export function drawCards(num_selected: int, p: players) {
    for (let card = 0; card < num_selected; card++) {
        if (inHand(p)) p.hand.push(deck.pop()!)
    }
}
