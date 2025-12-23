const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

async function checkWallet() {
  const address = document.getElementById("walletInput").value.trim();
  if (!address) {
    alert("Please enter wallet address");
    return;
  }

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
    alert("Unable to fetch wallet data");
  }
}

/* ================= SCORE ENGINE ================= */

function calculateWalletHealth(api) {
  let score = 0;
  const reasons = [];
  const actions = [];

  /* BALANCE */
  if (api.balance.value > 0) {
    score += 30;
    reasons.push("Wallet holds funds.");
  } else {
    score += 10;
    reasons.push("Wallet balance is zero.");
    actions.push("Transfer small funds to keep wallet active.");
  }

  /* ACTIVITY */
  const tx = api.activity.txCount || 0;
  if (tx >= 100) {
    score += 25;
    reasons.push("High on-chain activity.");
  } else if (tx > 0) {
    score += 15;
    reasons.push("Some on-chain activity detected.");
  } else {
    score += 5;
    reasons.push("No transaction history found.");
    actions.push("Send a self transaction to activate wallet.");
  }

  /* APPROVALS */
  if (!api.approvals.supported) {
    score += 25;
    reasons.push("No token approval risk (Bitcoin wallet).");
  } else if (api.approvals.unlimitedCount > 0) {
    score += 5;
    reasons.push("Unlimited token approvals detected.");
    actions.push("Revoke risky token approvals.");
  } else {
    score += 25;
    reasons.push("No risky token approvals found.");
  }

  /* DORMANCY */
  if (!api.flags.isDormant) {
    score += 20;
  } else {
    score += 5;
    reasons.push("Wallet appears inactive.");
    actions.push("Check wallet periodically to avoid dormancy.");
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

/* ================= UI RENDER ================= */

function renderResult(api, health) {
  document.getElementById("score").innerText = health.score;
  document.getElementById("status").innerText = health.label;
  document.getElementById("network").innerText = api.meta.network;
  document.getElementById("balance").innerText =
    `${api.balance.value} ${api.balance.unit}`;

  const reasonBox = document.getElementById("reasons");
  reasonBox.innerHTML = health.reasons.length
    ? health.reasons.map(r => `<li>${r}</li>`).join("")
    : "<li>No major risk signals detected.</li>";

  const actionBox = document.getElementById("actions");
  actionBox.innerHTML = health.actions.length
    ? health.actions.map(a => `<li>${a}</li>`).join("")
    : "<li>Keep wallet hygiene strong.</li>";
}
