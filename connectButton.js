import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11';

export const HEMI_NETWORK = {
  chainId: '0xA867', // hex for 43111
  chainName: 'Hemi',
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

const updateConnectionState = (state) => {
  localStorage.setItem('walletConnection', JSON.stringify(state));
};

const loadConnectionState = () => {
  const state = localStorage.getItem('walletConnection');
  return state ? JSON.parse(state) : { isConnected: false };
};

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    Swal.fire('Ошибка', 'Пожалуйста, установите MetaMask!', 'error');
    return false;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let chainId = await provider.send('eth_chainId', []);

    if (chainId !== HEMI_NETWORK.chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HEMI_NETWORK.chainId }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [HEMI_NETWORK]
            });
            await new Promise(res => setTimeout(res, 800));
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: HEMI_NETWORK.chainId }]
            });
          } catch (addError) {
            Swal.fire('Ошибка', 'Не удалось добавить сеть Hemi: ' + addError.message, 'error');
            return false;
          }
        } else {
          Swal.fire('Ошибка', 'Не удалось переключить сеть: ' + switchError.message, 'error');
          return false;
        }
      }
    }

    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    currentAccount = await signer.getAddress();
    isConnected = true;

    updateConnectionState({ isConnected });
    updateButtonState();

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        currentAccount = accounts[0];
        updateButtonState();
      }
    });

    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка подключения: ' + error.message, 'error');
    return false;
  }
}

export function handleDisconnect() {
  isConnected = false;
  currentAccount = null;
  updateConnectionState({ isConnected: false });
  updateButtonState();
}

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

export function updateButtonState() {
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
