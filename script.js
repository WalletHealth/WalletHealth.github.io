const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

async function checkWallet() {
  const address = document.getElementById("walletInput").value.trim();
  if (!address) return alert("Enter wallet address");

  const res = await fetch(`${API_URL}?address=${address}`);
  const data = await res.json();

  const health = calculateWalletHealth(data);
  renderResult(data, health);
}

/* 🧠 SCORE ENGINE */
function calculateWalletHealth(apiData) {
  let score = 0;
  const reasons = [];
  const actions = [];

  const { balance, activity, approvals, flags, meta } = apiData;

  // Balance
  if (balance.value > 0) score += 30;
  else {
    score += 10;
    reasons.push("Wallet has zero balance.");
    actions.push("Use wallet actively or move funds.");
  }

  // Activity
  if (activity.txCount > 0) score += 20;
  else {
    score += 10;
    reasons.push("No on-chain activity found.");
    actions.push("Send a small self transaction.");
  }

  // Wallet type
  if (meta.network === "Bitcoin") score += 15;
  else if (meta.addressType === "EOA") score += 15;
  else {
    score += 5;
    reasons.push("Smart contract wallets need extra caution.");
  }

  // Approvals
  if (approvals.supported) {
    if (approvals.unlimited > 0) {
      score += 10;
      reasons.push("Unlimited token approvals detected.");
      actions.push("Revoke risky approvals.");
    } else score += 25;
  } else score += 25;

  // Dormancy
  if (!flags.isDormant) score += 10;
  else {
    score += 5;
    reasons.push("Wallet appears dormant.");
    actions.push("Check wallet periodically.");
  }

  score = Math.min(score, 100);

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
  if (score >= 40) return "Needs Attention";
  return "Risky";
}

/* 🖥️ UI RENDER */
function renderResult(api, health) {
  document.getElementById("score").innerText = health.score;
  document.getElementById("status").innerText = health.label;
  document.getElementById("network").innerText = api.meta.network;
  document.getElementById("balance").innerText =
    api.balance.value + " " + api.balance.unit;

  const reasonBox = document.getElementById("reasons");
  const actionBox = document.getElementById("actions");

  reasonBox.innerHTML = health.reasons.length
    ? health.reasons.map(r => `<li>${r}</li>`).join("")
    : "<li>No major risk signals detected.</li>";

  actionBox.innerHTML = health.actions.length
    ? health.actions.map(a => `<li>${a}</li>`).join("")
    : "<li>Keep wallet hygiene strong.</li>";
}
