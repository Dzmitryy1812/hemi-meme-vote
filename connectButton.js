let connected = false;

// Функция для подключения кошелька
export async function connectWallet() {
  const btn = document.getElementById('connectButton');

  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask not found. Please install MetaMask!');
    return;
  }

  try {
    if (!connected) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      connected = true;

      // Обновление текста и класса кнопки
      btn.innerHTML = `
        <i class="fas fa-check-circle mr-2"></i>${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}
        <i class="fas fa-sign-out-alt ml-2"></i> Disconnect
      `;
      btn.classList.add('bg-green-100', 'text-green-700');
      btn.classList.remove('bg-white/90', 'text-orange-600');
    } else {
      connected = false;

      // Отключение
      btn.innerHTML = `
        <i class="fas fa-wallet mr-2"></i> Connect
      `;
      btn.classList.remove('bg-green-100', 'text-green-700');
      btn.classList.add('bg-white/90', 'text-orange-600');
    }
  } catch (err) {
    alert('Connection failed: ' + err.message);
  }
}
