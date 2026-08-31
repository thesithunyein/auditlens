// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MultiVault
 * @notice Vault with cross-function reentrancy
 * Based on: Cream Finance (2021) — $130M lost
 */
contract MultiVault {
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;
    uint256 public totalCollateral;

    function depositCollateral() external payable {
        collateral[msg.sender] += msg.value;
        totalCollateral += msg.value;
    }

    function borrow(uint256 amount) external {
        require(collateral[msg.sender] >= amount * 2, "Insufficient collateral");
        
        // BUG: No reentrancy guard
        // Attacker can re-enter borrow() before collateral is updated
        debt[msg.sender] += amount;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
    }

    function liquidate(address user) external {
        require(debt[user] > collateral[user], "Not liquidatable");
        
        // BUG: Cross-function reentrancy
        // During liquidation, attacker can call depositCollateral()
        // then re-enter liquidate() with different state
        uint256 seized = collateral[user] * 8 / 10; // 80% seize
        collateral[user] = 0;
        debt[user] = 0;
        
        (bool success,) = msg.sender.call{value: seized}("");
        require(success);
    }

    receive() external payable {}
}
