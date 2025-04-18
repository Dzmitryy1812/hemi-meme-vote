# Hemi Meme Voting Contract

This project contains the smart contract for the **Hemi Meme Voting** system, allowing users to upload memes and vote for them on the blockchain.

## Features

- **Upload Meme**: Users can upload a meme by providing a URL.
- **Vote for Meme**: Users can vote for memes, and the contract will track the number of votes for each meme.
- **Meme Information**: The contract stores and provides information about each meme, including the URL, votes, and uploader.

## Current Status

- **Smart Contract Development**: The contract has been developed with the basic functionality of uploading and voting for memes.
- **Deployment Script**: A deployment script has been created for deploying the contract to a local network using Hardhat and Ethers.js.

### Contract Overview

- **Contract Name**: `HemiMeme`
- **Main Functions**:
  - `uploadMeme(string memory _url)`: Allows a user to upload a meme with a URL.
  - `voteMeme(uint _id)`: Allows a user to vote for a meme by its ID.
  - `getMeme(uint _id)`: Retrieves details of a meme including its ID, URL, vote count, and uploader address.

### Deployment

The smart contract can be deployed to a local network using Hardhat with the following steps:

1. **Install Dependencies**:
   ```bash
   npm install
