// Test要用
require("@nomiclabs/hardhat-waffle")
require('dotenv').config()
//Verify所需要
require("@nomiclabs/hardhat-etherscan");
//用它来Create2
require("xdeployer")
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        //url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        url: process.env.MainnetRPC,
        // accounts: {
        //   mnemonic: "test test test test test test test test test test test junk",
        //   path: "m/44'/60'/0'/0",
        //   initialIndex: 0,
      //   count: 20,
        //   passphrase: "",
        // },
      }
    },
    goerli:{
      url: process.env.GoerliRPC,
      accounts: [process.env.PK]
    },
    mumbai: {
      url: process.env.MumbaiRPC,
      accounts: [process.env.PK]
    }
  },
  xdeploy: {
    contract: "BugBatchXen2",
    // constructorArgsPath: "PATH_TO_CONSTRUCTOR_ARGS",
    salt: "Hellllo",
    signer: process.env.PK,
    networks: ["goerli","mumbai"],
    rpcUrls: [process.env.GoerliRPC, process.env.MumbaiRPC]
  },
  etherscan: {
    apiKey: {
      goerli: process.env.EtherscanAPI,
      polygonMumbai: process.env.PolygonApi,
    }
  },
};
