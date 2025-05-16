import { ethers } from 'ethers';

const contractAddress = 'ВАШ_АДРЕС_КОНТРАКТА';
const contractABI = [ /* ваш ABI */ ];

const memesToAdd = [
  'Classic Doge',
  'Surprised Pikachu',
  'Success Kid',
  'Distracted Boyfriend',
  'Evil Kermit',
  'Drake Reaction'
];

async function initializeMemes() {
  if (!window.ethereum) {
    console.error('Install MetaMask!');
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  // Проверяем, что вызывающий является владельцем
  const owner = await contract.owner();
  const currentUser = await signer.getAddress();
  if (currentUser.toLowerCase() !== owner.toLowerCase()) {
    console.error('Only the contract owner can add memes.');
    return;
  }

  // Добавляем мемы по одному
  for (const name of memesToAdd) {
    const tx = await contract.addMeme(name);
    await tx.wait();
    console.log(`Мем "${name}" добавлен`);
  }
  console.log('Все мемы добавлены в контракт!');
}

initializeMemes();
