const accountLabel = document.querySelector("#accountLabel");
const adminAccessLink = document.querySelector("#adminAccessLink");
const accountLogoutButton = document.querySelector("#accountLogoutButton");

async function loadAccountIdentity() {
  try {
    const response = await fetch("/api/auth/session", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("登录状态已失效");
    const result = await response.json();
    accountLabel.textContent = result.user.displayName;
    adminAccessLink.hidden = result.user.role !== "admin";
  } catch {
    location.replace("/login");
  }
}

accountLogoutButton.addEventListener("click", async () => {
  accountLogoutButton.disabled = true;
  accountLogoutButton.querySelector(".button-label").textContent = "退出中";
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  location.replace("/login");
});

loadAccountIdentity();
