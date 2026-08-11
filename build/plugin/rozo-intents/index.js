// rozo-intents plugin entry.
//
// This plugin is skill-based: its runtime is the Node scripts in
// scripts/dist/ that the agent invokes by following the SKILL.md files
// in skills/. There is no OpenClaw SDK registration here because the
// plugin does not expose an LLM provider, channel, memory backend, or
// context engine.
//
// OpenClaw loads this file at plugin discovery time via the
// openclaw.extensions array in package.json. We hand-roll a
// PluginEntry-shaped object instead of importing definePluginEntry from
// 'openclaw/plugin-sdk/plugin-entry' so the plugin has no runtime
// dependency on the openclaw package — it must load cleanly in any
// Claude Code installation, with or without openclaw present.
//
// Shape reference: openclaw/openclaw src/plugin-sdk/plugin-entry.ts,
// function definePluginEntry (returns {id, name, description,
// configSchema getter, register}).

const emptyConfigSchema = {
  type: "object",
  additionalProperties: false,
};

export default {
  id: "rozo-intents",
  name: "Rozo Intents",
  description: "Cross-chain crypto payments and bridging via Rozo. Send USDC/USDT across Ethereum, Arbitrum, Base, BNB Chain (BSC), Polygon, Solana, and Stellar (Base and Stellar are USDC-only; Solana receives USDC only but can pay in USDT).",
  get configSchema() {
    return emptyConfigSchema;
  },
  register() {
    // Intentionally empty. This plugin ships skills and runtime scripts,
    // not SDK-registered capabilities. All user-facing functionality
    // lives in skills/*/SKILL.md and scripts/dist/*.js.
  },
};
