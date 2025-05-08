const HEMI_NETWORK = {
  chainId: '0xA867', // Hex value for 43111
  chainName: 'Hemi Network',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH', //
    decimals: 18
  },
  rpcUrls: ['https://rpc.hemi.network/rpc'],
  blockExplorerUrls: ['https://explorer.hemi.xyz']
};

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

let isConnected = false;
let currentAccount = null;
let currentChainId = null;

// Функция преобразования chainId
const toHexChainId = (chainId) => {
  if (typeof chainId === 'number') return `0x${chainId.toString(16)}`;
  return chainId.startsWith('0x') ? chainId : `0x${parseInt(chainId, 10).toString(16)}`;
};

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
    console.error('Network switch failed:', error);
    alert('Failed to switch network. Please try manually.');
    return false;
  }
};

const addHemiNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        ...HEMI_NETWORK,
        chainId: HEMI_NETWORK.chainId
      }]
    });
    return true;
  } catch (error) {
    console.error('Network addition failed:', error);
    alert('Failed to add Hemi Network. Please contact support.');
    return false;
  }
};

const checkNetwork = async () => {
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId.toLowerCase() === HEMI_NETWORK.chainId.toLowerCase();
  } catch (error) {
    console.error('Network check failed:', error);
    return false;
  }
};

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask extension not detected!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    if (!isConnected) {
      if (!await checkNetwork()) {
        const confirmSwitch = confirm('Switch to Hemi Network?');
        if (!confirmSwitch) return;
        
        const switched = await switchToHemiNetwork();
        if (!switched) {
          handleDisconnect();
          return;
        }
      }

      const accounts = await provider.send('eth_requestAccounts', []);
      currentAccount = accounts[0];
      currentChainId = await provider.send('eth_chainId');
      isConnected = true;

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } else {
      handleDisconnect();
    }

    updateUI();
    
  } catch (error) {
    console.error('Connection failed:', error);
    handleDisconnect();
    alert('Connection failed. Please try again.');
  }
}

const handleChainChanged = (newChainId) => {
  newChainId = toHexChainId(newChainId);
  currentChainId = newChainId;
  
  if (newChainId !== HEMI_NETWORK.chainId) {
    alert('Network changed! Please reconnect to Hemi Network.');
    handleDisconnect();
  }
  updateUI();
};

// Обновленная функция проверки сети при загрузке
window.addEventListener('load', async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const [accounts, chainId] = await Promise.all([
        window.ethereum.request({ method: 'eth_accounts' }),
        window.ethereum.request({ method: 'eth_chainId' })
      ]);
      
      currentChainId = toHexChainId(chainId);
      if (accounts.length > 0 && currentChainId === HEMI_NETWORK.chainId) {
        isConnected = true;
        currentAccount = accounts[0];
        updateUI();
      }
    } catch (error) {
      console.error('Initial connection check failed:', error);
      handleDisconnect();
    }
  }
});
