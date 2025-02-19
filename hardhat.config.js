require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 1000 // Miner toutes les 1 seconde
      },
      chainId: 1337
    }
  }
};
