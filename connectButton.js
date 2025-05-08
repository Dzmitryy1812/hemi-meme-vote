import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

const HEMI_NETWORK = {
  chainId: '0xA867', // hex для 43111
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
    alert('Please install MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let chainId = await provider.send('eth_chainId', []);

    // Если не на нужной сети, пытаемся переключиться
    if (chainId !== HEMI_NETWORK.chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HEMI_NETWORK.chainId }]
        });
      } catch (switchError) {
        // Если сеть не добавлена, добавляем её и снова пытаемся переключиться
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [HEMI_NETWORK]
            });
            // После добавления обязательно пробуем переключиться ещё раз!
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: HEMI_NETWORK.chainId }]
            });
          } catch (addError) {
            alert('Не удалось добавить сеть Hemi');
            return;
          }
        } else {
          alert('Ошибка переключения сети');
          return;
        }
      }
    }

    // Теперь мы точно на нужной сети, подключаем аккаунт
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
  } catch (error) {
    console.error('Connection error:', error);
    alert('Error: ' + (error && error.message ? error.message : JSON.stringify(error)));

  }
}

const handleDisconnect = () => {
  isConnected = false;
  currentAccount = null;
  updateConnectionState({ isConnected: false });
  updateButtonState();

  if (window.ethereum?.removeListener) {
    window.ethereum.removeListener('accountsChanged', () => {});
  }
};

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
