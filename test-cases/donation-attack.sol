// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VulnerableLending
 * @notice Lending protocol vulnerable to donation attack
 * Based on: Euler Finance (2023) — $197M lost
 */
contract VulnerableLending {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrowShares;
    uint256 public totalDeposits;

    function deposit() external payable {
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function getBalance(address user) public view returns (uint256) {
        // BUG: Uses totalDeposits for share calculation
        // Attacker can donate directly to inflate shares
        return (deposits[user] * 1e18) / totalDeposits;
    }

    function borrow(uint256 amount) external {
        require(getBalance(msg.sender) >= amount, "Insufficient balance");
        // BUG: No validation that totalDeposits wasn't artificially inflated
        borrowShares[msg.sender] += amount;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
    }
}
