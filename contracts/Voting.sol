// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Voting 
/// @notice Simple on-chain voting with proposal deadlines and description length limit
contract Voting {
    uint256 public proposalCount;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 512; // bytes
    uint256 public constant MAX_BATCH = 100; // batch read safety limit

    struct Proposal {
        string description;
        uint256 voteCountFor;
        uint256 voteCountAgainst;
        bool exists;
        address creator;
        uint256 deadline; // unix timestamp, vote allowed until this time (inclusive)
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, string description, address indexed creator, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);

    // Custom errors (gas efficient)
    error EmptyDescription();
    error DescriptionTooLong(uint256 length);
    error ProposalNotExist(uint256 id);
    error AlreadyVoted(address voter);
    error VotingClosed(uint256 id);
    error InvalidDuration();

    /// @notice Create a proposal with a duration in seconds
    /// @param description proposal text (non-empty, bounded length)
    /// @param durationSeconds voting window length in seconds (must be > 0 and reasonable)
    /// @return proposalId the id of the created proposal
    function createProposal(string memory description, uint256 durationSeconds) external returns (uint256) {
        if (bytes(description).length == 0) revert EmptyDescription();
        if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert DescriptionTooLong(bytes(description).length);
        if (durationSeconds == 0) revert InvalidDuration();

        uint256 proposalId = proposalCount;
        proposals[proposalId] = Proposal({
            description: description,
            voteCountFor: 0,
            voteCountAgainst: 0,
            exists: true,
            creator: msg.sender,
            deadline: block.timestamp + durationSeconds
        });

        unchecked { proposalCount++; } // safe here in realistic scenarios

        emit ProposalCreated(proposalId, description, msg.sender, block.timestamp + durationSeconds);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        if (proposalId >= proposalCount) revert ProposalNotExist(proposalId);
        Proposal storage p = proposals[proposalId];
        if (!p.exists) revert ProposalNotExist(proposalId);
        if (block.timestamp > p.deadline) revert VotingClosed(proposalId);
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted(msg.sender);

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            p.voteCountFor++;
        } else {
            p.voteCountAgainst++;
        }

        emit VoteCast(proposalId, msg.sender, support);
    }

    function getProposal(uint256 proposalId) external view returns (
        string memory description,
        uint256 voteCountFor,
        uint256 voteCountAgainst,
        bool exists,
        address creator,
        uint256 deadline
    ) {
        if (proposalId >= proposalCount) revert ProposalNotExist(proposalId);
        Proposal memory p = proposals[proposalId];
        return (p.description, p.voteCountFor, p.voteCountAgainst, p.exists, p.creator, p.deadline);
    }

    function getProposalResult(uint256 proposalId) external view returns (bool passed, uint256 totalVotes) {
        if (proposalId >= proposalCount) revert ProposalNotExist(proposalId);
        Proposal memory p = proposals[proposalId];
        totalVotes = p.voteCountFor + p.voteCountAgainst;
        passed = p.voteCountFor > p.voteCountAgainst;
        return (passed, totalVotes);
    }

    /// @notice Batch read proposals (be careful with large ranges)
    function getProposalsRange(uint256 start, uint256 count) external view returns (
        string[] memory descriptions,
        uint256[] memory votesFor,
        uint256[] memory votesAgainst,
        address[] memory creators,
        uint256[] memory deadlines
    ) {
        if (start >= proposalCount) revert ProposalNotExist(start);
        if (count == 0) revert InvalidDuration();
        if (count > MAX_BATCH) revert InvalidDuration();

        uint256 end = start + count;
        if (end > proposalCount) end = proposalCount;

        uint256 len = end - start;
        descriptions = new string[](len);
        votesFor = new uint256[](len);
        votesAgainst = new uint256[](len);
        creators = new address[](len);
        deadlines = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            Proposal memory p = proposals[start + i];
            descriptions[i] = p.description;
            votesFor[i] = p.voteCountFor;
            votesAgainst[i] = p.voteCountAgainst;
            creators[i] = p.creator;
            deadlines[i] = p.deadline;
        }
    }
}
