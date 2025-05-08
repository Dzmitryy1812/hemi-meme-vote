import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Состояние подключения
let isConnected = false;
let currentAccount = null;

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Пожалуйста, установите MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Проверка подключения
    if (!isConnected) {
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      currentAccount = await signer.getAddress();
      isConnected = true;
    } else {
      // Логика отключения
      currentAccount = null;
      isConnected = false;
    }

    updateButtonState();
    
  } catch (error) {
    console.error('Ошибка подключения:', error);
    alert('Произошла ошибка при подключении кошелька');
  }
}

function updateButtonState() {
  const button = document.getElementById('connectButton');
  
  if (isConnected && currentAccount) {
    button.textContent = `Отключить (${currentAccount.slice(0,6)}...${currentAccount.slice(-4)})`;
    button.classList.remove('bg-white/90', 'text-orange-600');
    button.classList.add('bg-red-600', 'text-white');
  } else {
    button.textContent = 'Подключить кошелёк';
    button.classList.remove('bg-red-600', 'text-white');
    button.classList.add('bg-white/90', 'text-orange-600');
  }
}

// Автоматическая проверка подключения при загрузке
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
