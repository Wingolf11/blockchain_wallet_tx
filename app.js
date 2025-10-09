import API_KEY from './config.js';

const address_display = document.getElementById("address_display");
const balance_amount_display = document.getElementById("balance_amount_display");


function convertWei(result) {
    let firstPart = BigInt(result) / 10n**18n;
    let secondPart = (BigInt(result) % 10n**18n).toString().padStart(18, "0").slice(0, 6);
    let eth = firstPart + "." + secondPart;
    let trimedETH = eth.replace(/\.?0+$/, ""); //removes unnassesary 0 if its the case.

    return trimedETH;
}

function displayTransactions(transactionData) {
    
}

async function fetchDataTransactions(walletAddress) {
    try {
        //if offline...

        const transactionResponse = await fetch(
            `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${API_KEY}`
        );
        const transactionData = await transactionResponse.json();
        //To check raw data:
            /*console.log("Raw response:", transactionData);*/
        if (!transactionData.status || transactionData.status === "0") {
            throw new Error (`Aucun résultat trouvé !`);
        } else {
            //console.log("✅ Success:", transactionData);
            //Call display function:
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);

    }

}

/*Get data function:*/
async function fetchDataBalance(walletAddress) {
    try {
        if (!navigator.onLine) {
            const stored = localStorage.getItem("walletData");
            if (stored) {
                const walletData = JSON.parse(stored);

                address_display.textContent = walletData.wallet;
                balance_amount_display.textContent = `${walletData.balance} ETH`;
                return;
            }
            else {
                throw new Error ("No internet connection and no stored data avaible");
            }
        }

        const response = await fetch(
            `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${API_KEY}`
        ); 
        const data = await response.json();
        
        //To check raw data:
            /*console.log("Raw response:", data);*/

        if (!data.status || data.status === "0") {
            throw new Error (`Aucun résultat trouvé !`);
        }else {
            //console.log("✅ Success:", data);
            let trimedETH = convertWei(data.result);

            address_display.textContent = walletAddress;
            balance_amount_display.textContent = `${trimedETH} ETH`;

            //Save to local storage:
            const walletData = {
                wallet: walletAddress,
                balance: trimedETH,
                lastFetched: new Date().toISOString()
            };
            localStorage.setItem("walletData", JSON.stringify(walletData));
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
        address_display.textContent = '';
        balance_amount_display.innerHTML = '<span id="address_display">Aucun résultat trouvé !</span>';

    }
}



document.getElementById('wallet_form').addEventListener('submit', function(e) {
    e.preventDefault();
    const walletAddress = document.getElementById("wallet_address_input").value.trim();
    if (walletAddress) {
        fetchDataBalance(walletAddress);
        fetchDataTransactions(walletAddress);
    }
});