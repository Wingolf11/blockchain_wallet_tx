const API_KEY = `api_key`;

const address_display = document.getElementById("address_display");
const balance_amount_display = document.getElementById("balance_amount_display");


function convertWei(result) {
    let firstPart = BigInt(result) / 10n**18n;
    let secondPart = (BigInt(result) % 10n**18n).toString().padStart(18, "0");
    let eth = firstPart + "." + secondPart;
    let trimedETH = eth.replace(/\.?0+$/, ""); //removes unnassesary 0.

    return trimedETH;
}


/*Get data function:*/
async function fetchData(walletAddress) {
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
        //To check raw data:
            /*const data = await response.json();
            console.log("Raw response:", data);*/

        if (!data.status || data.status === "0") {
            throw new Error (`Data status: ${data.message}`);
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
    }
}



document.getElementById('wallet_form').addEventListener('submit', function(e) {
    e.preventDefault();
    const walletAddress = document.getElementById("wallet_address_input").value.trim();
    if (walletAddress) {
        fetchData(walletAddress);
    }
});