const form = document.getElementById("submission-form");
const storyList = document.getElementById("story-list");

const state = {
  submissions: [],
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const sortByLikes = (items) =>
  items.sort((a, b) => b.likes - a.likes || b.created_at - a.created_at);

const renderSubmissions = () => {
  storyList.innerHTML = "";
  sortByLikes(state.submissions).forEach((item) => {
    const li = document.createElement("li");
    li.className = "submission-card";
    li.innerHTML = `
      <img class="submission-image" src="${item.image_url}" alt="صورة المشاركة" />
      <div class="card-head">
        <div>${item.title}</div>
        <div>${item.name}</div>
      </div>
      <p class="card-desc">${item.description}</p>
      <div class="card-footer">
        <span>${formatDate(item.created_at)}</span>
        <div class="card-actions">
          <button class="like-btn" data-id="${item.id}" type="button">❤ إعجاب <strong>${item.likes}</strong></button>
          <button class="trash-btn" data-id="${item.id}" type="button" aria-label="حذف المشاركة">🗑 حذف</button>
        </div>
      </div>
    `;
    storyList.appendChild(li);
  });
};

const fetchJSON = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = "حدث خطأ غير متوقع";
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }
  return res.json();
};

const loadSubmissions = async () => {
  state.submissions = await fetchJSON("/api/submissions");
  renderSubmissions();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = document.getElementById("story-title").value.trim();
  const name = document.getElementById("story-name").value.trim();
  const description = document.getElementById("story-desc").value.trim();
  const imageFile = document.getElementById("story-image").files[0];
  if (!title || !name || !description || !imageFile) return;

  const formData = new FormData();
  formData.append("title", title);
  formData.append("name", name);
  formData.append("description", description);
  formData.append("image", imageFile);

  try {
    await fetchJSON("/api/submissions", {
      method: "POST",
      body: formData,
    });
    form.reset();
    await loadSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

storyList.addEventListener("click", async (event) => {
  const trashButton = event.target.closest(".trash-btn");
  if (trashButton) {
    const { id } = trashButton.dataset;
    try {
      await fetchJSON(`/api/submissions/${id}`, { method: "DELETE" });
      await loadSubmissions();
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  const likeButton = event.target.closest(".like-btn");
  if (!likeButton) return;

  const { id } = likeButton.dataset;
  try {
    await fetchJSON(`/api/submissions/${id}/like`, { method: "POST" });
    await loadSubmissions();
  } catch (error) {
    alert(error.message);
  }
});

loadSubmissions();
