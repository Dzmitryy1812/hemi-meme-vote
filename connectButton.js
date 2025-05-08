const HEMI_NETWORK = {
  chainId: '43111', // Замените на реальный chainId Hemi Network (hex)
  chainName: 'Hemi Network',
  nativeCurrency: {
    name: 'HEMI',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://rpc.hemi.network/rpc'], 
  blockExplorerUrls: ['https://explorer.hemi.xyz'] 
};

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

let isConnected = false;
let currentAccount = null;
let currentChainId = null;

// Добавленные функции
const switchToHemiNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HEMI_NETWORK.chainId }]
    });
    return true;
  } catch (error) {
    if (error.code === 4902) {
      return await addHemiNetwork();
    }
    console.error('Failed to switch network:', error);
    return false;
  }
};

const addHemiNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [HEMI_NETWORK]
    });
    return true;
  } catch (error) {
    console.error('Failed to add network:', error);
    return false;
  }
};

const checkNetwork = async () => {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return chainId === HEMI_NETWORK.chainId;
};

// Обновленная функция connectWallet
export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const state = loadConnectionState();

    if (!state.isConnected) {
      // Проверка и смена сети
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        const switched = await switchToHemiNetwork();
        if (!switched) {
          alert('Please connect to Hemi Network to continue');
          return;
        }
      }

      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      currentAccount = await signer.getAddress();
      currentChainId = await signer.getChainId();
      isConnected = true;

      // Обработчики событий
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } else {
      handleDisconnect();
    }

    updateConnectionState({ isConnected });
    updateUI();
    
  } catch (error) {
    console.error('Connection error:', error);
    alert('Connection error. Please try again.');
  }
}

// Новые обработчики событий
const handleAccountsChanged = (accounts) => {
  if (accounts.length === 0) {
    handleDisconnect();
  } else {
    currentAccount = accounts[0];
    updateUI();
  }
};

const handleChainChanged = (chainId) => {
  currentChainId = parseInt(chainId, 16);
  if (chainId !== HEMI_NETWORK.chainId) {
    alert('Please switch back to Hemi Network');
    handleDisconnect();
  }
  updateUI();
};

// Обновленная функция updateUI
const updateUI = () => {
  updateButtonState();
  updateNetworkIndicator();
};

const updateNetworkIndicator = () => {
  const networkIndicator = document.getElementById('networkIndicator');
  if (networkIndicator) {
    networkIndicator.textContent = currentChainId === parseInt(HEMI_NETWORK.chainId, 16) 
      ? 'Connected to Hemi Network' 
      : 'Wrong Network';
  }
};

// В обработчик загрузки страницы добавьте:
window.addEventListener('load', async () => {
  const state = loadConnectionState();
  if (state.isConnected && typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0 && currentChainId === HEMI_NETWORK.chainId) {
        isConnected = true;
        currentAccount = accounts[0];
        updateUI();
      }
    } catch (error) {
      handleDisconnect();
    }
  }
});
