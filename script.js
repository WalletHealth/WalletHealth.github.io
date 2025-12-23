const API_URL = "https://wallethealth-api.singh-wsg.workers.dev";

document
  .getElementById("checkBtn")
  .addEventListener("click", checkWallet);

async function checkWallet() {
  const address = document.getElementById("walletInput").value.trim();
  if (!address) return alert("Enter wallet address");

  const res = await fetch(`${API_URL}?address=${address}`);
  const data = await res.json();

  const health = buildHealthFromData(data);
  renderResult(data, health);
}

/* -----------------------------
   FRONTEND HEALTH LOGIC ONLY
--------------------------------*/
function buildHealthFromData(data) {
  let score = 100;
  const reasons = [];
  const actions = [];

  const { meta, balance, activity, approvals } = data;

  /* BALANCE */
  if (balance.value <= 0) {
    score -= 20;
    reasons.push("Wallet has zero balance.");
  }

  /* ACTIVITY */
  if (activity.txCount === 0) {
    score -= 20;
    reasons.push("No on-chain activity detected.");
    actions.push("Send a small self-transaction to activate wallet.");
  }

  /* NETWORK-SPECIFIC LOGIC */
  if (meta.network === "Bitcoin") {
    reasons.push("Bitcoin wallets do not use smart contracts or approvals.");
  }

  /* APPROVALS (EVM ONLY) */
  if (approvals?.supported && approvals.unlimitedCount > 0) {
    score -= 30;
    reasons.push(
      `You have ${approvals.unlimitedCount} unlimited token approval(s).`
    );
    actions.push("Revoke risky approvals to reduce exposure.");
  }

  /* SCORE FLOOR / CEILING */
  score = Math.max(10, Math.min(score, 100));

  return {
    score,
    label: getScoreLabel(score),
    reasons,
    actions
  };
}

/* -----------------------------
   SCORE LABEL
--------------------------------*/
function getScoreLabel(score) {
  if (score >= 90) return "Very Healthy";
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Needs Attention";
  return "High Risk";
}

/* -----------------------------
   RENDER UI
--------------------------------*/
function renderResult(api, health) {
  document.getElementById("score").innerText = health.score;
  document.getElementById("status").innerText = health.label;
  document.getElementById("network").innerText = api.meta.network;
  document.getElementById("walletType").innerText =
    api.meta.addressType || "BTC";
  document.getElementById("balance").innerText =
    api.balance.value + " " + api.balance.unit;

  /* WHY THIS SCORE */
  const reasonsBox = document.getElementById("reasons");
  reasonsBox.innerHTML =
    health.reasons.length > 0
      ? health.reasons.map(r => `<li>${r}</li>`).join("")
      : "<li>No major risk signals detected.</li>";

  /* ACTIONS */
  const actionsBox = document.getElementById("actions");
  actionsBox.innerHTML =
    health.actions.length > 0
      ? health.actions.map(a => `<li>${a}</li>`).join("")
      : "<li>Keep wallet hygiene strong.</li>";
}
