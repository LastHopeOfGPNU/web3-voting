import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting Contract", function () {
  let voting: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const MAX_DESCRIPTION_LENGTH = 512;
  const MAX_BATCH = 100;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy();
    await voting.waitForDeployment();
  });

  describe("Proposal Creation", function () {
    it("Should create proposal successfully with correct event, ID, and proposalCount", async function () {
      const description = "Test Proposal";
      const duration = 3600; // 1 hour
      
      // Test successful proposal creation
      const tx = await voting.createProposal(description, duration);
      const receipt = await tx.wait();

      // Check event
      const event = receipt?.logs?.find((log: any) => {
        try {
          return voting.interface.parseLog(log)?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      if (event) {
        const parsedEvent = voting.interface.parseLog(event);
        expect(parsedEvent?.args.description).to.equal(description);
        expect(parsedEvent?.args.creator).to.equal(owner.address);
      }

      // Check proposalCount increased
      expect(await voting.proposalCount()).to.equal(1);

      // Check proposal details
      const proposal = await voting.getProposal(0);
      expect(proposal.description).to.equal(description);
      expect(proposal.exists).to.be.true;
      expect(proposal.creator).to.equal(owner.address);
      expect(proposal.voteCountFor).to.equal(0);
      expect(proposal.voteCountAgainst).to.equal(0);
    });

    it("Should revert when description is empty", async function () {
      await expect(
        voting.createProposal("", 3600)
      ).to.be.revertedWithCustomError(voting, "EmptyDescription");
    });

    it("Should revert when description is too long", async function () {
      const longDescription = "a".repeat(MAX_DESCRIPTION_LENGTH + 1);
      await expect(
        voting.createProposal(longDescription, 3600)
      ).to.be.revertedWithCustomError(voting, "DescriptionTooLong");
    });

    it("Should revert when duration is zero", async function () {
      await expect(
        voting.createProposal("Test", 0)
      ).to.be.revertedWithCustomError(voting, "InvalidDuration");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Create a proposal before each voting test
      await voting.createProposal("Test Proposal", 3600);
    });

    it("Should allow voting and emit correct event", async function () {
      const tx = await voting.vote(0, true);
      const receipt = await tx.wait();

      // Check VoteCast event
      const event = receipt?.logs?.find((log: any) => {
        try {
          return voting.interface.parseLog(log)?.name === "VoteCast";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      if (event) {
        const parsedEvent = voting.interface.parseLog(event);
        expect(parsedEvent?.args.proposalId).to.equal(0);
        expect(parsedEvent?.args.voter).to.equal(owner.address);
        expect(parsedEvent?.args.support).to.be.true;
      }

      // Check vote counts
      const proposal = await voting.getProposal(0);
      expect(proposal.voteCountFor).to.equal(1);
      expect(proposal.voteCountAgainst).to.equal(0);
    });

    it("Should correctly count against votes", async function () {
      await voting.vote(0, false);
      
      const proposal = await voting.getProposal(0);
      expect(proposal.voteCountFor).to.equal(0);
      expect(proposal.voteCountAgainst).to.equal(1);
    });

    it("Should revert when voting on non-existent proposal", async function () {
      await expect(
        voting.vote(999, true)
      ).to.be.revertedWithCustomError(voting, "ProposalNotExist");
    });

    it("Should revert when same address votes twice", async function () {
      await voting.vote(0, true);
      
      await expect(
        voting.vote(0, true)
      ).to.be.revertedWithCustomError(voting, "AlreadyVoted");

      await expect(
        voting.vote(0, false)
      ).to.be.revertedWithCustomError(voting, "AlreadyVoted");
    });

    it("Should revert when voting after deadline", async function () {
      // Create proposal with very short deadline
      await voting.createProposal("Quick Proposal", 1);
      const proposalId = 1;

      // Wait for deadline to pass
      await ethers.provider.send("evm_increaseTime", [2]); // Increase time by 2 seconds
      await ethers.provider.send("evm_mine", []); // Mine a new block

      await expect(
        voting.vote(proposalId, true)
      ).to.be.revertedWithCustomError(voting, "VotingClosed");
    });

    it("Should track who has voted", async function () {
      await voting.vote(0, true);
      
      expect(await voting.hasVoted(0, owner.address)).to.be.true;
      expect(await voting.hasVoted(0, addr1.address)).to.be.false;
    });
  });

  describe("getProposalResult", function () {
    beforeEach(async function () {
      await voting.createProposal("Test Proposal", 3600);
    });

    it("Should return correct result for winning proposal", async function () {
      await voting.vote(0, true);
      await voting.connect(addr1).vote(0, true);
      await voting.connect(addr2).vote(0, false);

      const [passed, totalVotes] = await voting.getProposalResult(0);
      expect(passed).to.be.true; // 2 for, 1 against
      expect(totalVotes).to.equal(3);
    });

    it("Should return correct result for losing proposal", async function () {
      await voting.vote(0, false);
      await voting.connect(addr1).vote(0, false);
      await voting.connect(addr2).vote(0, true);

      const [passed, totalVotes] = await voting.getProposalResult(0);
      expect(passed).to.be.false; // 1 for, 2 against
      expect(totalVotes).to.equal(3);
    });

    it("Should handle tie as not passed", async function () {
      await voting.vote(0, true);
      await voting.connect(addr1).vote(0, false);

      const [passed, totalVotes] = await voting.getProposalResult(0);
      expect(passed).to.be.false; // 1 for, 1 against (tie)
      expect(totalVotes).to.equal(2);
    });

    it("Should revert for non-existent proposal", async function () {
      await expect(
        voting.getProposalResult(999)
      ).to.be.revertedWithCustomError(voting, "ProposalNotExist");
    });
  });

  describe("getProposalsRange", function () {
    beforeEach(async function () {
      // Create multiple proposals
      for (let i = 0; i < 10; i++) {
        await voting.createProposal(`Proposal ${i}`, 3600);
      }
    });

    it("Should return correct range of proposals", async function () {
      const result = await voting.getProposalsRange(2, 3);
      
      expect(result.descriptions).to.have.lengthOf(3);
      expect(result.descriptions[0]).to.equal("Proposal 2");
      expect(result.descriptions[1]).to.equal("Proposal 3");
      expect(result.descriptions[2]).to.equal("Proposal 4");
      
      expect(result.votesFor).to.have.lengthOf(3);
      expect(result.votesAgainst).to.have.lengthOf(3);
      expect(result.creators).to.have.lengthOf(3);
      expect(result.deadlines).to.have.lengthOf(3);
    });

    it("Should handle range exceeding total proposals", async function () {
      const result = await voting.getProposalsRange(8, 5);
      
      expect(result.descriptions).to.have.lengthOf(2); // Only proposals 8 and 9
      expect(result.descriptions[0]).to.equal("Proposal 8");
      expect(result.descriptions[1]).to.equal("Proposal 9");
    });

    it("Should revert when start is out of bounds", async function () {
      await expect(
        voting.getProposalsRange(15, 5)
      ).to.be.revertedWithCustomError(voting, "ProposalNotExist");
    });

    it("Should revert when count is zero", async function () {
      await expect(
        voting.getProposalsRange(0, 0)
      ).to.be.revertedWithCustomError(voting, "InvalidDuration");
    });

    it("Should revert when count exceeds MAX_BATCH", async function () {
      await expect(
        voting.getProposalsRange(0, MAX_BATCH + 1)
      ).to.be.revertedWithCustomError(voting, "InvalidDuration");
    });

    it("Should handle getting all proposals", async function () {
      const result = await voting.getProposalsRange(0, 10);
      
      expect(result.descriptions).to.have.lengthOf(10);
      for (let i = 0; i < 10; i++) {
        expect(result.descriptions[i]).to.equal(`Proposal ${i}`);
      }
    });
  });

  describe("Edge Cases and Integration", function () {
    it("Should handle multiple proposals and votes correctly", async function () {
      // Create multiple proposals
      await voting.createProposal("First Proposal", 3600);
      await voting.createProposal("Second Proposal", 1800);
      await voting.createProposal("Third Proposal", 7200);

      expect(await voting.proposalCount()).to.equal(3);

      // Vote on different proposals
      await voting.vote(0, true);
      await voting.connect(addr1).vote(1, false);
      await voting.connect(addr2).vote(2, true);
      await voting.connect(addr1).vote(2, true);

      // Check results
      const proposal0 = await voting.getProposal(0);
      expect(proposal0.voteCountFor).to.equal(1);
      expect(proposal0.voteCountAgainst).to.equal(0);

      const proposal1 = await voting.getProposal(1);
      expect(proposal1.voteCountFor).to.equal(0);
      expect(proposal1.voteCountAgainst).to.equal(1);

      const proposal2 = await voting.getProposal(2);
      expect(proposal2.voteCountFor).to.equal(2);
      expect(proposal2.voteCountAgainst).to.equal(0);
    });

    it("Should handle exact deadline boundary", async function () {
      // Create a proposal with 1 second duration
      await voting.createProposal("Boundary Proposal", 1);
      
      // Vote immediately (should work - we're before deadline)
      await voting.vote(0, true);
      
      // Wait exactly 1 second to reach the deadline
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to vote again - this should fail because we're now past the deadline
      await expect(voting.vote(0, false)).to.be.revertedWithCustomError(voting, "VotingClosed");
    });
  });
});