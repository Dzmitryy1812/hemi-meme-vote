// walletConnect.js
export async function connectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const btn = document.getElementById('connectButton');
        btn.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`;
        btn.classList.add('bg-green-100', 'text-green-700', 'hover:scale-100');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
