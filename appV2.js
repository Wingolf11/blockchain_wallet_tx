import API_KEY from './config.js';
//const API_KEY = 'APIKEY';

const address_display = document.getElementById("address_display");
let balance_amount_display = document.getElementById("balance_amount_display");
const transactionSection = document.getElementById("transactions");
let balance = document.getElementById("balance");

function convertWei(result) {
    let firstPart = BigInt(result) / 10n**18n;
    let secondPart = (BigInt(result) % 10n**18n).toString().padStart(18, "0").slice(0, 6);
    let eth = firstPart + "." + secondPart;
    let trimedETH = eth.replace(/\.?0+$/, ""); //removes unnassesary 0 if its the case.

    //console.log("Balance: ", trimedETH);
    return trimedETH;
}

//Fetches data and saves localy:
async function fetchData (walletAddress) {
    try {
        const balanceResponse = await fetch(
            `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${API_KEY}`
        );
        const transactionResponse = await fetch(
            `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${API_KEY}`
        ); 
        const balanceData = await balanceResponse.json();
        //console.log("Balance Data: ", balanceData);
        const transactionData = await transactionResponse.json();
        //console.log("Transaction Data: ", transactionData);
        if (balanceData.status === "0" || transactionData.status === "0") {
            throw new Error (`Aucun Wallet trouvé: ${walletAddress}`);
        } else {
            let trimedETH = convertWei(balanceData.result);
            const walletData = {
                wallet: walletAddress,
                balance: trimedETH,
                transactions: {
                    fiveTransactions: [],
                    inAndOut: [],
                    transactionLinks: []
                },
                lastFetched: new Date().toISOString()
            };
            transactionData.result.slice(0, 5).forEach(tx => {
                walletData.transactions.fiveTransactions.push(convertWei(tx.value));
                walletData.transactions.inAndOut.push(tx.to.toLowerCase() === walletAddress.toLowerCase());
                walletData.transactions.transactionLinks.push(tx.hash);
            });
            localStorage.setItem("walletData", JSON.stringify(walletData));
            
            return walletData; 
        }
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

function errorBehaviour () {
    //Balance elements:
    address_display.innerHTML = '<span id="address_display">Aucun résultat trouvé !</span>';
    balance_amount_display.remove();

    //Transaction elements:
    transactionSection.querySelectorAll(".transaction_item, hr").forEach(el => el.remove());
    const article = document.createElement("p");
    article.classList.add("plain-text");
    article.innerHTML = '<span class="plain-text">Aucun résultat trouvé !</span>';
    transactionSection.appendChild(article);
}

function offlineBehaviour (walletAddress) {
    try {
        const stored = localStorage.getItem("walletData");
        if (stored) {
            const walletData = JSON.parse(stored);
            if (walletData.wallet === walletAddress) {
                displayBalance(walletData);
                displayTransactions(walletData);
                return true;
            } else {
                throw new Error ("No internet connection and no stored data for this wallet");
            }
        } else {
            throw new Error ("No internet connection and no stored data avaible");
        }
    } catch (error) {
        console.error("Offline Behaviour:", error.message);
        return false;
    }
}

//Display transactions:
function displayTransactions(walletData) {
    try {
        //If error message displayed then remove before printing anything else:
        document.querySelectorAll(".plain-text").forEach(el => el.remove());

        if (!walletData) {
            throw new Error ("No available data for transactions");
        } else {

            //Removes current transactions content and html:
            transactionSection.querySelectorAll(".transaction_item, hr").forEach(el => el.remove());

            const { fiveTransactions, inAndOut, transactionLinks } = walletData.transactions;
            for (let i = 0; i < fiveTransactions.length; i++) {
                const transactionType = inAndOut[i];       // true = IN, false = OUT
                const amount = fiveTransactions[i];
                const links = transactionLinks[i];

                const article = document.createElement("article");
                article.classList.add("transaction_item");

                article.innerHTML = `
                    <span class="${transactionType ? "in_transaction" : "out_transaction"}">${transactionType ? "IN" : "OUT"}</span>
                    <span class="transaction_amount">${amount} ETH</span>
                    <a href="https://etherscan.io/tx/${links}" target= "_blank" title= "https://etherscan.io/tx/..." class="voir_transaction_button">Voir</a>
                `;

                const hr = document.createElement("hr");
                transactionSection.appendChild(article);
                transactionSection.appendChild(hr);
            }
        }
        return true;
    } catch (error) {
        console.error("Fetch failed:", error.message);
        return false;
    }
}

function displayBalance(walletData) {
    try {
        if (!walletData) {
            throw new Error ("Aucune wallet disponible, check: fetch, localStorage, walletData object");
        } else {
            //console.log("✅ Success:", data);
            let trimedETH = walletData.balance;

            address_display.textContent = walletData.wallet;
            if (!document.getElementById("balance_amount_display")) {
                //console.log("IF STATEMENT");
                balance_amount_display = document.createElement('span');
                balance_amount_display.id = "balance_amount_display";
                balance.appendChild(balance_amount_display);
            }
            balance_amount_display.textContent = `${trimedETH} ETH`;
        }
        return true;
    } catch (error) {
        console.error("Fetch failed:", error.message);
        return false;
    }
}

//MAIN:
//Event "Voir Wallet" button:
document.getElementById('wallet_form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const walletAddress = document.getElementById("wallet_address_input").value.trim();
    if (!navigator.onLine) {
        //offline function:
        let offlineStatus = offlineBehaviour(walletAddress);
        if (offlineStatus == false) {
            errorBehaviour();
        }
    }
    else {
        if (walletAddress) {
            //calls the function fetchData:
            const walletData = await fetchData(walletAddress);
            //Check saved Data:
            //console.log(walletData);
            let balanceStatus = displayBalance(walletData);
            let transactionStatus = displayTransactions(walletData);
            if (balanceStatus == false && transactionStatus == false) {
                errorBehaviour();
            }
        }
    }
});