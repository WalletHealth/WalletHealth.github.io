const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ WalletHealth script loaded");
});

/* ---------------- MAIN ---------------- */

async function checkWallet() {
  const input = document.getElementById("addressInput");
  if (!input) {
    alert("Address input not found");
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

/* ---------------- HEALTH ENGINE ---------------- */

function calculateWalletHealth(api) {
  let score = 0;
  const reasons = [];
  const actions = [];

  const balance = api.balance?.value ?? 0;
  const txCount = api.activity?.txCount ?? 0;
  const dormant = api.flags?.isDormant ?? false;
  const network = api.meta?.network;
  const approvalsSupported = api.approvals?.supported ?? false;

  if (balance > 0) score += 30;
  else {
    score += 10;
    reasons.push("Wallet has zero balance.");
  }

  if (txCount > 0) score += 25;
  else {
    score += 10;
    reasons.push("Low or no on-chain activity.");
  }

  if (network === "Bitcoin") score += 20;
  else score += 15;

  if (approvalsSupported) score += 10;

  if (dormant) {
    score -= 10;
    reasons.push("Wallet appears dormant.");
    actions.push("Review wallet usage periodically.");
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

  document.getElementById("scoreCircle").innerText = health.score;
  document.getElementById("network").innerText = api.meta.network;
  document.getElementById("walletType").innerText = api.meta.addressType;
  document.getElementById("balance").innerText =
    `${api.balance.value} ${api.balance.unit}`;
  document.getElementById("statusLabel").innerText = health.label;

  document.getElementById("reasons").innerHTML =
    health.reasons.length
      ? health.reasons.map(r => `<li>${r}</li>`).join("")
      : "<li>No major risk signals detected.</li>";

  document.getElementById("actions").innerHTML =
    health.actions.length
      ? health.actions.map(a => `<li>${a}</li>`).join("")
      : "<li>Keep wallet hygiene strong.</li>";
}

/* ---------------- VISIBILITY ---------------- */

function showResult() {
  document.getElementById("result").classList.remove("hidden");
}

function hideResult() {
  document.getElementById("result").classList.add("hidden");
}
