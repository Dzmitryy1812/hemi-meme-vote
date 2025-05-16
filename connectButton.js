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

export async function connectWallet() {
  console.log('Starting connectWallet, window.ethereum:', typeof window.ethereum);
  if (typeof window.ethereum === 'undefined') {
    console.error('MetaMask is not detected');
    window.Swal.fire('Ошибка', 'Пожалуйста, установите и активируйте MetaMask!', 'error');
    return false;
  }

  if (typeof window.ethers === 'undefined') {
    console.error('ethers is not loaded');
    window.Swal.fire('Ошибка', 'Библиотека ethers не загружена.', 'error');
    return false;
  }

  try {
    const provider = new window.ethers.providers.Web3Provider(window.ethereum);
    let chainId = await provider.send('eth_chainId', []);
    console.log('Current chainId:', chainId);

    if (chainId !== HEMI_NETWORK.chainId) {
      console.log('Switching to Hemi Network');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HEMI_NETWORK.chainId }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          console.log('Adding Hemi Network');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HEMI_NETWORK]
          });
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HEMI_NETWORK.chainId }]
          });
        } else {
          console.error('Failed to switch network:', switchError);
          window.Swal.fire('Ошибка', 'Не удалось переключить сеть: ' + switchError.message, 'error');
          return false;
        }
      }
    }

    console.log('Requesting accounts');
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    currentAccount = await signer.getAddress();
    isConnected = true;
    console.log('Connected account:', currentAccount);

    updateButtonState();

    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        currentAccount = accounts[0];
        updateButtonState();
      }
    });

    return true;
  } catch (error) {
    console.error('Connection error:', error);
    window.Swal.fire('Ошибка', 'Ошибка подключения: ' + error.message, 'error');
    return false;
  }
}

export function handleDisconnect() {
  console.log('Disconnecting wallet');
  isConnected = false;
  currentAccount = null;
  updateButtonState();
}

function updateButtonState() {
  const button = document.getElementById('connectButton');
  if (!button) {
    console.error('Connect button not found');
    return;
  }

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
