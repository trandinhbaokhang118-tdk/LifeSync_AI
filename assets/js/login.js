const DEMO_EMAIL = "demo@timesport.com";
const DEMO_PASSWORD = "123456";

const form = document.querySelector("#loginForm");
const card = document.querySelector(".login-card");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const message = document.querySelector("#message");
const loginBtn = document.querySelector("#loginBtn");
const togglePassword = document.querySelector("#togglePassword");

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function setLoading(isLoading) {
  if (isLoading) {
    loginBtn.classList.add("loading");
    loginBtn.innerHTML = `<span class="clock-loader"></span><span>Checking time...</span>`;
  } else {
    loginBtn.classList.remove("loading", "success");
    loginBtn.textContent = "Login";
  }
}

function shakeCard() {
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
}

togglePassword?.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  setMessage("");

  const userEmail = email.value.trim();
  const userPassword = password.value.trim();

  if (!userEmail || !userPassword) {
    shakeCard();
    setMessage("Vui lòng nhập email và mật khẩu.", "error");
    return;
  }

  setLoading(true);

  window.setTimeout(() => {
    if (userEmail === DEMO_EMAIL && userPassword === DEMO_PASSWORD) {
      loginBtn.classList.remove("loading");
      loginBtn.classList.add("success");
      loginBtn.innerHTML = `<span class="clock-loader"></span><span>Login success!</span>`;
      setMessage("Đăng nhập thành công. Đang chuyển tới dashboard...", "ok");
      card.classList.add("time-warp");

      window.setTimeout(() => {
        // Đổi dòng này thành route thật của bạn, ví dụ: window.location.href = "/dashboard";
        window.location.href = "dashboard.html";
      }, 900);
      return;
    }

    setLoading(false);
    shakeCard();
    setMessage("Sai tài khoản hoặc mật khẩu. Demo: demo@timesport.com / 123456", "error");
  }, 1200);
});
