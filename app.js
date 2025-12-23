const API = "https://wallethealth-api.singh-wsg.workers.dev";

function checkWallet() {
  const address = document.getElementById("addressInput").value.trim();
  if (!address) return;

  fetch(`${API}?address=${address}`)
    .then(res => res.json())
    .then(data => renderResult(data))
    .catch(() => alert("Failed to fetch wallet data"));
}

function renderResult(data) {
  document.getElementById("result").classList.remove("hidden");

  // BASIC INFO
  document.getElementById("network").innerText = data.meta.network;
  document.getElementById("walletType").innerText = data.meta.addressType;
  document.getElementById("balance").innerText =
    `${data.balance.value} ${data.balance.unit}`;

  // SCORE CALCULATION
  const score = calculateScore(data);
  document.getElementById("scoreCircle").innerText = score;

  const statusLabel = getStatus(score);
  document.getElementById("statusLabel").innerText = statusLabel;

  // REASONS
  const reasonsEl = document.getElementById("reasons");
  reasonsEl.innerHTML = "";
  const reasons = generateReasons(data);

  reasons.forEach(r => {
    const li = document.createElement("li");
    li.innerText = r;
    reasonsEl.appendChild(li);
  });

  // APPROVALS
  const approvalsCard = document.getElementById("approvalsCard");
  const approvalsList = document.getElementById("approvalsList");
  approvalsList.innerHTML = "";

  if (!data.approvals.supported) {
    approvalsCard.style.display = "block";
    approvalsList.innerText =
      "Bitcoin wallets do not support token approvals.";
  } else if (data.approvals.count === 0) {
    approvalsList.innerText = "No risky approvals found.";
  } else {
    data.approvals.list.forEach(a => {
      const div = document.createElement("div");
      div.className = "approval-item";
      div.innerHTML = `
        ${a.token} → ${a.spender}<br/>
        Allowance: ${a.allowance}
        <div class="revoke">Revoke Approval</div>
      `;
      approvalsList.appendChild(div);
    });
  }

  // ACTIONS
  const actionsEl = document.getElementById("actions");
  actionsEl.innerHTML = "";
  const actions = generateActions(data);

  actions.forEach(a => {
    const li = document.createElement("li");
    li.innerText = a;
    actionsEl.appendChild(li);
  });
}

// ---------------- SCORE LOGIC ----------------

function calculateScore(data) {
  let score = 100;

  // SAFETY
  if (data.approvals.unlimitedCount > 0) score -= 20;
  if (data.approvals.count > 3) score -= 10;

  // ACTIVITY
  if (data.flags.isDormant) score -= 20;

  // STRUCTURE
  if (data.meta.addressType === "CONTRACT") score -= 15;

  return Math.max(0, score);
}

function getStatus(score) {
  if (score >= 90) return "Very Healthy";
  if (score >= 75) return "Healthy";
  if (score >= 55) return "Medium Risk";
  if (score >= 35) return "High Risk";
  return "Critical";
}

// ---------------- REASONS ----------------

function generateReasons(data) {
  const reasons = [];

  if (data.approvals.unlimitedCount > 0)
    reasons.push("You have unlimited token approvals.");

  if (data.flags.isDormant)
    reasons.push("Wallet has been inactive for a long time.");

  if (data.meta.addressType === "CONTRACT")
    reasons.push("This is a smart contract wallet.");

  if (reasons.length === 0)
    reasons.push("No major risk signals detected.");

  return reasons;
}

// ---------------- ACTIONS ----------------

function generateActions(data) {
  const actions = [];

  if (data.approvals.unlimitedCount > 0)
    actions.push("Revoke unused token approvals.");

  if (data.flags.isDormant)
    actions.push("Send a small self-transaction to keep wallet active.");

  actions.push("Avoid signing transactions from unknown dApps.");
  actions.push("Check wallet health regularly.");

  return actions;
}
