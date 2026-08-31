// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GovernanceToken
 * @notice Governance voting vulnerable to flash loan vote
 * Based on: Various DAO flash loan attacks
 */
contract GovernanceToken {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public votes;
    uint256 public totalSupply;
    
    struct Proposal {
        address target;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    // BUG: Voting power based on current balance
    // Attacker can flash loan tokens, vote, return tokens in one tx
    function vote(uint256 proposalId, bool support) external {
        require(balances[msg.sender] > 0, "No tokens");
        
        // BUG: No snapshot — uses current balance
        // Flash loan gives massive voting power for one block
        if (support) {
            proposals[proposalId].votesFor += balances[msg.sender];
        } else {
            proposals[proposalId].votesAgainst += balances[msg.sender];
        }
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.votesFor > p.votesAgainst, "Not passed");
        require(!p.executed, "Already executed");
        p.executed = true;
        (bool success,) = p.target.call{value: 0}("");
        require(success);
    }
}
