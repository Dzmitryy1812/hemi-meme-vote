import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

let isConnected = false;
let currentAccount = null;

// Сохраняем состояние в localStorage
const updateConnectionState = (state) => {
  localStorage.setItem('walletConnection', JSON.stringify(state));
};

// Загружаем состояние при запуске
const loadConnectionState = () => {
  const state = localStorage.getItem('walletConnection');
  return state ? JSON.parse(state) : { isConnected: false };
};

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const state = loadConnectionState();

    if (!state.isConnected) {
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      currentAccount = await signer.getAddress();
      isConnected = true;
      
      // Добавляем обработчик изменения аккаунтов
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          currentAccount = accounts[0];
          updateButtonState();
        }
      });
    } else {
      handleDisconnect();
    }

    updateConnectionState({ isConnected });
    updateButtonState();
    
  } catch (error) {
    console.error('Connection error:', error);
    alert('Connection error. Please try again.');
  }
}

const handleDisconnect = () => {
  isConnected = false;
  currentAccount = null;
  updateConnectionState({ isConnected: false });
  
  // Удаляем обработчики событий
  if (window.ethereum?.removeListener) {
    window.ethereum.removeListener('accountsChanged', () => {});
  }
};

// Обновленная проверка при загрузке
window.addEventListener('load', async () => {
  const state = loadConnectionState();
  if (state.isConnected && typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        isConnected = true;
        currentAccount = accounts[0];
        updateButtonState();
      }
    } catch (error) {
      handleDisconnect();
    }
  }
});

function updateButtonState() {
  const button = document.getElementById('connectButton');
  if (isConnected && currentAccount) {
    button.textContent = `Disconnect (${currentAccount.slice(0,6)}...${currentAccount.slice(-4)})`;
    button.classList.remove('bg-white/90', 'text-orange-600');
    button.classList.add('bg-red-600', 'text-white');
  } else {
    button.textContent = 'Connect Wallet';
    button.classList.remove('bg-red-600', 'text-white');
    button.classList.add('bg-white/90', 'text-orange-600');
  }
}
