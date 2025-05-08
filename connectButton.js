import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []); // Запрос на подключение кошелька
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    // Отображение адреса и смена кнопки на "Disconnect"
    const button = document.getElementById('connectButton');
    button.textContent = `Disconnect (${address.slice(0, 6)}...${address.slice(-4)})`;
    button.classList.remove('bg-white/90', 'text-orange-600');
    button.classList.add('bg-red-600', 'text-white');

    // Можно добавить код для сохранения адреса или дальнейшей логики
  } catch (error) {
    console.error('Connection error:', error);
  }
}
