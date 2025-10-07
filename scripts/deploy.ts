import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const VotingFactory = await ethers.getContractFactory("Voting");
  const voting = await VotingFactory.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("Voting deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});