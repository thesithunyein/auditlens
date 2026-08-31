// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BalanceGame
 * @notice Contract relying on this.balance (vulnerable to force-send)
 */
contract BalanceGame {
    mapping(address => bool) public hasDeposited;
    uint256 public prizePool;

    function deposit() external payable {
        require(msg.value > 0, "Must deposit");
        hasDeposited[msg.sender] = true;
        prizePool += msg.value;
    }

    // BUG: Uses this.balance which can be manipulated via selfdestruct
    // Attacker can force-send ETH to inflate prizePool
    function claimPrize() external {
        require(hasDeposited[msg.sender], "Must have deposited");
        
        uint256 prize = this.balance / 10; // 10% of pool
        require(prize > 0, "No prize");
        
        // this.balance is inflated by force-sent ETH
        // Attacker gets more than they deserve
        (bool success,) = msg.sender.call{value: prize}("");
        require(success);
        hasDeposited[msg.sender] = false;
    }

    receive() external payable {}
}
