import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

let isConnected = false;
let currentAccount = null;

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    if (!isConnected) {
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      currentAccount = await signer.getAddress();
      isConnected = true;
    } else {
      currentAccount = null;
      isConnected = false;
    }

    updateButtonState();
    
  } catch (error) {
    console.error('Connection error:', error); // Исправлено на английский
    alert('Connection error. Please try again.');
  }
}

function updateButtonState() {
  const button = document.getElementById('connectButton');
  
  if (isConnected && currentAccount) {
    button.textContent = `Disconnect (${currentAccount.slice(0,6)}...${currentAccount.slice(-4)})`; // Исправлено
    button.classList.remove('bg-white/90', 'text-orange-600');
    button.classList.add('bg-red-600', 'text-white');
  } else {
    button.textContent = 'Connect Wallet'; // Исправлено
    button.classList.remove('bg-red-600', 'text-white');
    button.classList.add('bg-white/90', 'text-orange-600');
  }
}

window.addEventListener('load', async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      isConnected = true;
      currentAccount = accounts[0];
      updateButtonState();
    }
  }
});
