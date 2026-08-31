// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title InflationToken
 * @notice ERC20-like token with mint/burn inflation vulnerability
 */
contract InflationToken {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    mapping(address => mapping(address => uint256)) public allowance;

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }

    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount);
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }

    // BUG: Anyone can mint tokens — no access control
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    // BUG: burn reduces totalSupply but doesn't burn from anyone
    // Attacker mints, burns to manipulate totalSupply
    function burn(uint256 amount) external {
        // BUG: Doesn't check if msg.sender has enough balance
        totalSupply -= amount;
        // This underflows if amount > totalSupply
        // or if totalSupply = 0, it wraps to max uint256
    }

    // BUG: Overflow in transferFrom
    function transferFrom(address from, address to, uint256 amount) external {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        // No check if balanceOf[from] underflows
    }
}
