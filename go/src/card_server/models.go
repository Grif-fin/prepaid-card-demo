package main

import (
	"time"
    "log"
	)

type Card struct {
	CardId int `json:"card_id"`// unique int 
	Owner string `json:"Owner"`
	AvailableBalance int `json:"available_balance"`
	BlockedBalance int `json:"blocked_balance"`	// AvailableBalance - BlockedBalance = (Amount authorized to be captured by Merchants)
}

type Transaction struct {
	TransactionId int
	CardId int
	Amount int
	Merchant string
	Timestamp time.Time
	AmountToBeCaptured int
	IsRefunded bool
}

// ============ Card Functionalities ============

func (card *Card) ValidateCharge (Amount int) bool {
	if (card.BlockedBalance - Amount >= 0) {
		return true
	}
	return false
}

// top up the card
func (card *Card) Add (Amount int) {
    card.AvailableBalance += Amount
    card.BlockedBalance += Amount
}

// charge the available balance
func (card *Card) Withdraw (Amount int) bool {
	if (card.ValidateCharge(Amount)) {
    	card.BlockedBalance -= Amount
    	return true
	} else {
		log.Println("Failed to withdraw money. Insufficient funds!")
		return false
	}
}

// reverse withdraw (whole or partial)
func (card *Card) ReverseWithdraw (Amount int) {
	card.BlockedBalance += Amount
}

// capture the authorized Amount
func (card *Card) Capture (Amount int) bool {
	if (card.AvailableBalance - Amount >= 0) {
		card.AvailableBalance -= Amount
		return true
	} else {
		log.Println("Failed to capture money. Insufficient funds!")
		return false
	}
}

// ============ Transaction Functionalities ============

func (transaction *Transaction) CaptureTransaction (Amount int) bool {
	if(transaction.AmountToBeCaptured - Amount >= 0) {
		transaction.AmountToBeCaptured -= Amount
		return true
	} else {
		log.Println("Capturing more than Amount authorized!")
		return false
	}
}
