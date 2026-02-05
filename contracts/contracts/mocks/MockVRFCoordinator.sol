// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IVRFConsumer {
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external;
}

contract MockVRFCoordinator {
    uint256 private _requestIdCounter;
    mapping(uint256 => address) private _requestIdToConsumer;

    event RandomWordsRequested(
        uint256 indexed requestId,
        address indexed consumer,
        uint32 numWords
    );

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata req
    ) external returns (uint256 requestId) {
        requestId = ++_requestIdCounter;
        _requestIdToConsumer[requestId] = msg.sender;
        emit RandomWordsRequested(requestId, msg.sender, req.numWords);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        address consumer = _requestIdToConsumer[requestId];
        require(consumer != address(0), "Invalid requestId");
        IVRFConsumer(consumer).rawFulfillRandomWords(requestId, randomWords);
    }

    function getRequestIdCounter() external view returns (uint256) {
        return _requestIdCounter;
    }
}
