  const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("checkBtn");
  if (!btn) {
    console.error("Button not found");
    return;
  }
  btn.addEventListener("click", checkWallet);
});

/* ---------------- MAIN ---------------- */
async function checkWallet() {
  const input = document.getElementById("walletInput");
  if (!input) {
    alert("Wallet input not found");
    return;
  }

  const address = input.value.trim();
  if (!address) {
    alert("Please enter wallet address");
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

  } catch (e) {
    console.error(e);
    alert("Failed to fetch data");
  }
}

/* ---------------- HEALTH ENGINE ---------------- */
function calculateWalletHealth(api) {
  let score = 50; // neutral base
  const reasons = [];
  const actions = [];

  const balance = api.balance?.value ?? 0;
  const txCount = api.activity?.txCount ?? 0;
  const dormant = api.flags?.isDormant ?? false;
  const network = api.meta?.network;

  if (network === "Bitcoin") {
    // BTC logic
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
      actions.push("Consider reviewing long-term BTC storage");
    }

  } else {
    // ETH logic
    if (txCount > 0) score += 30;
    else reasons.push("No recent Ethereum transactions");

    if (!dormant) score += 30;
    else {
      score -= 30;
      reasons.push("Ethereum wallet is dormant");
      actions.push("Check token approvals and activity");
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

/* ---------------- RENDER ---------------- */
function renderResult(api, health) {
  showResult();

  document.getElementById("score").innerText = health.score;
  document.getElementById("network").innerText = api.meta.network;
  document.getElementById("balance").innerText =
    `${api.balance.value} ${api.balance.unit}`;
  document.getElementById("status").innerText = health.label;

  document.getElementById("reasons").innerHTML =
    health.reasons.length
      ? `<ul>${health.reasons.map(r => `<li>${r}</li>`).join("")}</ul>`
      : "<p>No major risk signals detected.</p>";

  document.getElementById("actions").innerHTML =
    health.actions.length
      ? `<ul>${health.actions.map(a => `<li>${a}</li>`).join("")}</ul>`
      : "<p>Keep wallet hygiene strong.</p>";
}

/* ---------------- VISIBILITY ---------------- */
function showResult() {
  document.getElementById("result").classList.remove("hidden");
}

function hideResult() {
  document.getElementById("result").classList.add("hidden");
}  
