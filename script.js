/*********************************************************
 * WalletHealth – FINAL FRONTEND SCRIPT
 * Works on:
 * - Mobile browsers
 * - GitHub Pages
 * - Cloudflare Workers backend
 *********************************************************/

const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

/* -------------------------------------------------------
   INIT – ensure JS runs after DOM is ready
------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("checkBtn");

  if (!btn) {
    console.error("❌ Button #checkBtn not found");
    return;
  }

  btn.addEventListener("click", checkWallet);
  console.log("✅ WalletHealth script loaded");
});

/* -------------------------------------------------------
   MAIN – Fetch wallet data
------------------------------------------------------- */
async function checkWallet() {
  const input = document.getElementById("walletInput");
  if (!input) {
    alert("Wallet input not found in HTML");
    return;
  }

  const address = input.value.trim();
  if (!address) {
    alert("Please enter a wallet address");
    return;
  }

  hideResult();

  try {
    const res = await fetch(`${API_URL}?address=${address}`);
    const data = await res.json();

    console.log("API RESPONSE:", data);

    if (data.error) {
      alert(data.error);
      return;
    }

    const health = calculateWalletHealth(data);
    renderResult(data, health);

  } catch (err) {
    console.error(err);
    alert("Failed to fetch wallet data");
  }
}

/* -------------------------------------------------------
   SCORE ENGINE (FRONTEND ONLY)
------------------------------------------------------- */
function calculateWalletHealth(api) {
  let score = 0;
  const reasons = [];
  const actions = [];

  const balance = api.balance?.value ?? 0;
  const txCount = api.activity?.txCount ?? 0;
  const approvals = api.approvals?.supported ?? false;
  const dormant = api.flags?.isDormant ?? false;
  const network = api.meta?.network;

  // Balance
  if (balance > 0) {
    score += 30;
  } else {
    score += 10;
    reasons.push("Zero balance wallet");
  }

  // Activity
  if (txCount > 0) {
    score += 25;
  } else {
    score += 10;
    reasons.push("No on-chain activity");
  }

  // Network type
  if (network === "Bitcoin") {
    score += 20;
  } else {
    score += 15;
  }

  // Approvals (ETH only)
  if (approvals) {
    score += 15;
  }

  // Dormant flag
  if (dormant) {
    score -= 10;
    reasons.push("Wallet appears dormant");
    actions.push("Consider moving funds or verifying access");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: getScoreLabel(score),
    reasons,
    actions
  };
}

function getScoreLabel(score) {
  if (score >= 90) return "Very Healthy";
  if (score >= 70) return "Healthy";
  if (score >= 50) return "Needs Attention";
  return "Risky";
}

/* -------------------------------------------------------
   UI RENDER
------------------------------------------------------- */
function renderResult(api, health) {
  showResult();

  setText("score", health.score);
  setText("status", health.label);
  setText("network", api.meta.network);
  setText(
    "balance",
    `${api.balance.value} ${api.balance.unit}`
  );

  const reasonsBox = document.getElementById("reasons");
  const actionsBox = document.getElementById("actions");

  reasonsBox.innerHTML = health.reasons.length
    ? `<ul>${health.reasons.map(r => `<li>${r}</li>`).join("")}</ul>`
    : "<p>No major risk signals detected.</p>";

  actionsBox.innerHTML = health.actions.length
    ? `<ul>${health.actions.map(a => `<li>${a}</li>`).join("")}</ul>`
    : "<p>Keep wallet hygiene strong.</p>";
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function showResult() {
  const box = document.getElementById("result");
  if (box) box.classList.remove("hidden");
}

function hideResult() {
  const box = document.getElementById("result");
  if (box) box.classList.add("hidden");
}
