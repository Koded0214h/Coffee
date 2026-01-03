import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployCoffee: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. Deploy the contract
  const deployment = await deploy("Coffee", {
    from: deployer,
    args: [], // Your Coffee contract constructor doesn't take arguments! 
    log: true,
    autoMine: true,
  });

  console.log("☕ Coffee contract deployed to:", deployment.address);

  // 2. Optional: Get the contract instance to interact with it immediately
  // This is useful if you want to initialize state or log something specificcd
  const coffeeContract = await hre.ethers.getContract<Contract>("Coffee", deployer);
  
  const memoCount = await coffeeContract.memoCount();
  console.log("📊 Current memo count:", memoCount.toString());
};

export default deployCoffee;

deployCoffee.tags = ["Coffee"];