import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Объявляем объект HEMI_NETWORK с правильным chainId в hex
const HEMI_NETWORK = {
  chainId: '0xA867', // hex для 43111
  chainName: 'Hemi Network',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://rpc.hemi.network/rpc'],
  blockExplorerUrls: ['https://explorer.hemi.xyz']
};

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

// Основная функция подключения
export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const chainId = await provider.send('eth_chainId', []);

    // Проверяем, что мы на нужной сети
    if (chainId !== HEMI_NETWORK.chainId) {
      // Переключение сети
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HEMI_NETWORK.chainId }]
        });
      } catch (switchError) {
        // Если сеть не добавлена, добавляем её
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HEMI_NETWORK]
          });
        } else {
          throw switchError;
        }
      }
    }

    // Запрос аккаунтов
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    currentAccount = await signer.getAddress();
    isConnected = true;

    // Обновляем состояние
    updateConnectionState({ isConnected });
    updateButtonState();

    // Обработчик смены аккаунтов
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        currentAccount = accounts[0];
        updateButtonState();
      }
    });
  } catch (error) {
    console.error('Connection error:', error);
    alert('Connection error. Please try again.');
  }
}

// Обработчик отключения
const handleDisconnect = () => {
  isConnected = false;
  currentAccount = null;
  updateConnectionState({ isConnected: false });
  updateButtonState();

  // Удаляем слушатели
  if (window.ethereum?.removeListener) {
    window.ethereum.removeListener('accountsChanged', () => {});
  }
};

// Проверка при загрузке страницы
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

// Обновление текста и стилей кнопки
function updateButtonState() {
  const button = document.getElementById('connectButton');
  if (!button) return;

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
