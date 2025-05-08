//ethers.js
import { ethers } from 'ethers';

const contractAddress = '0x04cAEc2fA8Cf5b0D1AC71B61A12917456d2f27BC';
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      }
    ],
    "name": "addMeme",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "memeCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_memeId",
        "type": "uint256"
      }
    ],
    "name": "getName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_memeId",
        "type": "uint256"
      }
    ],
    "name": "getVotes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_memeId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    // Получаем количество мемов
    const memeCount = await contract.memeCount();
    console.log('Всего мемов:', memeCount.toString());

    // Получаем и выводим названия и голоса всех мемов
    for (let i = 0; i < memeCount; i++) {
      const name = await contract.getName(i);
      const votes = await contract.getVotes(i);
      console.log(`Мем #${i}: ${name} - Голосов: ${votes.toString()}`);
    }

    // Пример: добавить новый мем (только владелец)
    const tx = await contract.addMeme("New Meme Name");
    await tx.wait();
    console.log("Мем добавлен");

  } catch (error) {
    console.error('Ошибка при работе с контрактом:', error);
  }
}

main();
