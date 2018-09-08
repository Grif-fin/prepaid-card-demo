package main

import (
    "sync"
    "math/rand"
	"time"
)

type ledger struct {
	cards []*Card
	transactions []*Transaction
}

// ============ Functionalities ============

// create new card
func (l *ledger) AddNewCard (Owner string) *Card{
	c := new(Card)
	c.CardId = rand.Intn(100000)
	c.Owner = Owner
	c.AvailableBalance = 0
	c.BlockedBalance = 0
	l.cards = append(l.cards, c)
	return c
}

// top up the card
func (l *ledger) TopUpCard (CardId int, Amount int) {
	card := l.FindCard(CardId)
	if (card != nil) {
	    card.Add(Amount)
	}
}

// validate Amount for authorization request
func (l *ledger) AmountAuthorization (CardId int, Amount int) bool {
	card := l.FindCard(CardId)
	if (card != nil) {
		return card.ValidateCharge(Amount)
	}
	return false
}

// block/earmark the Amount
func (l *ledger) ChargeCard (CardId int, Amount int, Merchant string) (*Transaction, *Card){
	card := l.FindCard(CardId)
	if (card != nil) {
		if(card.Withdraw(Amount)){
			// create a new transaction
			t := new(Transaction)
			t.TransactionId = rand.Intn(100000)
			t.CardId = CardId
			t.Amount = Amount
			t.Merchant = Merchant
			t.Timestamp = time.Now()
			t.AmountToBeCaptured = Amount
			t.IsRefunded = false
			l.transactions = append(l.transactions, t)
			return t, card
		}
	}
	return nil, nil
}

// Merchant can decide to reverse the whole or part of the initial Authorization
func (l *ledger) EditOpenTransaction (TransactionId int, newAmount int) bool {
	transaction := l.FindTransaction(TransactionId)
	// if transaction exists, no Amount has been captured and new Amount is less than original then edit the Amount
	if (transaction != nil && 
		transaction.Amount == transaction.AmountToBeCaptured &&
		newAmount < transaction.Amount) {
		card := l.FindCard(transaction.CardId)
		if (card != nil) {
			card.ReverseWithdraw(transaction.Amount - newAmount)
			transaction.Amount = newAmount
			transaction.AmountToBeCaptured = newAmount
			return true
		}
	}
	return false
}

// capture the blocked/earmark Amount
func (l *ledger) CaptureAmount (TransactionId int, Amount int) (*Card,*Transaction){
	transaction := l.FindTransaction(TransactionId)
	if (transaction != nil) {
	    if (transaction.CaptureTransaction(Amount)) {
	    	card := l.FindCard(transaction.CardId)
			if (card != nil) {
			    card.Capture(Amount)
			    return card, transaction
			}
		}
	}
	return nil, nil
}

func (l *ledger) RefundAmount (TransactionId int) bool {
	transaction := l.FindTransaction(TransactionId)
	if (transaction != nil &&
		transaction.AmountToBeCaptured == 0 &&
		transaction.IsRefunded == false) { // make sure the transaction is setteled and not already refunded
		card := l.FindCard(transaction.CardId)
		if (card != nil) {
			transaction.IsRefunded = true
			card.Add(transaction.Amount)
			return true
		}
	}
	return false
}

func (l *ledger) GetAllCards () []*Card{
	return l.cards
}

func (l *ledger) GetAllTransactions () []*Transaction{
	return l.transactions
}

// ============ get a singletone instance of a ledger ============
var instance *ledger
var once sync.Once

func GetLedger() *ledger {
    once.Do(func() {
        instance = &ledger{}
    })
    return instance
}

// ============ utils functions ============
func (l *ledger) FindCard (CardId int) *Card{
	for i := range l.cards {
		// find the card matches with given card ID
	    if (l.cards[i].CardId == CardId) {
	        return l.cards[i]
	    }
	}
	return nil
}

func (l *ledger) FindTransaction (TransactionId int) *Transaction{
	for i := range l.transactions {
		// find the card matches with given card ID
	    if (l.transactions[i].TransactionId == TransactionId) {
	        return l.transactions[i]
	    }
	}
	return nil
}
