/*********************************************************
 * WalletHealth – FINAL STABLE FRONTEND SCRIPT
 * Compatible with:
 * - GitHub Pages
 * - Mobile browsers
 * - Cloudflare Workers backend
 *********************************************************/

const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("checkBtn");
  btn.addEventListener("click", checkWallet);
});

/* ---------------- MAIN ---------------- */

async function checkWallet() {
  const input = document.getElementById("walletInput");
  const address = input.value.trim();

  if (!address) {
    alert("Please enter a wallet address");
    return;
  }

  hideResult();

  try {
    const res = await fetch(`${API_URL}?address=${address}`);
    const data = await res.json();

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

/* ---------------- SCORING ENGINE ---------------- */

function calculateWalletHealth(api) {
  let score = 50;
  const reasons = [];
  const actions = [];

  const balance = api.balance?.value ?? 0;
  const txCount = api.activity?.txCount ?? 0;
  const dormant = api.flags?.isDormant ?? false;
  const network = api.meta?.network;

  if (network === "Bitcoin") {
    if (balance > 0) score += 30;
    else {
      score -= 15;
      reasons.push("Wallet has zero BTC balance");
    }

    if (txCount > 0) score += 25;
    else reasons.push("Low or no transaction history");

    if (!dormant) score += 20;
    else {
      score -= 20;
      reasons.push("Bitcoin wallet appears dormant");
      actions.push("Review long-term BTC storage");
    }

  } else {
    // Ethereum logic
    if (txCount > 0) score += 30;
    else reasons.push("No recent Ethereum transactions");

    if (!dormant) score += 30;
    else {
      score -= 30;
      reasons.push("Ethereum wallet is dormant");
      actions.push("Check wallet activity and approvals");
    }

    if (balance > 0) score += 10;
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

/* ---------------- RENDER ---------------- */

function renderResult(api, health) {
  showResult();

  animateScore(health.score);

  setText("network", api.meta.network);
  setText("balance", `${api.balance.value} ${api.balance.unit}`);
  setText("status", health.label);

  document.getElementById("reasons").innerHTML =
    health.reasons.length
      ? `<ul>${health.reasons.map(r => `<li>${r}</li>`).join("")}</ul>`
      : "<p>No major risk signals detected.</p>";

  document.getElementById("actions").innerHTML =
    health.actions.length
      ? `<ul>${health.actions.map(a => `<li>${a}</li>`).join("")}</ul>`
      : "<p>Keep wallet hygiene strong.</p>";
}

/* ---------------- SCORE ANIMATION ---------------- */

function animateScore(target) {
  const el = document.getElementById("score");
  let current = 0;

  const timer = setInterval(() => {
    current++;
    el.innerText = current;
    if (current >= target) {
      clearInterval(timer);
      el.innerText = target;
    }
  }, 15);
}

/* ---------------- HELPERS ---------------- */

function setText(id, value) {
  document.getElementById(id).innerText = value;
}

function showResult() {
  document.getElementById("result").classList.remove("hidden");
}

function hideResult() {
  document.getElementById("result").classList.add("hidden");
}
