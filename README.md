# NFT Contract Reader - With Token ID Validation

This script is a command-line tool for interacting with NFT contracts, designed to handle token ID validation and metadata retrieval. It supports both ERC-721 and ERC-1155 contracts and can connect to various Ethereum networks.

## Key Features

*   **Network Support:** Connect to Ethereum Mainnet, Polygon, Optimism, Arbitrum, Base, Goerli, Sepolia, and MegaEther test networks. (can add custom network)
*   **Contract Setup:** Creates contract instances with enhanced ABIs for ERC-721 and ERC-1155 contracts.
*   **Token ID Discovery:** Discovers valid token IDs using common patterns and sequential search.
*   **Metadata Fetching:** Fetches metadata from various token URI formats, including data URIs, HTTP URLs, and IPFS URLs.
*   **Unminted Token Handling:** Provides options to handle and fetch information about unminted tokens.

## Dependencies

*   `node-fetch`: For making HTTP requests.
*   `fs`: For file system operations.
*   `readline`: For reading input from the console.
*   `ethers`: For interacting with Ethereum contracts.
*   `dotenv`: For loading environment variables from a `.env` file.

## Setup

1.  **Environment Variables:**
    Create a `.env` file in the project directory and add the following environment variables:

    ```
    ETH_MAINNET_URL=YOUR_ETH_MAINNET_RPC_URL
    POLYGON_MAINNET_URL=YOUR_POLYGON_MAINNET_RPC_URL
    OPTIMISM_MAINNET_URL=YOUR_OPTIMISM_MAINNET_RPC_URL
    ARBITRUM_MAINNET_URL=YOUR_ARBITRUM_MAINNET_RPC_URL
    BASE_MAINNET_URL=YOUR_BASE_MAINNET_RPC_URL
    ETH_GOERLI_URL=YOUR_ETH_GOERLI_RPC_URL
    ETH_SEPOLIA_URL=YOUR_ETH_SEPOLIA_RPC_URL
    MEGAETHER_TESTNET_URL=YOUR_MEGAETHER_TESTNET_RPC_URL
    ```

    Replace `YOUR_*_RPC_URL` with the actual RPC URLs for the respective networks. You can obtain these URLs from services like Infura, Alchemy, or QuickNode.

2.  **Install Dependencies:**

    Run the following command in the project directory to install the required dependencies:

    ```bash
    npm install node-fetch ethers dotenv
    ```

## Usage

1.  **Run the Script:**

    Execute the script using Node.js:

    ```bash
    node ipfs.js
    ```

2.  **Select a Network:**

    The script will prompt you to select a network from the list of available networks. Enter the corresponding number to select a network.

3.  **Enter Contract Address:**

    Enter the address of the NFT contract you want to interact with.

4.  **Select a Token ID:**

    The script will attempt to discover valid token IDs. You can then:

    *   Select a token ID from the list of discovered tokens.
    *   Enter a custom token ID.
    *   Select an unminted token ID (if available).

5.  **View Metadata:**

    The script will fetch and display the metadata associated with the selected token ID. It will also provide a link to view the token on the blockchain explorer.

## Error Handling and Troubleshooting

*   **Invalid Contract Address:** Ensure that the contract address is valid and that a contract exists at that address.
*   **Network Connection Errors:** Check your internet connection and verify that the RPC URLs are correct.
*   **Token ID Not Found:** If the script cannot find a valid token ID, try using a custom token ID or check the contract's documentation for the correct token ID format.
*   **Metadata Fetching Errors:** If the script fails to fetch metadata, check the token URI and ensure that it is accessible and returns valid JSON data.

## Contact

If you have any questions or issues, please contact [Your Name/Email] or open an issue on the project's GitHub repository.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.


## LEAVE ME A STAR

## BUY A COFFEE
EVM: ```0x3DCf20ff09dbCb97C3b14CD5C3b9963c4416915a```
BTC: ```32ksT1FnGXdF7VF8rcYhoU6ohTBDXzkwBr```
TRON: ```TSpp1HPNkyvtqzBZDy1QVm9t1oFxe9hZuB```
