var listOfCards = []
var listOfTransactions = []
var merchantMap = {}

function onClickCardUserBtn(){
	var cardUserBtn = document.getElementById("cardUserBtn")
	var merchantBtn = document.getElementById("merchantBtn")
	cardUserBtn.style.backgroundColor = "lightgray";
	merchantBtn.style.backgroundColor = "white";

	var cardUserDiv = document.getElementById("cardUser")
	var merchantDiv = document.getElementById("merchant")
	cardUserDiv.style.display = "block"
	merchantDiv.style.display = "none"
}

function onClickMerchantBtn(){
	var cardUserBtn = document.getElementById("cardUserBtn")
	var merchantBtn = document.getElementById("merchantBtn")
	cardUserBtn.style.backgroundColor = "white";
	merchantBtn.style.backgroundColor = "lightgray";

	var cardUserDiv = document.getElementById("cardUser")
	var merchantDiv = document.getElementById("merchant")
	cardUserDiv.style.display = "none"
	merchantDiv.style.display = "block"
	refreshMerchantViewModel()
}

function httpRequest(requestType, theUrl, params, callback)
{
    var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.responseText)
		}
	};
    xmlHttp.open( requestType, theUrl+"?"+params, true );
    xmlHttp.send();
}

function newCard() {
	// get owner name from text field
	var newCardOwnerName = document.getElementById("ownerName").value
	document.getElementById("ownerName").value = ""
	// create card on server side
	httpRequest("POST", window.location.href + "createCard", "owner="+newCardOwnerName, function(response){
		var newCard = JSON.parse(response)
		listOfCards.push(newCard)
		// generate the view
		generateCollapsibleCardView(listOfCards.length, newCard)
	})
}

function generateCollapsibleCardView(cardsIndex, card) {
	// create new div for the new card
	var newDivElm = document.createElement("div");
	var nextCardDivId = "card_" + cardsIndex.toString()
	newDivElm.id = nextCardDivId
	newDivElm.className = "border"
	newDivElm.style.padding = "0px 0px 10px 0px"
	// create and add new button to the newly created card div
	var collapsibleButton = document.createElement("button");
	collapsibleButton.id = "buttonCard" + cardsIndex.toString()
	collapsibleButton.className = "collapsible"
	var buttonText = nextCardDivId.replace("c", "C")
	buttonText = buttonText.replace("_", " ")
	collapsibleButton.innerHTML = buttonText
	// add click listner
	collapsibleButton.addEventListener("click", function() {
	    this.classList.toggle("active");
	    var content = this.nextElementSibling;
	    if (content.style.display === "block") {
	      content.style.display = "none";
	    } else {
	      content.style.display = "block";
	    }
	  });
	newDivElm.appendChild(collapsibleButton)
	// append card dashboard to new div elm
	var newP = generateCardDashboardElm(cardsIndex, card)
	newDivElm.appendChild(newP)
	// append div to section
	var sectionElm = document.getElementById("cardArticle")
	sectionElm.appendChild(newDivElm)
}

function generateCardDashboardElm(cardsIndex, card) {
	// create parent dashboard div
	var div = document.createElement("div");
	div.className = "row"
	div.style.display = "none"
	div.style.padding = "10px 10px 10px 10px"
	// create card details table

	var tableDiv = document.createElement("div")
	tableDiv.className = "column"
	var table = document.createElement("table")
	table.id = "table_"+cardsIndex
	var row = table.insertRow(0)
	row.style.backgroundColor = "#ffe6b3"; 
	var cell1 = row.insertCell(0)
    var cell2 = row.insertCell(1)
    var cell3 = row.insertCell(2)
    var cell4 = row.insertCell(3)

    cell1.innerHTML = "Card Number"
    cell2.innerHTML = "Card Owner"
    cell3.innerHTML = "Available Balance"
    cell4.innerHTML = "Blocked Balance"

	row = table.insertRow(1)
	cell1 = row.insertCell(0)
    cell2 = row.insertCell(1)
    cell3 = row.insertCell(2)
    cell4 = row.insertCell(3)

    cell1.innerHTML = card.card_id
    cell2.innerHTML = card.Owner
    cell3.innerHTML = card.available_balance
    cell4.innerHTML = card.blocked_balance
    tableDiv.appendChild(table)

	// purchase and refund forms
	var pf = generatePurchaseAndFundForms(cardsIndex)
	tableDiv.appendChild(pf)

	div.appendChild(tableDiv)

	var analyticsDiv = document.createElement("div")
	analyticsDiv.id = "analytics-" + card.card_id
	analyticsDiv.style.float = "left"
	generateCardAnalytics(analyticsDiv.id.split('-')[1])

	div.appendChild(analyticsDiv)

	return div
}

function generateCardAnalytics(cardID) {
	google.charts.load("current", {packages:["corechart"]})
	google.charts.setOnLoadCallback(drawChart)
	// find transactions for this card
	var cardTransactions = [["Merchant", "Amount"]]
	for (var i = 0; i < listOfTransactions.length; i++) {
		var transaction = listOfTransactions[i]
		if(transaction.CardId == cardID){
			var MerchantExists = false;
			for (var j = 0; j < cardTransactions.length; j++) {
				if(cardTransactions[j][0] == transaction.Merchant){
					MerchantExists = true;
					cardTransactions[j][1] += transaction.Amount
					break
				}
			}

			if(MerchantExists == false){
				cardTransactions.push([transaction.Merchant, transaction.Amount])				
			}
		}
	}

	function drawChart() {
		var data = google.visualization.arrayToDataTable(cardTransactions)
		var options = {
		  title: 'Spending Analytics',
		  pieHole: 0.4,
		  width:400,
          height:300
		}

		var chart = new google.visualization.PieChart(document.getElementById("analytics-"+cardID))
		chart.draw(data, options)
	}
}

function generatePurchaseAndFundForms(cardsIndex){
	// create parent purchase and refund forms div
	var div = document.createElement("div");

	// add purchase div to parent
	var pDiv = generatePurchaseDiv(cardsIndex)
	pDiv.style.padding = "10px 10px 10px 10px"
	div.appendChild(pDiv)

	// add purchase div to parent
	var fDiv = generateAddFundsDiv(cardsIndex)
	fDiv.style.padding = "10px 10px 10px 10px"
	div.appendChild(fDiv)

	return div
}

function generatePurchaseDiv(cardsIndex){
	// create purchase div
	var pDiv = document.createElement("div");
	pDiv.className = "w3-container w3-cell border"
	pDiv.style = "max-width:20%"
	
	// form
	var pForm = document.createElement("div");
	pForm.className = "w3-container"

	// input merchant's name
	var pInputMerchant = document.createElement("input");
	pInputMerchant.className = "w3-input w3-border"
	pInputMerchant.id = "inputMerchant"+cardsIndex
	pInputMerchant.placeholder = "Merchant's Name..."
	// input amount in GBP
	var pInputAmount = document.createElement("input");
	pInputAmount.className = "w3-input w3-border"
	pInputAmount.type = "number"
	pInputAmount.id = "inputAmountP"+cardsIndex
	pInputAmount.placeholder = "Amount in GBP..."
	// purchase button
	var pButton = document.createElement("button");
	pButton.className = "w3-button w3-blue w3-round"
	pButton.innerHTML = "Purchase"
	pButton.onclick = function(){ onClickPurchase(cardsIndex)}

	// add them to form
	pForm.appendChild(pInputMerchant)
	pForm.appendChild(pInputAmount)
	pForm.appendChild(pButton)

	// add form to purchase div
	pDiv.appendChild(pForm)

	return pDiv
}

function onClickPurchase(cardsIndex){
	var pInputMerchant = document.getElementById("inputMerchant"+cardsIndex)
	var pInputAmount = document.getElementById("inputAmountP"+cardsIndex)
	var params = "cardId="+listOfCards[cardsIndex-1].card_id+"&amount="+pInputAmount.value+"&merchant="+pInputMerchant.value
	httpRequest("POST", window.location.href + "purchase", params, function(response){
		purchaseResp = JSON.parse(response)
		refreshCardContent(purchaseResp["Card"])
		listOfTransactions.push(purchaseResp["Transaction"])
		generateCardAnalytics(purchaseResp["Card"].card_id)
	})
	pInputMerchant.value = ""
	pInputAmount.value = ""
}

function generateAddFundsDiv(cardsIndex){
	// create add fund form div
	var fDiv = document.createElement("div");
	fDiv.className = "w3-container w3-cell border"
	fDiv.style = "max-width:20%"

	// form
	var fForm = document.createElement("div");
	fForm.className = "w3-container"

	// input amount in GBP
	var fInputAmount = document.createElement("input");
	fInputAmount.className = "w3-input w3-border"
	fInputAmount.type = "number"
	fInputAmount.id = "inputAmountF"+cardsIndex
	fInputAmount.placeholder = "Amount in GBP..."
	// purchase button
	var fButton = document.createElement("button");
	fButton.className = "w3-button w3-blue w3-round"
	fButton.innerHTML = "Add Funds"
	fButton.onclick = function(){ onClickAddFunds(cardsIndex)}

	// add them to form
	fForm.appendChild(fInputAmount)
	fForm.appendChild(fButton)

	// add form to purchase div
	fDiv.appendChild(fForm)

	return fDiv
}

function onClickAddFunds(cardsIndex){
	var fInputAmount = document.getElementById("inputAmountF"+cardsIndex)
	var params = "cardId="+listOfCards[cardsIndex-1].card_id+"&amount="+fInputAmount.value
	httpRequest("POST", window.location.href + "addFunds", params, function(response){
		card = JSON.parse(response)
		refreshCardContent(card)
	})
	fInputAmount.value = ""
}

function refreshCardContent(card){
	for (var i = 0; i < listOfCards.length; i++) {
		if(listOfCards[i].card_id == card.card_id){
			// update the internal list with new card
			listOfCards[i] = card
			// find right table
			var table = document.getElementById("table_"+(i+1))
			// update balances
			table.rows[1].cells[2].innerHTML = card.available_balance
			table.rows[1].cells[3].innerHTML = card.blocked_balance
			break
		}
	}
}

function bootstrap(){
	refreshMerchantViewModel()
	refreshCardsViewModel()
}

function refreshCardsViewModel(){
	httpRequest("GET", window.location.href + "getAllCards", "", function(response){
		// check if response is a valid JSON format
		if (isValidJSON(response)) {
			if(response == "null" || response == ""){
				return
			}
			// set model
			listOfCards = JSON.parse(response)
			// remove collapsible cards
			var cardArticle = document.getElementById("cardArticle");
			while (cardArticle.firstChild) {
			    cardArticle.removeChild(cardArticle.firstChild);
			}
			// generate new card views
			for (var i = 0; i < listOfCards.length; i++) {
				// generate the view
				generateCollapsibleCardView(i+1, listOfCards[i])
			}
		}
	})
}

function refreshMerchantViewModel() {
	httpRequest("GET", window.location.href + "getTransactions", "", function(response){
		// check if response is a valid JSON format
		if (isValidJSON(response)) {
			if(response == "null" || response == ""){
				return
			}
			// set model
			listOfTransactions = JSON.parse(response)
			merchantMap = {}
			// update dropdown view
			for (var i = 0; i < listOfTransactions.length; i++) {
				var merchantName = listOfTransactions[i]["Merchant"]
				if(merchantMap[merchantName] == null){
					merchantMap[merchantName] = []
				}
				merchantMap[merchantName].push(listOfTransactions[i])
			}

			var merchantsDropDown = document.getElementById("merchantDropDown")
			for (const merchantName of Object.keys(merchantMap)) {
				if(optionExists(merchantName, merchantsDropDown)){
					continue
				}
			    var option = document.createElement("option");
			    option.value = merchantName;
			    option.text = merchantName;
			    merchantsDropDown.appendChild(option);
			}

			generateTransactionTable()
		}
	})
}

function generateTransactionTable() {
	// remove previous table
	var merchantArticle = document.getElementById("merchantArticle")
	while (merchantArticle.firstChild) {
	    merchantArticle.removeChild(merchantArticle.firstChild)
	}
	// generate new table
	var merchantName = document.getElementById("merchantDropDown").value

	// find transactions for this merchant
	var transactions = merchantMap[merchantName]

	var table = document.createElement("table")
	table.id = "table_"+merchantName
	table.className = "center"
	var row = table.insertRow(0)
	row.style.backgroundColor = "#ffe6b3"; 
	var cell1 = row.insertCell(0)
    var cell2 = row.insertCell(1)
    var cell3 = row.insertCell(2)
    var cell4 = row.insertCell(3)
    var cell5 = row.insertCell(4)
    var cell6 = row.insertCell(5)
    var cell7 = row.insertCell(6)

    cell1.innerHTML = "Transaction Number"
    cell2.innerHTML = "Card Number"
    cell3.innerHTML = "Amount (GBP)"
    cell4.innerHTML = "Amount to be Captured (GBP)"
    cell5.innerHTML = "Transaction Date"
    cell6.innerHTML = "Refunded"
    cell7.innerHTML = "Actions"

    // populate the transaction table
	for (var i = 0; i < transactions.length; i++) {
		var transaction = transactions[i]
		var row = table.insertRow(i+1)
		var cell1 = row.insertCell(0)
	    var cell2 = row.insertCell(1)
	    var cell3 = row.insertCell(2)
	    var cell4 = row.insertCell(3)
	    var cell5 = row.insertCell(4)
	    var cell6 = row.insertCell(5)
	    var cell7 = row.insertCell(6)

	    var isRefunded = transaction.IsRefunded
	    cell1.innerHTML = transaction.TransactionId
	    cell2.innerHTML = transaction.CardId
	    cell3.innerHTML = transaction.Amount
	    // add input and edit button
	    var inputCaptureAmount = document.createElement("input")
	    inputCaptureAmount.id = "inputCaptureAmount-"+transaction.TransactionId
		inputCaptureAmount.value = transaction.AmountToBeCaptured
		inputCaptureAmount.type = "number"
		inputCaptureAmount.style.minWidth = "100px"
		inputCaptureAmount.min = 0
		inputCaptureAmount.max = transaction.AmountToBeCaptured
	    var editBtn = document.createElement("button");
	    editBtn.id = "editBtn-"+transaction.TransactionId
		editBtn.className = "w3-button w3-blue w3-round"
		editBtn.innerHTML = "Save"
		editBtn.onclick = function(){editOpenTransaction(this.id.split('-')[1])}
	    cell4.appendChild(inputCaptureAmount)
	    cell4.appendChild(editBtn)

	    cell5.innerHTML = new Date(transaction.Timestamp).toDateString();
   		cell6.innerHTML = (isRefunded ? "Yes" : "No")
   		// add capture and refund buttons
   		var buttonsGrpDiv1 = document.createElement("div")
   		buttonsGrpDiv1.className = "btn-group"
   		buttonsGrpDiv1.style.padding = "10px"
	    var captureBtn = document.createElement("button");
	    captureBtn.id = "captureBtn-"+transaction.TransactionId
		captureBtn.className = "w3-button w3-green w3-round"
		captureBtn.innerHTML = "Capture"
		captureBtn.onclick = function(){captureAmount(this.id.split('-')[1])}

   		var buttonsGrpDiv2 = document.createElement("div")
   		buttonsGrpDiv2.className = "btn-group"
	    var refundBtn = document.createElement("button");
	    refundBtn.id = "refundBtn-"+transaction.TransactionId
		refundBtn.className = "w3-button w3-orange w3-round"
		refundBtn.innerHTML = "Refund"
		refundBtn.onclick = function(){refundAmount(this.id.split('-')[1])}

   		buttonsGrpDiv1.appendChild(captureBtn)
   		buttonsGrpDiv2.appendChild(refundBtn)
   		cell7.appendChild(buttonsGrpDiv1)
   		cell7.appendChild(buttonsGrpDiv2)
	}
    merchantArticle.appendChild(table)
}

function captureAmount(transactionId){
	var captureAmount = document.getElementById("inputCaptureAmount-"+transactionId).value
	var params = "transactionId="+transactionId+"&amount="+captureAmount
	httpRequest("POST", window.location.href + "captureAmount", params, function(response){
		bootstrap()
	})
}

function refundAmount(transactionId){
	var params = "transactionId="+transactionId
	httpRequest("POST", window.location.href + "refund", params, function(response){
		bootstrap()
	})
	var refundBtn = document.getElementById("refundBtn-"+transactionId.TransactionId)
	refundBtn.disabled = true
}

function editOpenTransaction(transactionId){
	var editedCaptureAmount = document.getElementById("inputCaptureAmount-"+transactionId).value
	var params = "transactionId="+transactionId+"&newAmount="+editedCaptureAmount
	httpRequest("POST", window.location.href + "editOpenTransaction", params, function(response){
		bootstrap()
	})
}

function optionExists(optionToSearch, selectElm) {
    var optionExists = false
    var optionsLength = selectElm.length
    while ( optionsLength-- ){
        if ( selectElm.options[optionsLength].value === optionToSearch ){
            optionExists = true;
            break;
        }
    }
    return optionExists;
}

function isValidJSON(jsonStr) {
	if (/^[\],:{}\s]*$/.test(jsonStr.replace(/\\["\\\/bfnrtu]/g, '@').
			replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
			replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
		return true
	}
	return false
}
