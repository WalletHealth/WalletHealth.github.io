const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

async function checkWallet() {
  const input = document.getElementById("addressInput");
  const address = input.value.trim();

  if (!address) {
    alert("Please enter a wallet address");
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
    alert("Failed to fetch wallet data");
    console.error(err);
  }
}

/* ---------------- WALLET HEALTH ENGINE ---------------- */

function calculateWalletHealth(apiData) {
  let score = 0;
  const reasons = [];
  const actions = [];

  const { balance, activity, approvals, flags, meta } = apiData;

  // Balance
  if (balance.value > 0) {
    score += 30;
  } else {
    score += 10;
    reasons.push("Wallet has zero balance.");
    actions.push("Avoid leaving wallets empty for long periods.");
  }

  // Activity
  if (activity.txCount && activity.txCount > 0) {
    score += 25;
  } else {
    score += 10;
    reasons.push("No recent on-chain activity.");
    actions.push("Send a small self-transaction to keep wallet active.");
  }

  // Wallet type
  if (meta.network === "Bitcoin") {
    score += 20;
  } else if (meta.addressType === "EOA") {
    score += 15;
  } else {
    score += 5;
    reasons.push("Smart contract wallets need extra caution.");
  }

  // Approvals (ETH only)
  if (approvals.supported) {
    if (approvals.unlimitedCount > 0) {
      score -= 15;
      reasons.push("Unlimited token approvals detected.");
      actions.push("Revoke risky approvals.");
    } else {
      score += 10;
    }
  }

  // Dormancy
  if (!flags.isDormant) {
    score += 15;
  } else {
    score -= 10;
    reasons.push("Wallet appears dormant.");
    actions.push("Review wallet activity periodically.");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: getScoreLabel(score),
    color: getScoreColor(score),
    reasons,
    actions
  };
}

/* ---------------- SCORE HELPERS ---------------- */

function getScoreLabel(score) {
  if (score >= 90) return "Very Healthy";
  if (score >= 70) return "Healthy";
  if (score >= 50) return "Needs Attention";
  return "Risky";
}

function getScoreColor(score) {
  if (score >= 90) return "#22c55e";   // bright green
  if (score >= 70) return "#10b981";   // green
  if (score >= 50) return "#facc15";   // yellow
  return "#ef4444";                    // red
}

/* ---------------- RENDER ---------------- */

function renderResult(api, health) {
  document.getElementById("result").classList.remove("hidden");

  document.getElementById("network").innerText = api.meta.network;
  document.getElementById("walletType").innerText = api.meta.addressType;
  document.getElementById("balance").innerText =
    `${api.balance.value} ${api.balance.unit}`;
  document.getElementById("statusLabel").innerText = health.label;

  animateScore(health.score, health.color);

  const reasonsBox = document.getElementById("reasons");
  reasonsBox.innerHTML = health.reasons.length
    ? health.reasons.map(r => `<li>${r}</li>`).join("")
    : "<li>No major risk signals detected.</li>";

  const actionsBox = document.getElementById("actions");
  actionsBox.innerHTML = health.actions.length
    ? health.actions.map(a => `<li>${a}</li>`).join("")
    : "<li>Keep wallet hygiene strong.</li>";
}

/* ---------------- SCORE ANIMATION ---------------- */

function animateScore(target, color) {
  const el = document.getElementById("scoreCircle");
  let current = 0;

  el.style.color = color;
  el.style.borderColor = color;

  const interval = setInterval(() => {
    current++;
    el.innerText = current;

    if (current >= target) {
      clearInterval(interval);
      el.innerText = target;
    }
  }, 15);
}
