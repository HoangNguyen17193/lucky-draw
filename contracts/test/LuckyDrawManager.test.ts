import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LuckyDrawManager", function () {
  const SUBSCRIPTION_ID = 1n;
  const KEY_HASH = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const CALLBACK_GAS_LIMIT = 500000;
  const REQUEST_CONFIRMATIONS = 3;
  const NATIVE_PAYMENT = false;
  const BASIS_POINTS = 10000n;

  async function deployFixture() {
    const [owner, user1, user2, user3, nonWhitelisted] = await ethers.getSigners();

    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
    const vrfCoordinator = await MockVRFCoordinator.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test Token", "TEST");

    const LuckyDrawManager = await ethers.getContractFactory("LuckyDrawManager");
    const luckyDraw = await LuckyDrawManager.deploy(
      await vrfCoordinator.getAddress(),
      SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT,
      REQUEST_CONFIRMATIONS,
      NATIVE_PAYMENT
    );

    // Mint and approve tokens
    await token.mint(owner.address, ethers.parseEther("10000"));
    await token.approve(await luckyDraw.getAddress(), ethers.parseEther("10000"));

    return { luckyDraw, vrfCoordinator, token, owner, user1, user2, user3, nonWhitelisted };
  }

  async function setupDrawFixture() {
    const base = await deployFixture();
    const { luckyDraw, token, user1, user2, user3 } = base;

    // Create draw
    await luckyDraw.createDraw(await token.getAddress());

    // Set tiers: 5% -> 50 tokens, 15% -> 10 tokens, 30% -> 3 tokens
    await luckyDraw.setTiers(0, [
      { prizeAmount: ethers.parseUnits("50", 6), winProbability: 500n },
      { prizeAmount: ethers.parseUnits("10", 6), winProbability: 1500n },
      { prizeAmount: ethers.parseUnits("3", 6), winProbability: 3000n },
    ]);

    // Set default prize: 1 token for remaining 50%
    await luckyDraw.setDefaultPrize(0, ethers.parseUnits("1", 6));

    // Fund the draw
    await luckyDraw.fundDraw(0, ethers.parseUnits("1000", 6));

    // Whitelist users
    await luckyDraw.setWhitelistBatch([user1.address, user2.address, user3.address], true);

    return base;
  }

  describe("Whitelist Management", function () {
    it("should allow owner to whitelist users", async function () {
      const { luckyDraw, user1 } = await loadFixture(deployFixture);

      await expect(luckyDraw.setWhitelist(user1.address, true))
        .to.emit(luckyDraw, "WhitelistUpdated")
        .withArgs(user1.address, true);

      expect(await luckyDraw.whitelist(user1.address)).to.be.true;
    });

    it("should allow owner to batch whitelist users", async function () {
      const { luckyDraw, user1, user2, user3 } = await loadFixture(deployFixture);

      await luckyDraw.setWhitelistBatch([user1.address, user2.address, user3.address], true);

      expect(await luckyDraw.whitelist(user1.address)).to.be.true;
      expect(await luckyDraw.whitelist(user2.address)).to.be.true;
      expect(await luckyDraw.whitelist(user3.address)).to.be.true;
    });

    it("should not allow non-owner to whitelist users", async function () {
      const { luckyDraw, user1, user2 } = await loadFixture(deployFixture);

      await expect(luckyDraw.connect(user1).setWhitelist(user2.address, true))
        .to.be.revertedWith("Only callable by owner");
    });
  });

  describe("Draw Creation", function () {
    it("should create a new draw", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await expect(luckyDraw.createDraw(await token.getAddress()))
        .to.emit(luckyDraw, "DrawCreated")
        .withArgs(0, await token.getAddress());

      const draw = await luckyDraw.getDraw(0);
      expect(draw.status).to.equal(0); // Open
      expect(draw.token).to.equal(await token.getAddress());
    });

    it("should not allow non-owner to create draw", async function () {
      const { luckyDraw, token, user1 } = await loadFixture(deployFixture);

      await expect(luckyDraw.connect(user1).createDraw(await token.getAddress()))
        .to.be.revertedWith("Only callable by owner");
    });

    it("should reject zero address token", async function () {
      const { luckyDraw } = await loadFixture(deployFixture);

      await expect(luckyDraw.createDraw(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(luckyDraw, "InvalidToken");
    });
  });

  describe("Tier Configuration", function () {
    it("should configure tiers with prize amount and win probability", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await luckyDraw.createDraw(await token.getAddress());

      const tiers = [
        { prizeAmount: ethers.parseUnits("50", 6), winProbability: 500n },
        { prizeAmount: ethers.parseUnits("10", 6), winProbability: 1500n },
        { prizeAmount: ethers.parseUnits("3", 6), winProbability: 3000n },
      ];

      await expect(luckyDraw.setTiers(0, tiers))
        .to.emit(luckyDraw, "TiersConfigured")
        .withArgs(0, 3);

      const tier0 = await luckyDraw.getTier(0, 0);
      expect(tier0.prizeAmount).to.equal(ethers.parseUnits("50", 6));
      expect(tier0.winProbability).to.equal(500n);
    });

    it("should reject if total probability exceeds 100%", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await luckyDraw.createDraw(await token.getAddress());

      const tiers = [
        { prizeAmount: ethers.parseUnits("50", 6), winProbability: 6000n },
        { prizeAmount: ethers.parseUnits("10", 6), winProbability: 5000n },
      ];

      await expect(luckyDraw.setTiers(0, tiers))
        .to.be.revertedWithCustomError(luckyDraw, "ProbabilityExceedsMax");
    });

    it("should allow total probability less than 100%", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await luckyDraw.createDraw(await token.getAddress());

      const tiers = [
        { prizeAmount: ethers.parseUnits("50", 6), winProbability: 500n },
      ];

      await expect(luckyDraw.setTiers(0, tiers)).to.not.be.reverted;
    });

    it("should reject zero prize amount", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await luckyDraw.createDraw(await token.getAddress());

      const tiers = [
        { prizeAmount: 0n, winProbability: 500n },
      ];

      await expect(luckyDraw.setTiers(0, tiers))
        .to.be.revertedWithCustomError(luckyDraw, "InvalidTierConfig");
    });
  });

  describe("Default Prize", function () {
    it("should configure default prize", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await luckyDraw.createDraw(await token.getAddress());

      await expect(luckyDraw.setDefaultPrize(0, ethers.parseUnits("1", 6)))
        .to.emit(luckyDraw, "DefaultPrizeConfigured")
        .withArgs(0, ethers.parseUnits("1", 6));

      const draw = await luckyDraw.getDraw(0);
      expect(draw.defaultPrize).to.equal(ethers.parseUnits("1", 6));
    });
  });

  describe("Draw Funding", function () {
    it("should fund a draw", async function () {
      const { luckyDraw, token } = await loadFixture(deployFixture);

      await luckyDraw.createDraw(await token.getAddress());
      
      const amount = ethers.parseUnits("100", 6);
      await expect(luckyDraw.fundDraw(0, amount))
        .to.emit(luckyDraw, "DrawFunded")
        .withArgs(0, amount, amount);

      const draw = await luckyDraw.getDraw(0);
      expect(draw.fundedAmount).to.equal(amount);
    });
  });

  describe("User Entry with Instant VRF", function () {
    it("should allow whitelisted user to enter and request VRF", async function () {
      const { luckyDraw, user1 } = await loadFixture(setupDrawFixture);

      await expect(luckyDraw.connect(user1).enter(0))
        .to.emit(luckyDraw, "EntryRequested");

      const result = await luckyDraw.getUserResult(0, user1.address);
      expect(result.hasEntered).to.be.true;
      expect(result.hasResult).to.be.false; // Waiting for VRF
    });

    it("should reject non-whitelisted users", async function () {
      const { luckyDraw, nonWhitelisted } = await loadFixture(setupDrawFixture);

      await expect(luckyDraw.connect(nonWhitelisted).enter(0))
        .to.be.revertedWithCustomError(luckyDraw, "NotWhitelisted");
    });

    it("should prevent duplicate entries", async function () {
      const { luckyDraw, user1 } = await loadFixture(setupDrawFixture);

      await luckyDraw.connect(user1).enter(0);
      
      await expect(luckyDraw.connect(user1).enter(0))
        .to.be.revertedWithCustomError(luckyDraw, "AlreadyEntered");
    });

    it("should reject if draw is closed", async function () {
      const { luckyDraw, user1 } = await loadFixture(setupDrawFixture);

      await luckyDraw.closeDraw(0);

      await expect(luckyDraw.connect(user1).enter(0))
        .to.be.revertedWithCustomError(luckyDraw, "DrawNotOpen");
    });
  });

  describe("VRF Callback and Prize Distribution", function () {
    it("should distribute prize on VRF callback", async function () {
      const { luckyDraw, vrfCoordinator, token, user1 } = await loadFixture(setupDrawFixture);

      // User enters
      const tx = await luckyDraw.connect(user1).enter(0);
      const receipt = await tx.wait();
      
      // Get request ID from event
      const event = receipt?.logs.find(log => {
        try {
          const parsed = luckyDraw.interface.parseLog(log as any);
          return parsed?.name === "EntryRequested";
        } catch {
          return false;
        }
      });
      
      const parsed = luckyDraw.interface.parseLog(event as any);
      const requestId = parsed?.args.requestId;

      // Simulate VRF callback with a random number that gives tier 0 (0-499 out of 10000)
      const randomWord = 100n; // This should give tier 0 (5% range: 0-499)
      
      const balanceBefore = await token.balanceOf(user1.address);
      
      await vrfCoordinator.fulfillRandomWords(requestId, [randomWord]);

      const balanceAfter = await token.balanceOf(user1.address);
      
      // Should have received a prize
      expect(balanceAfter).to.be.gt(balanceBefore);

      // Check user result
      const result = await luckyDraw.getUserResult(0, user1.address);
      expect(result.hasResult).to.be.true;
      expect(result.prizeAmount).to.be.gt(0);
    });

    it("should give default prize for roll outside tier ranges", async function () {
      const { luckyDraw, vrfCoordinator, token, user1 } = await loadFixture(setupDrawFixture);

      const tx = await luckyDraw.connect(user1).enter(0);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = luckyDraw.interface.parseLog(log as any);
          return parsed?.name === "EntryRequested";
        } catch {
          return false;
        }
      });
      
      const parsed = luckyDraw.interface.parseLog(event as any);
      const requestId = parsed?.args.requestId;

      // Random number that gives default prize (5000+ out of 10000, since tiers only cover 50%)
      const randomWord = 6000n;
      
      await vrfCoordinator.fulfillRandomWords(requestId, [randomWord]);

      const result = await luckyDraw.getUserResult(0, user1.address);
      expect(result.hasResult).to.be.true;
      expect(result.tierIndex).to.equal(ethers.MaxUint256); // Default prize indicator
      expect(result.prizeAmount).to.equal(ethers.parseUnits("1", 6)); // Default prize
    });
  });

  describe("Close Draw", function () {
    it("should close draw", async function () {
      const { luckyDraw } = await loadFixture(setupDrawFixture);

      await expect(luckyDraw.closeDraw(0))
        .to.emit(luckyDraw, "DrawClosed")
        .withArgs(0);

      const draw = await luckyDraw.getDraw(0);
      expect(draw.status).to.equal(1); // Closed
    });
  });

  describe("Cancel Draw", function () {
    it("should cancel draw and refund remaining tokens", async function () {
      const { luckyDraw, token, owner } = await loadFixture(setupDrawFixture);

      const balanceBefore = await token.balanceOf(owner.address);

      await expect(luckyDraw.cancelDraw(0))
        .to.emit(luckyDraw, "DrawCancelled")
        .withArgs(0);

      const balanceAfter = await token.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);

      const draw = await luckyDraw.getDraw(0);
      expect(draw.status).to.equal(2); // Cancelled
    });
  });

  describe("Withdraw Leftover", function () {
    it("should withdraw leftover after draw is closed", async function () {
      const { luckyDraw, vrfCoordinator, token, owner, user1 } = await loadFixture(setupDrawFixture);

      // User enters and gets prize
      const tx = await luckyDraw.connect(user1).enter(0);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = luckyDraw.interface.parseLog(log as any);
          return parsed?.name === "EntryRequested";
        } catch {
          return false;
        }
      });
      const parsed = luckyDraw.interface.parseLog(event as any);
      const requestId = parsed?.args.requestId;

      await vrfCoordinator.fulfillRandomWords(requestId, [100n]);

      // Close draw
      await luckyDraw.closeDraw(0);

      // Withdraw leftover
      const balanceBefore = await token.balanceOf(owner.address);
      await luckyDraw.withdrawLeftover(0, owner.address);
      const balanceAfter = await token.balanceOf(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Pausable", function () {
    it("should pause and unpause the contract", async function () {
      const { luckyDraw, user1 } = await loadFixture(setupDrawFixture);

      await luckyDraw.pause();
      
      await expect(luckyDraw.connect(user1).enter(0))
        .to.be.revertedWithCustomError(luckyDraw, "EnforcedPause");

      await luckyDraw.unpause();
      
      await expect(luckyDraw.connect(user1).enter(0)).to.not.be.reverted;
    });
  });

  describe("VRF Config Update", function () {
    it("should allow owner to update VRF config", async function () {
      const { luckyDraw } = await loadFixture(deployFixture);

      const newSubId = 999n;
      const newKeyHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
      
      await luckyDraw.updateVRFConfig(newSubId, newKeyHash, 600000, 5, true);

      expect(await luckyDraw.s_subscriptionId()).to.equal(newSubId);
    });
  });
});
