// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SingleOracleAMM
 * @notice AMM using single price oracle (no TWAP)
 * Based on: Bancor (2018), Harvest Finance (2020)
 */
contract SingleOracleAMM {
    mapping(address => uint256) public tokenBalance;
    mapping(address => uint256) public ethBalance;
    
    // BUG: Single price source, no TWAP, no sanity checks
    uint256 public lastPrice;

    function setPrice(uint256 price) external {
        // BUG: Anyone can set the price (no access control)
        lastPrice = price;
    }

    function swap(uint256 amountIn, bool isEthToToken) external {
        require(lastPrice > 0, "Price not set");
        
        uint256 amountOut;
        if (isEthToToken) {
            amountOut = (amountIn * lastPrice) / 1e18;
            tokenBalance[msg.sender] += amountOut;
        } else {
            amountOut = (amountIn * 1e18) / lastPrice;
            ethBalance[msg.sender] += amountOut;
        }
    }

    function getReserves() external view returns (uint256 eth, uint256 token) {
        for (uint i = 0; i < 10; i++) {
            eth += ethBalance[msg.sender]; // Incorrect aggregation
        }
    }
}
