// MiniBlog — client-side only (in-memory)
// Features: users, switch user, create posts, view posts, comments, delete own posts

// ---------- State ----------
const state = {
  users: [
    { id: "u1", username: "alice", name: "Alice", bio: "Designer" },
    { id: "u2", username: "bob", name: "Bob", bio: "DevOps" }
  ],
  posts: [
    {
      id: "p1",
      authorId: "u1",
      title: "Welcome to MiniBlog",
      content: "This is a demo post. Create your own posts and comments.",
      createdAt: new Date().toISOString(),
      comments: [
        { id: "c1", authorId: "u2", text: "Nice start!", createdAt: new Date().toISOString() }
      ]
    }
  ],
  activeUserId: null,
  idCounter: 100
};

// ---------- Helpers ----------
const uid = (prefix="id") => ${prefix}${++state.idCounter};
const q = sel => document.querySelector(sel);
const formatTime = iso => new Date(iso).toLocaleString();
const escapeHtml = s => (s || "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[m]);

// ---------- DOM refs ----------
const userSelect = q("#userSelect");
const userList = q("#userList");
const userForm = q("#userForm");
const usernameEl = q("#username");
const fullnameEl = q("#fullname");
const bioEl = q("#bio");

const postForm = q("#postForm");
const postTitle = q("#postTitle");
const postBody = q("#postBody");
const postsEl = q("#posts");
const activeUserLabel = q("#activeUserLabel");
const newUserBtn = q("#newUserBtn");
const cancelPostBtn = q("#cancelPost");

// ---------- Render functions ----------
function renderUsers(){
  userSelect.innerHTML = state.users.map(u => <option value="${u.id}">${u.username}</option>).join("");
  userList.innerHTML = state.users.map(u => `
    <li>
      <div>
        <strong>${escapeHtml(u.name)}</strong>
        <div class="meta">@${escapeHtml(u.username)} • ${escapeHtml(u.bio||"")}</div>
      </div>
      <div>
        <button class="btn ghost" onclick="viewProfile('${u.id}')">Profile</button>
      </div>
    </li>
  `).join("");
  if(!state.activeUserId && state.users.length) {
    state.activeUserId = state.users[0].id;
    userSelect.value = state.activeUserId;
  }
  updateActiveLabel();
}

function updateActiveLabel(){
  const u = state.users.find(x => x.id === state.activeUserId);
  activeUserLabel.textContent = u ? Posting as ${u.name} (@${u.username}) : "Not signed in";
}

function renderPosts(){
  const list = state.posts.slice().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  if(list.length === 0){
    postsEl.innerHTML = <div class="card"><p class="muted">No posts yet — be the first to publish!</p></div>;
    return;
  }
  postsEl.innerHTML = list.map(p => {
    const author = state.users.find(u => u.id === p.authorId) || { name: "Unknown", username: "anon" };
    const commentsHtml = (p.comments || []).map(c => {
      const ca = state.users.find(u => u.id === c.authorId) || { name: "Unknown" };
      return <div class="comment"><div class="meta"><strong>${escapeHtml(ca.name)}</strong> • ${formatTime(c.createdAt)}</div><div>${escapeHtml(c.text)}</div></div>;
    }).join("");
    const deleteBtn = state.activeUserId === p.authorId ? <button class="btn ghost" onclick="deletePost('${p.id}')">Delete</button> : "";
    return `
      <article class="post card" id="post-${p.id}">
        <div class="meta">${escapeHtml(author.name)} • ${formatTime(p.createdAt)}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <div class="content">${escapeHtml(p.content)}</div>
        <div class="actions">
          <button class="btn ghost" onclick="openPost('${p.id}')">Open</button>
          ${deleteBtn}
        </div>
        <div class="comments">${commentsHtml}
          <form onsubmit="event.preventDefault(); addComment('${p.id}');" class="comment-form">
            <textarea id="commentText-${p.id}" rows="2" placeholder="Write a comment..." required></textarea>
            <div class="form-row"><button class="btn primary">Post Comment</button></div>
          </form>
        </div>
      </article>
    `;
  }).join("");
}

// ---------- Actions ----------
function openPost(postId){
  const el = q(#post-${postId});
  if(!el) return;
  el.scrollIntoView({behavior:"smooth", block:"center"});
  el.style.boxShadow = "0 12px 40px rgba(124,58,237,0.12)";
  setTimeout(()=> el.style.boxShadow = "", 1200);
}

function viewProfile(userId){
  const u = state.users.find(x=>x.id===userId);
  if(!u) return alert("User not found");
  const userPosts = state.posts.filter(p => p.authorId === u.id);
  alert(${u.name} (@${u.username})\n\nBio: ${u.bio || "—"}\nPosts: ${userPosts.length});
}

function addComment(postId){
  if(!state.activeUserId) return alert("Select or create a user to comment");
  const ta = q(#commentText-${postId});
  const text = ta.value.trim();
  if(!text) return;
  const p = state.posts.find(x=>x.id===postId);
  p.comments = p.comments || [];
  p.comments.push({ id: uid("c"), authorId: state.activeUserId, text, createdAt: new Date().toISOString() });
  ta.value = "";
  renderPosts();
}

function deletePost(postId){
  const p = state.posts.find(x=>x.id===postId);
  if(!p) return;
  if(p.authorId !== state.activeUserId) return alert("You can only delete your own posts");
  if(!confirm("Delete this post?")) return;
  state.posts = state.posts.filter(x=>x.id!==postId);
  renderPosts();
}

// ---------- Form handlers ----------
userForm.addEventListener("submit", e => {
  e.preventDefault();
  const username = usernameEl.value.trim();
  const name = fullnameEl.value.trim();
  const bio = bioEl.value.trim();
  if(!username || !name) return alert("username & fullname required");
  if(state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return alert("username taken");
  const u = { id: uid("u"), username, name, bio };
  state.users.push(u);
  usernameEl.value = fullnameEl.value = bioEl.value = "";
  state.activeUserId = u.id;
  userSelect.value = u.id;
  renderUsers();
  renderPosts();
});

userSelect.addEventListener("change", e => {
  state.activeUserId = e.target.value;
  updateActiveLabel();
});

postForm.addEventListener("submit", e => {
  e.preventDefault();
  if(!state.activeUserId) return alert("Select or create a user before publishing");
  const title = postTitle.value.trim();
  const content = postBody.value.trim();
  if(!title || !content) return alert("Title and content required");
  const newPost = { id: uid("p"), authorId: state.activeUserId, title, content, createdAt: new Date().toISOString(), comments: [] };
  state.posts.push(newPost);
  postTitle.value = postBody.value = "";
  renderPosts();
  openPost(newPost.id);
});

// quick new-user focus
newUserBtn.addEventListener("click", () => usernameEl.focus());

// init
(function init(){
  renderUsers();
  renderPosts();
  updateActiveLabel();
})();

// Expose some helpers for inline onclick usage
window.viewProfile = viewProfile;
window.openPost = openPost;
window.deletePost = deletePost;
window.addComment = addComment;