const form = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const togglePasswordButton = document.querySelector("#togglePassword");
const loginButton = document.querySelector("#loginButton");
const loginMessage = document.querySelector("#loginMessage");

function destination() {
  const requested = new URLSearchParams(location.search).get("next");
  return requested && requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/login") ? requested : "/";
}

function showMessage(message, success = false) {
  loginMessage.textContent = message;
  loginMessage.classList.toggle("is-success", success);
}

togglePasswordButton.addEventListener("click", () => {
  const visible = passwordInput.type === "text";
  passwordInput.type = visible ? "password" : "text";
  togglePasswordButton.textContent = visible ? "显示" : "隐藏";
  togglePasswordButton.setAttribute("aria-pressed", String(!visible));
  togglePasswordButton.setAttribute("aria-label", visible ? "显示密码" : "隐藏密码");
  passwordInput.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    showMessage("请完整填写客户账号和密码。");
    return;
  }

  loginButton.disabled = true;
  loginButton.querySelector("strong").textContent = "正在安全验证…";
  showMessage("");
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "登录失败，请稍后重试");
    showMessage(`验证成功，欢迎 ${result.user.displayName}！`, true);
    window.setTimeout(() => location.replace(result.user.role === "admin" ? "/admin" : destination()), 350);
  } catch (error) {
    showMessage(error.message);
    passwordInput.select();
  } finally {
    loginButton.disabled = false;
    loginButton.querySelector("strong").textContent = "验证账号并进入旅程";
  }
});

fetch("/api/auth/session").then(async (response) => {
  if (!response.ok) return;
  const result = await response.json();
  if (result.authenticated) location.replace(result.user.role === "admin" ? "/admin" : destination());
}).catch(() => {});
