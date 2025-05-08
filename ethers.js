import { ethers } from 'ethers';

const contractAddress = '0x715045cea81d1dcc604b6a379b94d6049cdaa5a0';
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_cid",
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
  // ... полный ABI сюда ...
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
    const memeCount = await contract.memeCount();
    console.log('Всего мемов:', memeCount.toString());
  } catch (error) {
    console.error('Ошибка при получении memeCount:', error);
  }
}

main();
