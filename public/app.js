import { connectContract } from './contract.js';

let contract;

window.onload = async () => {
    contract = await connectContract();
    await loadAllMemes(); // твоя функция
};

async function voteForMeme(id) {
    try {
        const tx = await contract.vote(id);
        await tx.wait();
        alert("Голос учтён!");
    } catch (e) {
        alert("Ошибка при голосовании: " + e.message);
    }
}
