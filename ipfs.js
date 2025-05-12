/**
 * NFT Contract Reader - With Token ID Validation
 * 
 * This script helps you interact with NFT contracts and has special
 * handling for contracts that require specific token ID formats.
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as readline from 'readline';
import { ethers } from 'ethers';
import 'dotenv/config';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => {
    rl.question(query, answer => resolve(answer.trim()));
  });
}

// Enhanced ERC-721 ABI with additional functions to help with token validation
const ENHANCED_ERC721_ABI = [
  // Standard tokenURI function
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Name, Symbol, OwnerOf
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Additional useful functions for validation
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "exists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // ERC1155 balance check
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"},
      {"internalType": "uint256", "name": "id", "type": "uint256"}
    ],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC1155 ABI
const ERC1155_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "uri",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"},
      {"internalType": "uint256", "name": "id", "type": "uint256"}
    ],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Network configurations
const networks = {
  ethereum: {
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETH_MAINNET_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 1,
    blockExplorer: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon Mainnet',
    rpcUrl: process.env.POLYGON_MAINNET_URL || 'https://polygon-rpc.com',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com'
  },
  optimism: {
    name: 'Optimism Mainnet',
    rpcUrl: process.env.OPTIMISM_MAINNET_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  arbitrum: {
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_MAINNET_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    blockExplorer: 'https://arbiscan.io'
  },
  base: {
    name: 'Base',
    rpcUrl: process.env.BASE_MAINNET_URL || 'https://mainnet.base.org',
    chainId: 8453,
    blockExplorer: 'https://basescan.org'
  },
  goerli: {
    name: 'Goerli Testnet',
    rpcUrl: process.env.ETH_GOERLI_URL || 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 5,
    blockExplorer: 'https://goerli.etherscan.io'
  },
  sepolia: {
    name: 'Sepolia Testnet',
    rpcUrl: process.env.ETH_SEPOLIA_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 11155111,
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  megaether: {
    name: 'MegaEther Testnet',
    rpcUrl: process.env.MEGAETHER_TESTNET_URL || 'https://carrot.megaeth.com/rpc',
    chainId: 123456,
    blockExplorer: 'https://web3.okx.com/explorer/megaeth-testnet'
  }
};

async function connectToNetwork() {
  console.log('\n🌐 Available Networks:');
  const networkKeys = Object.keys(networks);

  // Display all available networks
  networkKeys.forEach((key, index) => {
    console.log(`${index + 1}. ${networks[key].name}`);
  });

  // Add an option for custom network
  console.log(`${networkKeys.length + 1}. Custom Network`);

  const networkChoice = await question(`\nSelect a network (1 - ${networkKeys.length + 1}): `);
  const selectedIndex = parseInt(networkChoice) - 1;

  if (selectedIndex < 0 || selectedIndex > networkKeys.length) {
    throw new Error('Invalid network selection');
  }

  if (selectedIndex === networkKeys.length) {
    // Handle custom network
    const customRpcUrl = await question('Enter custom RPC URL: ');
    const customChainId = await question('Enter custom Chain ID: ');
    const customBlockExplorer = await question('Enter custom Block Explorer URL: ');

    const customNetwork = {
      name: 'Custom Network',
      rpcUrl: customRpcUrl,
      chainId: parseInt(customChainId),
      blockExplorer: customBlockExplorer
    };

    console.log(`\n🔌 Connecting to Custom Network...`);
    try {
      const provider = new ethers.JsonRpcProvider(customNetwork.rpcUrl);
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Connected! Current block: ${blockNumber}`);
      return { provider, network: customNetwork };
    } catch (error) {
      console.error(`❌ Custom Network connection error: ${error.message}`);
      throw new Error('Network connection required to proceed');
    }
  } else {
    // Handle predefined networks
    const selectedKey = networkKeys[selectedIndex]; // Ensure selectedKey is defined here
    const network = networks[selectedKey];
    console.log(`\n🔌 Connecting to ${network.name}...`);
    try {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const networkInfo = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Connected! Chain ID: ${Number(networkInfo.chainId)}, Current block: ${blockNumber}`);
      return { provider, network };
    } catch (error) {
      console.error(`❌ Connection error: ${error.message}`);
      throw new Error('Network connection required to proceed');
    }
  }
}

// Token Utilities
const tokenUtils = {
  isTokenMinted: async (contract, contractType, tokenId) => {
    try {
      if (contractType === 'ERC-721') {
        const owner = await contract.ownerOf(tokenId);
        return owner !== ethers.ZeroAddress;
      } else if (contractType === 'ERC-1155') {
        const balance = await contract.balanceOf(ethers.ZeroAddress, tokenId);
        return balance > 0n;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  findUnmintedTokenId: async (contract, contractType) => {
    const MAX_ATTEMPTS = 1000;
    const BATCH_SIZE = 10;
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += BATCH_SIZE) {
      const checks = Array.from({length: BATCH_SIZE}, (_, i) => attempt + i + 1);
      
      const results = await Promise.all(checks.map(async (num) => {
        const tokenId = BigInt(num);
        const minted = await tokenUtils.isTokenMinted(contract, contractType, tokenId);
        return { tokenId, minted };
      }));
      
      const available = results.filter(r => !r.minted);
      if (available.length > 0) return available[0].tokenId;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return null;
  }
};

// Setup contract with enhanced error handling
async function setupContract(provider, contractAddress) {
  try {
    if (!ethers.isAddress(contractAddress)) {
      throw new Error('Invalid contract address format');
    }
    
    const code = await provider.getCode(contractAddress);
    if (code === '0x' || code === '0x0') {
      throw new Error('No contract found at this address');
    }
    
    // Create contract instances with enhanced ABIs
    const erc721Contract = new ethers.Contract(contractAddress, ENHANCED_ERC721_ABI, provider);
    const erc1155Contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    
    let contractType;
    let contract;
    let contractName = '';
    let contractSymbol = '';
    let totalSupply = null;
    let maxSupply = null;
    
    try {
      // Try ERC-721 methods
      try {
        contractName = await erc721Contract.name();
      } catch (e) {
        console.log('Note: Contract does not implement name() function');
      }
      
      try {
        contractSymbol = await erc721Contract.symbol();
      } catch (e) {
        console.log('Note: Contract does not implement symbol() function');
      }
      
      try {
        totalSupply = await erc721Contract.totalSupply();
        console.log(`Total Supply: ${totalSupply}`);
      } catch (e) {
        console.log('Note: Contract does not implement totalSupply() function');
      }
      
      try {
        maxSupply = await erc721Contract.maxSupply();
        console.log(`Max Supply: ${maxSupply}`);
      } catch (e) {
        try {
          maxSupply = await erc721Contract.MAX_SUPPLY();
          console.log(`Max Supply: ${maxSupply}`);
        } catch (e2) {
          console.log('Note: Contract does not implement maxSupply() or MAX_SUPPLY() function');
        }
      }
      
      // Check if we can call tokenURI with a sample token ID
      try {
        await erc721Contract.tokenURI(1);
        contractType = 'ERC-721';
        contract = erc721Contract;
        console.log(`✅ Found ERC-721 contract: ${contractName || 'Unknown'} (${contractSymbol || 'Unknown'})`);
      } catch (e) {
        try {
          await erc721Contract.ownerOf(1);
          contractType = 'ERC-721';
          contract = erc721Contract;
          console.log(`✅ Found ERC-721 contract: ${contractName || 'Unknown'} (${contractSymbol || 'Unknown'})`);
        } catch (e2) {
          try {
            await erc1155Contract.uri(1);
            contractType = 'ERC-1155';
            contract = erc1155Contract;
            console.log('✅ Found ERC-1155 contract');
          } catch (e3) {
            console.log('⚠️ Could not verify exact contract type. Will try as ERC-721.');
            contractType = 'ERC-721';
            contract = erc721Contract;
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Warning: ${error.message}`);
      console.log('⚠️ Using generic contract interface. You may need to try different token IDs.');
      contractType = 'Unknown';
      contract = erc721Contract;
    }
    
    return { 
      contract, 
      contractType, 
      contractName, 
      contractSymbol, 
      totalSupply: totalSupply ? BigInt(totalSupply).toString() : null, 
      maxSupply: maxSupply ? BigInt(maxSupply).toString() : null
    };
  } catch (error) {
    console.error(`❌ Contract error: ${error.message}`);
    throw error;
  }
}

// Enhanced IPFS handling
async function fetchFromIPFS(ipfsURI) {
  console.log('\nFetching from IPFS...');
  
  const cid = ipfsURI.replace('ipfs://', '').replace(/\/$/, '');
  
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.fleek.co/ipfs/'
  ];
  
  // Try each gateway
  for (const gateway of gateways) {
    const url = `${gateway}${cid}`;
    try {
      console.log(`🔄 Trying gateway: ${gateway}...`);
      const response = await fetch(url, { timeout: 10000 });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const content = await response.text();
      console.log(`✅ Successfully fetched from ${url}`);
      
      try {
        const json = JSON.parse(content);
        return { content, json };
      } catch (parseError) {
        console.log('⚠️ Content is not valid JSON, returning as text');
        return { content, json: null };
      }
    } catch (error) {
      console.log(`❌ Failed with gateway ${gateway}: ${error.message}`);
    }
  }
  
  throw new Error('All IPFS gateways failed');
}

// Token Discovery
async function discoverValidTokenIds(contract, contractType) {
  console.log('\n🔍 Starting token ID discovery...');
  
  const results = {
    foundValidTokens: [],
    foundUnmintedTokens: [],
    totalChecked: 0
  };

  // Check common patterns
  const patterns = [
    ...Array.from({length: 20}, (_, i) => BigInt(i + 1)),
    ...['0x1', '0x01', '0x001'].map(h => BigInt(h)),
    BigInt(Math.floor(Date.now() / 1000)),
    ...['42', '69', '420', '1337'].map(n => BigInt(n))
  ];

  for (const tokenId of patterns) {
    try {
      const uri = contractType === 'ERC-721' ? 
        await contract.tokenURI(tokenId) : 
        await contract.uri(tokenId);
      results.foundValidTokens.push({ tokenId: tokenId.toString(), uri });
    } catch (error) {
      if (!error.message.includes('nonexistent token')) continue;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // Find unminted tokens
  const unmintedId = await tokenUtils.findUnmintedTokenId(contract, contractType);
  if (unmintedId) {
    results.foundUnmintedTokens.push({
      tokenId: unmintedId.toString(),
      type: 'unminted'
    });
  }

  console.log(`\n${results.foundValidTokens.length} minted and ${results.foundUnmintedTokens.length} unminted token IDs found.`);
  
  return results;
}

// Metadata Fetching
async function fetchMetadata(tokenURI) {
  try {
    if (tokenURI.startsWith('data:application/json;base64,')) {
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString();
      return JSON.parse(jsonString);
    }
    
    if (tokenURI.startsWith('http')) {
      const response = await fetch(tokenURI);
      return response.json();
    }
    
    if (tokenURI.startsWith('ipfs://')) {
      const { json } = await fetchFromIPFS(tokenURI);
      return json;
    }
    
    throw new Error('Unsupported URI format');
  } catch (error) {
    console.error(`Metadata Error: ${error.message}`);
    return null;
  }
}

// Main Workflow
async function readFromContractWithDiscovery() {
  try {
    const { provider, network } = await connectToNetwork();
    const contractAddress = await question('\nEnter NFT contract address: ');
    const { contract, contractType } = await setupContract(provider, contractAddress);
    
    const discoveryResults = await discoverValidTokenIds(contract, contractType);
    
    // Display results
    console.log('\n🔍 Discovery Results:');
    discoveryResults.foundValidTokens.forEach((token, i) => {
      console.log(`${i + 1}. [MINTED] ${token.tokenId} - ${token.uri.slice(0, 40)}...`);
    });
    discoveryResults.foundUnmintedTokens.forEach((token, i) => {
      console.log(`U${i + 1}. [UNMINTED] ${token.tokenId}`);
    });

    // Selection handling
    const selection = await question(
      '\nChoose:\n' +
      '[1-'+discoveryResults.foundValidTokens.length+'] Minted token\n' +
      '[U1-U'+discoveryResults.foundUnmintedTokens.length+'] Unminted token\n' +
      '[C] Custom ID\n' +
      '[Q] Quit\n> '
    );

    let tokenId;
    if (selection.match(/^U\d+$/i)) {
      const index = parseInt(selection.slice(1)) - 1;
      tokenId = BigInt(discoveryResults.foundUnmintedTokens[index].tokenId);
      console.log(`⚠️ Warning: Token ${tokenId} is unminted`);
    } else if (selection.match(/^\d+$/)) {
      tokenId = BigInt(discoveryResults.foundValidTokens[parseInt(selection) - 1].tokenId);
    } else if (selection.toLowerCase() === 'c') {
      tokenId = BigInt(await question('Enter custom token ID: '));
    } else {
      return;
    }

    // Mint check
    const isMinted = await tokenUtils.isTokenMinted(contract, contractType, tokenId);
    if (!isMinted) {
      const proceed = await question('Token not minted. Continue? (y/n): ');
      if (proceed.toLowerCase() !== 'y') return;
    }

    // Fetch and display metadata
    const tokenURI = contractType === 'ERC-721' ? 
      await contract.tokenURI(tokenId) : 
      await contract.uri(tokenId);
    const metadata = await fetchMetadata(tokenURI);
    
    console.log('\n📝 Metadata:', JSON.stringify(metadata, null, 2));
    console.log(`\n🔗 Explorer: ${network.blockExplorer}/token/${contractAddress}?a=${tokenId}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Main Application
async function main() {
  console.log('\n🔗 NFT Contract Reader - Minted/Unminted Support\n');
  await readFromContractWithDiscovery();
  
  const cont = await question('\nContinue? (y/n): ');
  if (cont.toLowerCase() === 'y') await main();
  else rl.close();
}

// Start
main().catch(error => {
  console.error(`\n💥 Fatal Error: ${error.message}`);
  rl.close();
  process.exit(1);
});