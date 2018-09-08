package main

import (
    "fmt"
    "net/http"
    "encoding/json"
    "strconv"
    "log"
)

func createCard(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "POST") {
        owners, ok := r.URL.Query()["owner"]
        // validate parameter
        if (!ok || owners == nil || len(owners) != 1) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        cardOwner := owners[0]
        log.Println("createCard: Owner " + string(cardOwner))
        // create the new card
        ledger := GetLedger()
        newlyCreatedCard := ledger.AddNewCard(cardOwner)
        newlyCreatedCardJson, err := json.Marshal(newlyCreatedCard)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with the new card details
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(newlyCreatedCardJson)
    }
}

func addFunds(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "POST") {
        params := r.URL.Query()
        cardId, ciOk := params["cardId"]
        amount, aOk := params["amount"]
        // validate parameters
        if (!ciOk || !aOk || cardId == nil || amount == nil) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        cardIdInt, _ := strconv.Atoi(cardId[0])
        amountInt, _ := strconv.Atoi(amount[0])
        log.Printf("addFunds: CardId %d Amount %d", cardIdInt, amountInt)
        // add new funds
        ledger := GetLedger()
        ledger.TopUpCard(cardIdInt, amountInt)
        card := ledger.FindCard(cardIdInt)
        cardJson, err := json.Marshal(card)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with the new card details
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(cardJson)
    }
}

func authorizeAmount(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "GET") {
        params := r.URL.Query()
        cardId, ciOk := params["cardId"]
        amount, aOk := params["amount"]
        // validate parameters
        if (!ciOk || !aOk || cardId == nil || amount == nil) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        cardIdInt, _ := strconv.Atoi(cardId[0])
        amountInt, _ := strconv.Atoi(amount[0])
        log.Printf("authorizeAmount: CardId %d, Amount %d", cardIdInt, amountInt)
        // check amount authorization
        ledger := GetLedger()
        isAuthorized := ledger.AmountAuthorization(cardIdInt, amountInt)
        type AuthorizedResp struct {
            CardId     int
            Amount   int
            IsAuthorized bool
        }
        authorizedResp := AuthorizedResp{
            CardId:     cardIdInt,
            Amount:   amountInt,
            IsAuthorized: isAuthorized,
        }
        authorizedRespJson, err := json.Marshal(authorizedResp)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with the authorization response
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(authorizedRespJson)
    }
}

func purchase(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "POST") {
        params := r.URL.Query()
        cardId, ciOk := params["cardId"]
        amount, aOk := params["amount"]
        merchant, mOk := params["merchant"]
        // validate parameters
        if (!ciOk || !aOk || !mOk || cardId == nil || amount == nil || merchant == nil) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        cardIdInt, _ := strconv.Atoi(cardId[0])
        amountInt, _ := strconv.Atoi(amount[0])
        log.Printf("purchase: CardId %d Amount %d Merchant %s", cardIdInt, amountInt, merchant)
        // charge the card
        ledger := GetLedger()
        transaction, card := ledger.ChargeCard(cardIdInt, amountInt, merchant[0])
        type PurchaseResp struct {
            Card *Card
            Transaction *Transaction
        }
        purchaseResp := PurchaseResp{
            Card:     card,
            Transaction:   transaction,
        }
        purchaseRespJson, err := json.Marshal(purchaseResp)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with the new transaction made
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(purchaseRespJson)
    }
}

func editOpenTransaction(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "POST") {
        params := r.URL.Query()
        transactionId, tiOk := params["transactionId"]
        newAmount, naOk := params["newAmount"]
        // validate parameters
        if (!tiOk || !naOk || transactionId == nil || newAmount == nil) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        transactionIdInt, _ := strconv.Atoi(transactionId[0])
        newAmountInt, _ := strconv.Atoi(newAmount[0])
        log.Printf("editOpenTransaction: TransactionId %d NewAmount %d", transactionIdInt, newAmountInt)
        // edit open transaction
        ledger := GetLedger()
        isEdited := ledger.EditOpenTransaction(transactionIdInt, newAmountInt)
        type EditTransactionResp struct {
            TransactionIdInt     int
            NewAmountInt   int
            IsEdited bool
        }
        editedTransactionResp := EditTransactionResp{
            TransactionIdInt:     transactionIdInt,
            NewAmountInt:   newAmountInt,
            IsEdited: isEdited,
        }
        editedTransactionRespJson, err := json.Marshal(editedTransactionResp)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with result
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(editedTransactionRespJson)
    }
}

func captureAmount(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "POST") {
        params := r.URL.Query()
        transactionId, tiOk := params["transactionId"]
        amount, aOk := params["amount"]
        // validate parameters
        if (!tiOk || !aOk || transactionId == nil || amount == nil) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        transactionIdInt, _ := strconv.Atoi(transactionId[0])
        amountInt, _ := strconv.Atoi(amount[0])
        log.Printf("captureAmount: TransactionId %d Amount %d", transactionIdInt, amountInt)
        // capture amount
        ledger := GetLedger()
        card, transaction := ledger.CaptureAmount(transactionIdInt, amountInt)
        type CaptureAmountResp struct {
            Card *Card
            Transaction *Transaction
        }
        captureAmountResp := CaptureAmountResp{
            Card:     card,
            Transaction:   transaction,
        }
        captureAmountRespJson, err := json.Marshal(captureAmountResp)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with result
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(captureAmountRespJson)
    }
}

func refund(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "POST") {
        params := r.URL.Query()
        transactionId, tiOk := params["transactionId"]
        // validate parameters
        if (!tiOk || transactionId == nil) {
            log.Println("Invalid parameter!")
            fmt.Fprintf(w, "ERROR: Invalid parameter!")
            return
        }
        transactionIdInt, _ := strconv.Atoi(transactionId[0])
        log.Printf("refund: TransactionId %d", transactionIdInt)
        // refund a transaction
        ledger := GetLedger()
        refundRes := ledger.RefundAmount(transactionIdInt)
        type RefundResp struct {
            TransactionId int
            IsRefunded bool
        }
        refundResp := RefundResp{
            TransactionId: transactionIdInt,
            IsRefunded: refundRes,
        }
        refundRespJson, err := json.Marshal(refundResp)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        // repond with result
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(refundRespJson)
    }
}

func getAllCards(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "GET") {
        ledger := GetLedger()
        allCards := ledger.GetAllCards()
        allCardsJson, err := json.Marshal(allCards)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(allCardsJson)
    }
}

func getTransactions(w http.ResponseWriter, r *http.Request) {
    if (r.Method == "GET") {
        ledger := GetLedger()
        allTransactions := ledger.GetAllTransactions()
        allTransactionsJson, err := json.Marshal(allTransactions)
        if (err != nil) {
            fmt.Println(err)
            fmt.Fprintf(w, "ERROR 500")
            return
        }
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write(allTransactionsJson)
    }
}

func main() {
    http.Handle("/", http.FileServer(http.Dir("./public")))
    http.HandleFunc("/createCard", createCard)
    http.HandleFunc("/addFunds", addFunds)
    http.HandleFunc("/authorizeAmount", authorizeAmount)
    http.HandleFunc("/purchase", purchase)
    http.HandleFunc("/editOpenTransaction", editOpenTransaction)
    http.HandleFunc("/captureAmount", captureAmount)
    http.HandleFunc("/refund", refund)
    http.HandleFunc("/getAllCards", getAllCards)
    http.HandleFunc("/getTransactions", getTransactions)

    err := http.ListenAndServe(":9090", nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func printAll(l *ledger) {
    for _, p := range l.cards {
        fmt.Printf("%+v\n\n", p)
    }
        for _, a := range l.transactions {
        fmt.Printf("%+v\n\n", a)
    }
}

func printAllForHomePage(l *ledger) string{
    cardsInfo := ""
    for _, p := range l.cards {
        cardsInfo += fmt.Sprintf("%+v\n\n", p)
    }
    transactionsInfo := ""
    for _, a := range l.transactions {
        transactionsInfo += fmt.Sprintf( "%+v\n\n", a)
    }

    return cardsInfo + transactionsInfo
}
