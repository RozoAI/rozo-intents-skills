import { describe, it, expect } from "vitest";
import { parseQR, formatBaseUnits } from "../src/parse-qr.js";
import {
  TEST_EVM_ADDRESS,
  TEST_EVM_ADDRESS_2,
  TEST_SOLANA_ADDRESS_2,
  TEST_STELLAR_G_ADDRESS,
  TEST_STELLAR_C_ADDRESS,
} from "./fixtures.js";

describe("parseQR", () => {
  // --- Plain addresses ---
  describe("plain addresses", () => {
    it("parses EVM address", () => {
      const r = parseQR(TEST_EVM_ADDRESS);
      expect(r).not.toBeNull();
      expect(r!.type).toBe("plain-address");
      expect(r!.address).toBe(TEST_EVM_ADDRESS);
      expect(r!.chainId).toBeUndefined();
    });

    it("parses Solana address", () => {
      const r = parseQR(TEST_SOLANA_ADDRESS_2);
      expect(r!.type).toBe("plain-address");
      expect(r!.chainId).toBe(900);
    });

    it("parses Stellar G-wallet", () => {
      const r = parseQR(TEST_STELLAR_G_ADDRESS);
      expect(r!.type).toBe("plain-address");
      expect(r!.chainId).toBe(1500);
    });

    it("parses Stellar C-wallet", () => {
      const r = parseQR(TEST_STELLAR_C_ADDRESS);
      expect(r!.type).toBe("plain-address");
      expect(r!.chainId).toBe(1500);
    });

    it("returns null for invalid content", () => {
      expect(parseQR("hello world")).toBeNull();
      expect(parseQR("0xinvalid")).toBeNull();
    });
  });

  // --- EIP-681 ---
  describe("EIP-681", () => {
    it("parses simple address", () => {
      const r = parseQR(`ethereum:${TEST_EVM_ADDRESS_2}`);
      expect(r!.type).toBe("eip681");
      expect(r!.address).toBe(TEST_EVM_ADDRESS_2);
      expect(r!.chainId).toBeUndefined();
    });

    it("parses with value (native ETH transfer)", () => {
      const r = parseQR(`ethereum:${TEST_EVM_ADDRESS_2}?value=1e18`);
      expect(r!.type).toBe("eip681");
      expect(r!.amount).toBe("1e18");
    });

    it("parses with chain ID", () => {
      const r = parseQR(`ethereum:${TEST_EVM_ADDRESS_2}@1?value=1.5e18`);
      expect(r!.chainId).toBe(1);
      expect(r!.amount).toBe("1.5e18");
    });

    it("parses ERC-20 transfer with known USDC contract (Base)", () => {
      const r = parseQR(
        `ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/transfer?address=${TEST_EVM_ADDRESS}&uint256=1000000`
      );
      expect(r!.type).toBe("eip681");
      expect(r!.address).toBe(TEST_EVM_ADDRESS);
      expect(r!.token).toBe("USDC");
      expect(r!.tokenAddress).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
      expect(r!.chainId).toBe(8453);
      expect(r!.amount).toBe("1000000");
    });

    it("parses ERC-20 transfer with explicit chain ID override", () => {
      const r = parseQR(
        `ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913@8453/transfer?address=${TEST_EVM_ADDRESS}&uint256=5000000`
      );
      expect(r!.chainId).toBe(8453);
      expect(r!.token).toBe("USDC");
      expect(r!.amount).toBe("5000000");
    });

    it("parses ERC-20 transfer with known USDT contract (Ethereum)", () => {
      const r = parseQR(
        `ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7/transfer?address=${TEST_EVM_ADDRESS_2}&uint256=50000000`
      );
      expect(r!.token).toBe("USDT");
      expect(r!.chainId).toBe(1);
    });

    it("parses ERC-20 with unknown token contract", () => {
      const r = parseQR(
        `ethereum:0x6B175474E89094C44Da98b954EedeAC495271d0F@10/transfer?address=${TEST_EVM_ADDRESS_2}&uint256=42`
      );
      expect(r!.type).toBe("eip681");
      expect(r!.token).toBeUndefined();
      expect(r!.chainId).toBe(10);
      expect(r!.tokenAddress).toBe("0x6B175474E89094C44Da98b954EedeAC495271d0F");
    });
  });

  // --- Solana Pay ---
  describe("Solana Pay", () => {
    it("parses plain solana URI", () => {
      const r = parseQR(`solana:${TEST_SOLANA_ADDRESS_2}`);
      expect(r!.type).toBe("solana-pay");
      expect(r!.address).toBe(TEST_SOLANA_ADDRESS_2);
      expect(r!.chainId).toBe(900);
    });

    it("parses with amount (SOL transfer)", () => {
      const r = parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=2.5`);
      expect(r!.amount).toBe("2.5");
    });

    it("parses SPL token transfer with known USDC mint", () => {
      const r = parseQR(
        `solana:${TEST_SOLANA_ADDRESS_2}?amount=10.25&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
      );
      expect(r!.token).toBe("USDC");
      expect(r!.amount).toBe("10.25");
      expect(r!.tokenAddress).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    });

    it("parses SPL token transfer with known USDT mint", () => {
      const r = parseQR(
        `solana:${TEST_SOLANA_ADDRESS_2}?amount=5&spl-token=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
      );
      expect(r!.token).toBe("USDT");
    });

    it("parses with label, message, and memo", () => {
      const r = parseQR(
        `solana:${TEST_SOLANA_ADDRESS_2}?amount=5&label=Charity&message=Donation&memo=ThankYou`
      );
      expect(r!.amount).toBe("5");
      expect(r!.label).toBe("Charity");
      expect(r!.message).toBe("Donation");
      expect(r!.memo).toBe("ThankYou");
    });

    it("parses with unknown SPL token", () => {
      const r = parseQR(
        `solana:${TEST_SOLANA_ADDRESS_2}?amount=1&spl-token=UnknownMintAddress1234567890ABCDEF12345678`
      );
      expect(r!.token).toBeUndefined();
      expect(r!.tokenAddress).toBe("UnknownMintAddress1234567890ABCDEF12345678");
    });
  });

  // --- Stellar URI ---
  describe("Stellar URI", () => {
    it("parses basic pay request", () => {
      const r = parseQR(
        `web+stellar:pay?destination=${TEST_STELLAR_G_ADDRESS}&amount=100&asset_code=USDC`
      );
      expect(r!.type).toBe("stellar-uri");
      expect(r!.address).toBe(TEST_STELLAR_G_ADDRESS);
      expect(r!.chainId).toBe(1500);
      expect(r!.token).toBe("USDC");
      expect(r!.amount).toBe("100");
    });

    it("parses with memo", () => {
      const r = parseQR(
        `web+stellar:pay?destination=${TEST_STELLAR_G_ADDRESS}&amount=50&asset_code=USDC&memo=invoice-123`
      );
      expect(r!.memo).toBe("invoice-123");
    });

    it("parses without asset_code (native XLM)", () => {
      const r = parseQR(
        `web+stellar:pay?destination=${TEST_STELLAR_G_ADDRESS}&amount=10`
      );
      expect(r!.token).toBeUndefined();
      expect(r!.amount).toBe("10");
    });

    it("returns null for missing destination", () => {
      const r = parseQR("web+stellar:pay?amount=10&asset_code=USDC");
      expect(r).toBeNull();
    });
  });

  // --- Edge cases ---
  describe("edge cases", () => {
    it("handles whitespace around content", () => {
      const r = parseQR(`  ${TEST_EVM_ADDRESS}  `);
      expect(r).not.toBeNull();
      expect(r!.type).toBe("plain-address");
    });

    it("returns null for empty string", () => {
      expect(parseQR("")).toBeNull();
    });
  });

  // --- Token amounts ---
  describe("tokenAmount", () => {
    it("converts EIP-681 base units using the token's decimals (Base USDC, 6)", () => {
      const r = parseQR(
        `ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/transfer?address=${TEST_EVM_ADDRESS}&uint256=1000000`
      );
      expect(r!.amount).toBe("1000000");
      expect(r!.decimals).toBe(6);
      expect(r!.tokenAmount).toBe("1");
    });

    it("uses 18 decimals for BSC USDC and USDT, not 6", () => {
      const usdc = parseQR(
        `ethereum:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d/transfer?address=${TEST_EVM_ADDRESS}&uint256=5000000000000000000`
      );
      expect(usdc!.chainId).toBe(56);
      expect(usdc!.decimals).toBe(18);
      expect(usdc!.tokenAmount).toBe("5");

      const usdt = parseQR(
        `ethereum:0x55d398326f99059fF775485246999027B3197955/transfer?address=${TEST_EVM_ADDRESS}&uint256=2.5e18`
      );
      expect(usdt!.tokenAmount).toBe("2.5");
    });

    it("reads scientific notation in base units", () => {
      const r = parseQR(
        `ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7/transfer?address=${TEST_EVM_ADDRESS_2}&uint256=1.25e7`
      );
      expect(r!.tokenAmount).toBe("12.5");
    });

    it("leaves tokenAmount unset for unknown ERC-20 contracts", () => {
      const r = parseQR(
        `ethereum:0x6B175474E89094C44Da98b954EedeAC495271d0F@10/transfer?address=${TEST_EVM_ADDRESS_2}&uint256=42`
      );
      expect(r!.amount).toBe("42");
      expect(r!.decimals).toBeUndefined();
      expect(r!.tokenAmount).toBeUndefined();
    });

    it("converts native value from wei", () => {
      const r = parseQR(`ethereum:${TEST_EVM_ADDRESS_2}@1?value=1.5e18`);
      expect(r!.decimals).toBe(18);
      expect(r!.tokenAmount).toBe("1.5");
    });

    it("passes Solana Pay and Stellar decimal amounts through", () => {
      expect(
        parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=10.25&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)!
          .tokenAmount
      ).toBe("10.25");
      expect(
        parseQR(`web+stellar:pay?destination=${TEST_STELLAR_G_ADDRESS}&amount=100&asset_code=USDC`)!.tokenAmount
      ).toBe("100");
    });

    it("does not report a tokenAmount for malformed amounts", () => {
      expect(parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=1e3`)!.tokenAmount).toBeUndefined();
      expect(
        parseQR(
          `ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/transfer?address=${TEST_EVM_ADDRESS}&uint256=0x10`
        )!.tokenAmount
      ).toBeUndefined();
    });
  });

  describe("decimal amounts beyond the asset's precision", () => {
    const SOL_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    it("rejects a Solana USDC amount with more than 6 decimals", () => {
      const r = parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=1.0000001&spl-token=${SOL_USDC}`);
      expect(r!.tokenAmount).toBeUndefined();
      expect(r!.amount).toBe("1.0000001");
    });

    it("keeps a Solana USDC amount at 6 decimals, ignoring trailing zeros", () => {
      expect(
        parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=1.000001&spl-token=${SOL_USDC}`)!.tokenAmount
      ).toBe("1.000001");
      expect(
        parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=1.50000000&spl-token=${SOL_USDC}`)!.tokenAmount
      ).toBe("1.50000000");
    });

    it("allows up to 9 decimals for a native SOL amount", () => {
      expect(parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=0.000000001`)!.tokenAmount).toBe("0.000000001");
      expect(parseQR(`solana:${TEST_SOLANA_ADDRESS_2}?amount=0.0000000001`)!.tokenAmount).toBeUndefined();
    });

    it("rejects a Stellar amount with more than 7 decimals", () => {
      expect(
        parseQR(
          `web+stellar:pay?destination=${TEST_STELLAR_G_ADDRESS}&amount=1.00000001&asset_code=USDC`
        )!.tokenAmount
      ).toBeUndefined();
      expect(
        parseQR(
          `web+stellar:pay?destination=${TEST_STELLAR_G_ADDRESS}&amount=1.0000001&asset_code=USDC`
        )!.tokenAmount
      ).toBe("1.0000001");
    });
  });

  describe("chain mismatch", () => {
    it("does not apply token metadata when the QR names a different chain than the contract", () => {
      const r = parseQR(
        `ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913@56/transfer?address=${TEST_EVM_ADDRESS}&uint256=1000000`
      );
      expect(r!.chainId).toBe(56);
      expect(r!.token).toBeUndefined();
      expect(r!.decimals).toBeUndefined();
      expect(r!.tokenAmount).toBeUndefined();
      expect(r!.amount).toBe("1000000");
    });
  });

  describe("formatBaseUnits", () => {
    it("formats exactly and trims trailing zeros", () => {
      expect(formatBaseUnits("1234567", 6)).toBe("1.234567");
      expect(formatBaseUnits("1000", 6)).toBe("0.001");
      expect(formatBaseUnits("0", 6)).toBe("0");
      expect(formatBaseUnits("2.014e18", 18)).toBe("2.014");
      expect(formatBaseUnits("123456789012345678901234567890", 18)).toBe("123456789012.34567890123456789");
    });

    it("accepts whole values written with fractional zeroes", () => {
      expect(formatBaseUnits("1000000.0", 6)).toBe("1");
      expect(formatBaseUnits("1.0e0", 6)).toBe("0.000001");
      expect(formatBaseUnits("2.50e6", 6)).toBe("2.5");
    });

    it("rejects amounts larger than uint256 without expanding them", () => {
      expect(formatBaseUnits("1e999999999", 18)).toBeUndefined();
      expect(formatBaseUnits("1e79", 18)).toBeUndefined();
      expect(formatBaseUnits("12e77", 18)).toBeUndefined();
      expect(formatBaseUnits("1e77", 18)).toBe("1" + "0".repeat(59));
    });

    it("rejects values above uint256 max that fit in 78 digits", () => {
      const max = 2n ** 256n - 1n;
      expect(formatBaseUnits(max.toString(), 0)).toBe(max.toString());
      expect(formatBaseUnits((max + 1n).toString(), 6)).toBeUndefined();
      expect(formatBaseUnits("9".repeat(78), 6)).toBeUndefined();
    });

    it("rejects fractional base units and malformed input", () => {
      expect(formatBaseUnits("1.5", 6)).toBeUndefined();
      expect(formatBaseUnits("-1", 6)).toBeUndefined();
      expect(formatBaseUnits("abc", 6)).toBeUndefined();
    });
  });
});
