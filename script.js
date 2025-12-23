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
  let score = 0;
  const reasons = [];
  const actions = [];

  const balance = api.balance?.value ?? 0;
  const tx = api.activity?.txCount ?? 0;
  const dormant = api.flags?.isDormant ?? false;
  const network = api.meta.network;

  if (balance > 0) score += 30;
  else reasons.push("Wallet has zero balance");

  if (tx > 0) score += 25;
  else reasons.push("Low or no on-chain activity");

  score += network === "Bitcoin" ? 20 : 15;

  if (dormant) {
    score -= 10;
    actions.push("Review wallet activity periodically");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score >= 70 ? "Healthy" : score >= 50 ? "Needs Attention" : "Risky",
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
