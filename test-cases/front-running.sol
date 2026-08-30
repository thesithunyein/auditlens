// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DEXSwap
 * @notice A simple DEX with frontrunning vulnerability
 * @dev Pending swaps can be observed and frontrun
 */
contract DEXSwap {
    mapping(address => mapping(address => uint256)) public reserves;
    
    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external {
        reserves[tokenA][msg.sender] += amountA;
        reserves[tokenB][msg.sender] += amountB;
    }

    // BUG: No slippage protection - amountOut can change between submission and execution
    // BUG: No commit-reveal scheme - pending swaps are visible in mempool
    function swap(address tokenIn, address tokenOut, uint256 amountIn) external {
        require(reserves[tokenIn][msg.sender] >= amountIn, "Insufficient reserve");
        
        // Price calculated from reserves - can be manipulated by frontrunning
        uint256 reserveIn = getTotalReserve(tokenIn);
        uint256 reserveOut = getTotalReserve(tokenOut);
        
        uint256 amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        
        reserves[tokenIn][msg.sender] -= amountIn;
        reserves[tokenOut][msg.sender] += amountOut;
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getTotalReserve(address token) public view returns (uint256) {
        // Simplified - in reality would sum all liquidity providers
        return reserves[token][msg.sender];
    }
}
