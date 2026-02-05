// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LuckyDrawManager
 * @notice Instant lucky draw - user enters, pays VRF fee, and gets prize immediately after VRF callback
 * 
 * Flow:
 * 1. Admin creates draw, sets tiers, funds prize pool
 * 2. User enters (whitelisted) → VRF request sent (user pays via subscription or direct)
 * 3. VRF callback → prize determined and sent to user instantly
 * 4. User spins wheel on frontend to reveal their prize
 */
contract LuckyDrawManager is VRFConsumerBaseV2Plus, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============
    enum DrawStatus {
        Open,       // Accepting entries
        Closed,     // No more entries accepted
        Cancelled   // Draw cancelled, funds returned
    }

    // ============ Structs ============
    struct TierInput {
        uint256 prizeAmount;    // Fixed prize amount for this tier
        uint256 winProbability; // Probability in basis points (e.g., 500 = 5%)
    }

    struct Tier {
        uint256 prizeAmount;    // Fixed prize amount
        uint256 winProbability; // Probability in basis points (10000 = 100%)
        uint256 winnersCount;   // Actual number of winners
        uint256 totalPaid;      // Total amount paid to this tier
    }

    struct Draw {
        bool exists;
        DrawStatus status;
        address token;
        uint256 fundedAmount;
        uint256 totalDistributed;
        uint256 entrantCount;
        Tier[] tiers;
        uint256 defaultPrize;
    }

    struct PendingEntry {
        uint256 drawId;
        address user;
    }

    struct UserResult {
        bool hasEntered;
        bool hasResult;
        uint256 tierIndex;  // type(uint256).max = default prize
        uint256 prizeAmount;
    }

    // ============ Constants ============
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============
    
    // VRF Configuration
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash;
    uint32 public s_callbackGasLimit;
    uint16 public s_requestConfirmations;
    bool public s_nativePayment;

    // Draw management
    uint256 public nextDrawId;
    mapping(uint256 => Draw) public draws;
    
    // VRF request tracking
    mapping(uint256 => PendingEntry) public pendingEntries; // requestId => entry info
    
    // User results per draw
    mapping(uint256 => mapping(address => UserResult)) public userResults;
    
    // Global whitelist
    mapping(address => bool) public whitelist;

    // ============ Events ============
    event WhitelistUpdated(address indexed user, bool allowed);
    event DrawCreated(uint256 indexed drawId, address indexed token);
    event TiersConfigured(uint256 indexed drawId, uint256 tierCount);
    event DefaultPrizeConfigured(uint256 indexed drawId, uint256 amount);
    event DrawFunded(uint256 indexed drawId, uint256 amount, uint256 totalFunded);
    event DrawClosed(uint256 indexed drawId);
    event DrawCancelled(uint256 indexed drawId);
    
    event EntryRequested(uint256 indexed drawId, address indexed user, uint256 indexed requestId);
    event PrizeAwarded(uint256 indexed drawId, address indexed winner, uint256 tierIndex, uint256 amount);
    event LeftoverWithdrawn(uint256 indexed drawId, uint256 amount, address indexed recipient);

    // ============ Errors ============
    error NotWhitelisted();
    error DrawNotOpen();
    error DrawNotClosed();
    error AlreadyEntered();
    error InvalidTierConfig();
    error InsufficientFunding();
    error InvalidDrawId();
    error TiersNotConfigured();
    error InvalidRequest();
    error ProbabilityExceedsMax();
    error InvalidToken();
    error NoPrizeAvailable();

    // ============ Constructor ============
    constructor(
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        bool nativePayment
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
        s_callbackGasLimit = callbackGasLimit;
        s_requestConfirmations = requestConfirmations;
        s_nativePayment = nativePayment;
    }

    modifier drawExists(uint256 drawId) {
        if (!draws[drawId].exists) revert InvalidDrawId();
        _;
    }

    // ============ Admin Functions ============

    function setWhitelist(address user, bool allowed) external onlyOwner {
        whitelist[user] = allowed;
        emit WhitelistUpdated(user, allowed);
    }

    function setWhitelistBatch(address[] calldata users, bool allowed) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[users[i]] = allowed;
            emit WhitelistUpdated(users[i], allowed);
        }
    }

    function createDraw(address token) external onlyOwner returns (uint256 drawId) {
        if (token == address(0)) revert InvalidToken();
        drawId = nextDrawId++;
        Draw storage draw = draws[drawId];
        draw.exists = true;
        draw.status = DrawStatus.Open;
        draw.token = token;
        emit DrawCreated(drawId, token);
    }

    function setTiers(uint256 drawId, TierInput[] calldata tierInputs) external onlyOwner drawExists(drawId) {
        Draw storage draw = draws[drawId];
        if (draw.status != DrawStatus.Open) revert DrawNotOpen();

        delete draw.tiers;

        uint256 totalProbability;
        for (uint256 i = 0; i < tierInputs.length; i++) {
            if (tierInputs[i].prizeAmount == 0 || tierInputs[i].winProbability == 0) {
                revert InvalidTierConfig();
            }
            totalProbability += tierInputs[i].winProbability;
            draw.tiers.push(Tier({
                prizeAmount: tierInputs[i].prizeAmount,
                winProbability: tierInputs[i].winProbability,
                winnersCount: 0,
                totalPaid: 0
            }));
        }

        if (totalProbability > BASIS_POINTS) revert ProbabilityExceedsMax();

        emit TiersConfigured(drawId, tierInputs.length);
    }

    function setDefaultPrize(uint256 drawId, uint256 amount) external onlyOwner drawExists(drawId) {
        Draw storage draw = draws[drawId];
        if (draw.status != DrawStatus.Open) revert DrawNotOpen();
        draw.defaultPrize = amount;
        emit DefaultPrizeConfigured(drawId, amount);
    }

    function fundDraw(uint256 drawId, uint256 amount) external onlyOwner drawExists(drawId) {
        Draw storage draw = draws[drawId];
        if (draw.status == DrawStatus.Cancelled) revert InvalidDrawId();

        IERC20(draw.token).safeTransferFrom(msg.sender, address(this), amount);
        draw.fundedAmount += amount;

        emit DrawFunded(drawId, amount, draw.fundedAmount);
    }

    function closeDraw(uint256 drawId) external onlyOwner drawExists(drawId) {
        Draw storage draw = draws[drawId];
        if (draw.status != DrawStatus.Open) revert DrawNotOpen();
        
        draw.status = DrawStatus.Closed;
        emit DrawClosed(drawId);
    }

    function cancelDraw(uint256 drawId) external onlyOwner drawExists(drawId) {
        Draw storage draw = draws[drawId];
        if (draw.status == DrawStatus.Cancelled) revert InvalidDrawId();

        draw.status = DrawStatus.Cancelled;

        // Refund remaining funds
        uint256 remaining = draw.fundedAmount - draw.totalDistributed;
        if (remaining > 0) {
            draw.fundedAmount = draw.totalDistributed;
            IERC20(draw.token).safeTransfer(owner(), remaining);
        }

        emit DrawCancelled(drawId);
    }

    function withdrawLeftover(uint256 drawId, address recipient) external onlyOwner nonReentrant drawExists(drawId) {
        Draw storage draw = draws[drawId];
        if (draw.status != DrawStatus.Closed) revert DrawNotClosed();

        uint256 leftover = draw.fundedAmount - draw.totalDistributed;
        if (leftover > 0) {
            draw.fundedAmount = draw.totalDistributed;
            IERC20(draw.token).safeTransfer(recipient, leftover);
            emit LeftoverWithdrawn(drawId, leftover, recipient);
        }
    }

    function updateVRFConfig(
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        bool nativePayment
    ) external onlyOwner {
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
        s_callbackGasLimit = callbackGasLimit;
        s_requestConfirmations = requestConfirmations;
        s_nativePayment = nativePayment;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ User Functions ============

    /**
     * @notice Enter draw and request VRF - prize will be sent after VRF callback
     * @param drawId The draw to enter
     * @return requestId The VRF request ID for tracking
     * 
     * Note: User must be whitelisted. VRF fee is paid from the subscription.
     * If using Direct Funding, user would need to pay LINK.
     */
    function enter(uint256 drawId) external whenNotPaused drawExists(drawId) returns (uint256 requestId) {
        if (!whitelist[msg.sender]) revert NotWhitelisted();
        
        Draw storage draw = draws[drawId];
        if (draw.status != DrawStatus.Open) revert DrawNotOpen();
        if (userResults[drawId][msg.sender].hasEntered) revert AlreadyEntered();
        if (draw.tiers.length == 0 && draw.defaultPrize == 0) revert TiersNotConfigured();

        // Check if there's enough funds for at least the highest prize
        uint256 highestPrize = _getHighestPrize(draw);
        uint256 availableFunds = draw.fundedAmount - draw.totalDistributed;
        if (availableFunds < highestPrize) revert InsufficientFunding();

        // Mark as entered
        userResults[drawId][msg.sender].hasEntered = true;
        draw.entrantCount++;

        // Request VRF for this user
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: s_requestConfirmations,
                callbackGasLimit: s_callbackGasLimit,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: s_nativePayment})
                )
            })
        );

        // Store pending entry
        pendingEntries[requestId] = PendingEntry({
            drawId: drawId,
            user: msg.sender
        });

        emit EntryRequested(drawId, msg.sender, requestId);
    }

    // ============ VRF Callback ============

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override nonReentrant {
        PendingEntry memory entry = pendingEntries[requestId];
        if (entry.user == address(0)) revert InvalidRequest();

        Draw storage draw = draws[entry.drawId];
        if (!draw.exists) revert InvalidDrawId();

        // Clean up pending entry
        delete pendingEntries[requestId];

        // Determine prize based on random number
        uint256 randomValue = randomWords[0];
        (uint256 tierIndex, uint256 prizeAmount) = _determinePrize(draw, randomValue);

        // Store result for user
        userResults[entry.drawId][entry.user].hasResult = true;
        userResults[entry.drawId][entry.user].tierIndex = tierIndex;
        userResults[entry.drawId][entry.user].prizeAmount = prizeAmount;

        // Transfer prize if any
        if (prizeAmount > 0) {
            // Update tier stats
            if (tierIndex != type(uint256).max) {
                draw.tiers[tierIndex].winnersCount++;
                draw.tiers[tierIndex].totalPaid += prizeAmount;
            }

            draw.totalDistributed += prizeAmount;
            IERC20(draw.token).safeTransfer(entry.user, prizeAmount);
        }

        emit PrizeAwarded(entry.drawId, entry.user, tierIndex, prizeAmount);
    }

    function _determinePrize(Draw storage draw, uint256 randomValue) internal view returns (uint256 tierIndex, uint256 prizeAmount) {
        uint256 roll = randomValue % BASIS_POINTS;
        
        // Build cumulative thresholds and check
        uint256 cumulative = 0;
        for (uint256 i = 0; i < draw.tiers.length; i++) {
            cumulative += draw.tiers[i].winProbability;
            if (roll < cumulative) {
                return (i, draw.tiers[i].prizeAmount);
            }
        }
        
        // No tier matched - return default prize
        return (type(uint256).max, draw.defaultPrize);
    }

    function _getHighestPrize(Draw storage draw) internal view returns (uint256 highest) {
        highest = draw.defaultPrize;
        for (uint256 i = 0; i < draw.tiers.length; i++) {
            if (draw.tiers[i].prizeAmount > highest) {
                highest = draw.tiers[i].prizeAmount;
            }
        }
    }

    // ============ View Functions ============

    function getDraw(uint256 drawId) external view drawExists(drawId) returns (
        DrawStatus status,
        address token,
        uint256 fundedAmount,
        uint256 totalDistributed,
        uint256 entrantCount,
        uint256 tierCount,
        uint256 defaultPrize
    ) {
        Draw storage draw = draws[drawId];
        return (
            draw.status,
            draw.token,
            draw.fundedAmount,
            draw.totalDistributed,
            draw.entrantCount,
            draw.tiers.length,
            draw.defaultPrize
        );
    }

    function getTier(uint256 drawId, uint256 tierIndex) external view drawExists(drawId) returns (
        uint256 prizeAmount,
        uint256 winProbability,
        uint256 winnersCount,
        uint256 totalPaid
    ) {
        Tier storage tier = draws[drawId].tiers[tierIndex];
        return (tier.prizeAmount, tier.winProbability, tier.winnersCount, tier.totalPaid);
    }

    function getTierCount(uint256 drawId) external view drawExists(drawId) returns (uint256) {
        return draws[drawId].tiers.length;
    }

    function getUserResult(uint256 drawId, address user) external view drawExists(drawId) returns (
        bool hasEntered,
        bool hasResult,
        uint256 tierIndex,
        uint256 prizeAmount
    ) {
        UserResult storage result = userResults[drawId][user];
        return (result.hasEntered, result.hasResult, result.tierIndex, result.prizeAmount);
    }

    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }

    function getAvailableFunds(uint256 drawId) external view drawExists(drawId) returns (uint256) {
        Draw storage draw = draws[drawId];
        return draw.fundedAmount - draw.totalDistributed;
    }

    function getTotalTierProbability(uint256 drawId) external view drawExists(drawId) returns (uint256 total) {
        Draw storage draw = draws[drawId];
        for (uint256 i = 0; i < draw.tiers.length; i++) {
            total += draw.tiers[i].winProbability;
        }
    }
}
