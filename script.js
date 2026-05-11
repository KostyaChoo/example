const STORAGE_KEY = "lectureSatisfactionResponses";
const ADMIN_PASSWORD = "admin";

const surveyForm = document.getElementById("survey-form");
const surveyMessage = document.getElementById("survey-message");
const adminLoginForm = document.getElementById("admin-login-form");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginMessage = document.getElementById("admin-login-message");
const dashboardView = document.getElementById("admin-dashboard-view");
const logoutBtn = document.getElementById("logout-btn");

const totalCount = document.getElementById("total-count");
const avgOverall = document.getElementById("avg-overall");
const avgClarity = document.getElementById("avg-clarity");
const usefulChart = document.getElementById("useful-chart");
const adoptionChart = document.getElementById("adoption-chart");
const feedbackList = document.getElementById("feedback-list");

function readResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveResponse(response) {
  const responses = readResponses();
  responses.push(response);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
}

function average(values) {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "Не указано";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function renderBars(container, dataMap) {
  container.innerHTML = "";
  const entries = Object.entries(dataMap);

  if (!entries.length) {
    container.innerHTML = "<p>Пока нет данных.</p>";
    return;
  }

  const max = Math.max(...entries.map(([, count]) => count));

  entries
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, count]) => {
      const percentage = (count / max) * 100;
      const wrapper = document.createElement("div");
      wrapper.className = "bar-item";
      wrapper.innerHTML = `
        <div class="row">
          <span>${label}</span>
          <strong>${count}</strong>
        </div>
        <div class="bar"><span style="width: ${percentage}%"></span></div>
      `;
      container.appendChild(wrapper);
    });
}

function renderFeedback(responses) {
  const comments = responses
    .map((entry) => entry.feedback?.trim())
    .filter(Boolean)
    .slice(-7)
    .reverse();

  feedbackList.innerHTML = "";
  if (!comments.length) {
    feedbackList.innerHTML = "<li>Комментариев пока нет.</li>";
    return;
  }

  comments.forEach((comment) => {
    const li = document.createElement("li");
    li.textContent = comment;
    feedbackList.appendChild(li);
  });
}

function renderDashboard() {
  const responses = readResponses();
  totalCount.textContent = String(responses.length);

  const overallValues = responses.map((r) => Number(r.overall)).filter(Boolean);
  const clarityValues = responses.map((r) => Number(r.clarity)).filter(Boolean);

  avgOverall.textContent = average(overallValues).toFixed(1);
  avgClarity.textContent = average(clarityValues).toFixed(1);

  renderBars(usefulChart, countBy(responses, "mostUseful"));
  renderBars(adoptionChart, countBy(responses, "adoption"));
  renderFeedback(responses);
}

function setMessage(target, text, type) {
  target.textContent = text;
  target.className = `message ${type || ""}`.trim();
}

surveyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(surveyForm);

  const response = {
    name: formData.get("name")?.toString().trim() || "",
    department: formData.get("department")?.toString().trim() || "",
    overall: Number(formData.get("overall")),
    clarity: Number(formData.get("clarity")),
    mostUseful: formData.get("mostUseful"),
    adoption: formData.get("adoption"),
    feedback: formData.get("feedback")?.toString().trim() || "",
    submittedAt: new Date().toISOString()
  };

  saveResponse(response);
  surveyForm.reset();
  setMessage(surveyMessage, "Спасибо! Ваш ответ сохранен.", "success");
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (adminPasswordInput.value === ADMIN_PASSWORD) {
    dashboardView.classList.remove("hidden");
    renderDashboard();
    setMessage(adminLoginMessage, "Вход выполнен.", "success");
    adminPasswordInput.value = "";
    return;
  }

  setMessage(adminLoginMessage, "Неверный пароль.", "error");
});

logoutBtn.addEventListener("click", () => {
  dashboardView.classList.add("hidden");
  setMessage(adminLoginMessage, "Вы вышли из кабинета администратора.", "success");
});
