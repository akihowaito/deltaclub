const adminName = document.querySelector("#adminName");
const totalCount = document.querySelector("#totalCount");
const activeCount = document.querySelector("#activeCount");
const disabledCount = document.querySelector("#disabledCount");
const accountList = document.querySelector("#accountList");
const accountTemplate = document.querySelector("#accountTemplate");
const accountMessage = document.querySelector("#accountMessage");
const refreshButton = document.querySelector("#refreshButton");
const logoutButton = document.querySelector("#logoutButton");

function formatDate(timestamp) {
  if (!timestamp) return "从未登录";
  return new Intl.DateTimeFormat("zh-CN", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(new Date(timestamp * 1000));
}

function showMessage(message, error = false) {
  accountMessage.textContent = message;
  accountMessage.classList.toggle("is-error", error);
}

function renderAccounts(users) {
  accountList.innerHTML = "";
  users.forEach((user, index) => {
    const card = accountTemplate.content.firstElementChild.cloneNode(true);
    const active = Boolean(user.active);
    card.classList.toggle("is-disabled", !active);
    card.querySelector(".account-avatar").textContent = String(index + 1).padStart(2, "0");
    card.querySelector(".account-status").textContent = active ? "正常使用" : "已经停用";
    card.querySelector("h3").textContent = user.display_name;
    card.querySelector(".account-username").textContent = user.username;
    card.querySelector(".last-login").textContent = formatDate(user.last_login_at);
    card.querySelector(".created-date").textContent = formatDate(user.created_at).split(" ")[0];
    const button = card.querySelector(".toggle-account");
    button.textContent = active ? "停用此账号" : "恢复此账号";
    button.addEventListener("click", () => setAccountState(user, !active, button));
    accountList.appendChild(card);
  });
  totalCount.textContent = users.length;
  activeCount.textContent = users.filter((user) => user.active).length;
  disabledCount.textContent = users.filter((user) => !user.active).length;
}

async function loadAccounts(announce = false) {
  refreshButton.disabled = true;
  try {
    const response = await fetch("/api/admin/users");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "读取账号失败");
    renderAccounts(result.users);
    if (announce) showMessage("账号状态已刷新。");
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    refreshButton.disabled = false;
  }
}

async function setAccountState(user, active, button) {
  if (!active && !window.confirm(`确定停用「${user.display_name}」吗？\n该客户当前登录会立即失效。`)) return;
  button.disabled = true;
  showMessage(active ? "正在恢复账号…" : "正在停用并撤销登录…");
  try {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "修改账号失败");
    showMessage(result.message);
    await loadAccounts(false);
  } catch (error) {
    showMessage(error.message, true);
    button.disabled = false;
  }
}

refreshButton.addEventListener("click", () => loadAccounts(true));
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  await fetch("/api/auth/logout", { method:"POST" }).catch(() => {});
  location.replace("/login");
});

fetch("/api/auth/session").then(async (response) => {
  if (!response.ok) throw new Error("登录状态已失效");
  const result = await response.json();
  if (result.user.role !== "admin") throw new Error("没有管理员权限");
  adminName.textContent = result.user.displayName;
  return loadAccounts();
}).catch((error) => {
  showMessage(error.message, true);
  window.setTimeout(() => location.replace("/login"), 900);
});
