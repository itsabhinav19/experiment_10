// MiniSocial — client-only demo with "authentication" simulated using localStorage

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const uid = (p='id') => ${p}_${Math.random().toString(36).slice(2,9)};
const now = () => new Date().toISOString();
const lsKey = 'minisocial_v1';

function saveState(state){ localStorage.setItem(lsKey, JSON.stringify(state)); }
function loadState(){
  const raw = localStorage.getItem(lsKey);
  if(!raw) return null;
  try { return JSON.parse(raw); } catch(e){ return null; }
}

// ---------- Default data ----------
const defaultState = {
  users: [
    { id: 'u1', username: 'alice', name: 'Alice', bio: 'Designer', password: '123' },
    { id: 'u2', username: 'bob', name: 'Bob', bio: 'DevOps', password: '123' }
  ],
  posts: [
    {
      id: 'p1', authorId: 'u1', title: 'Welcome to MiniSocial',
      body: 'This is a demo social feed. Post, like, and comment!', image: '',
      createdAt: now(), likes: [], comments: [{ id: 'c1', authorId: 'u2', text: 'Nice!', createdAt: now() }]
    }
  ],
  currentUserId: null
};

// ---------- State management ----------
let STATE = loadState() || defaultState;
if(!loadState()) saveState(STATE);

// ---------- DOM refs ----------
const authArea = $('#authArea');
const userSelect = $('#userSelect');
const profileCard = $('#profileCard');
const feed = $('#feed');
const composer = $('#composer');
const btnShowComposer = $('#btnShowComposer');
const btnCancelPost = $('#btnCancelPost');
const postForm = $('#postForm');
const postText = $('#postText');
const postImage = $('#postImage');
const btnNewUser = $('#btnNewUser');
const searchInput = $('#searchInput');

const authModal = $('#authModal');
const authClose = $('#authClose');
const authTitle = $('#authTitle');
const authForm = $('#authForm');
const authUsername = $('#authUsername');
const authName = $('#authName');
const authPassword = $('#authPassword');
const authSubmit = $('#authSubmit');
const toggleAuth = $('#toggleAuth');

// ---------- Render functions ----------
function renderAuthArea(){
  authArea.innerHTML = '';
  if(STATE.currentUserId){
    const user = STATE.users.find(u=>u.id===STATE.currentUserId);
    const wrap = document.createElement('div');
    wrap.className = 'auth-wrap';
    wrap.innerHTML = `
      <span style="margin-right:12px">${user.name} (@${user.username})</span>
      <button id="btnProfile" class="btn ghost">Profile</button>
      <button id="btnLogout" class="btn">Logout</button>
    `;
    authArea.appendChild(wrap);
    $('#btnProfile').addEventListener('click', ()=> alert(${user.name}\n@${user.username}\n\n${user.bio || ''}));
    $('#btnLogout').addEventListener('click', ()=> { STATE.currentUserId = null; saveState(STATE); rerenderAll(); });
  } else {
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn primary';
    loginBtn.textContent = 'Sign In / Sign Up';
    loginBtn.addEventListener('click', ()=> openAuthModal('signin'));
    authArea.appendChild(loginBtn);
  }
}

function renderUserSelect(){
  userSelect.innerHTML = STATE.users.map(u=><option value="${u.id}">${u.username}</option>).join('');
  userSelect.value = STATE.currentUserId || '';
  userSelect.addEventListener('change', e=>{
    STATE.currentUserId = e.target.value || null;
    saveState(STATE);
    rerenderAll();
  });
}

function renderProfileCard(){
  const user = STATE.users.find(u=>u.id===STATE.currentUserId);
  if(!user){
    profileCard.innerHTML = <div class="small muted">Not signed in. Create or sign in to post.</div>;
    return;
  }
  profileCard.innerHTML = `
    <div class="avatar">${user.name.slice(0,1).toUpperCase()}</div>
    <div class="name">${user.name}</div>
    <div class="meta">@${user.username}</div>
    <div class="meta" style="margin-top:8px">${user.bio || ''}</div>
  `;
}

function renderFeed(filter=''){
  feed.innerHTML = '';
  const posts = STATE.posts.slice().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  const q = filter.trim().toLowerCase();
  const filtered = posts.filter(p => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  if(filtered.length === 0){
    feed.innerHTML = <div class="card muted">No posts to show.</div>;
    return;
  }
  filtered.forEach(p => {
    const author = STATE.users.find(u=>u.id===p.authorId) || {name:'Unknown', username:'anon'};
    const el = document.createElement('article');
    el.className = 'post card';
    el.innerHTML = `
      <div class="meta">${author.name} • <small class="muted">${new Date(p.createdAt).toLocaleString()}</small></div>
      <h3 class="title">${escapeHtml(p.title || '')}</h3>
      <div class="body">${escapeHtml(p.body || '')}</div>
      ${p.image ? <img src="${escapeAttr(p.image)}" alt="post image" onerror="this.style.display='none'"/> : ''}
      <div class="actions">
        <button class="icon-btn like ${p.likes.includes(STATE.currentUserId) ? 'active' : ''}" data-id="${p.id}">♥ ${p.likes.length}</button>
        <button class="icon-btn comment" data-id="${p.id}">💬 ${p.comments.length}</button>
        ${STATE.currentUserId === p.authorId ? <button class="icon-btn" data-del="${p.id}">🗑 Delete</button> : ''}
      </div>
      <div class="comments" id="comments-${p.id}">
        ${p.comments.slice().reverse().map(c => {
          const ca = STATE.users.find(u=>u.id===c.authorId) || {name:'Unknown'};
          return <div class="comment"><div class="meta"><strong>${escapeHtml(ca.name)}</strong> • <small class="muted">${new Date(c.createdAt).toLocaleString()}</small></div><div>${escapeHtml(c.text)}</div></div>;
        }).join('')}
        <form onsubmit="event.preventDefault(); addComment('${p.id}');" style="margin-top:8px">
          <input id="comment-${p.id}" placeholder="Write a comment..." style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:var(--white)"/>
        </form>
      </div>
    `;
    feed.appendChild(el);
  });

  // attach event listeners
  document.querySelectorAll('.icon-btn.like').forEach(btn=>{
    btn.addEventListener('click', ()=> toggleLike(btn.dataset.id));
  });
  document.querySelectorAll('.icon-btn[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=> deletePost(btn.dataset.del));
  });
}

function rerenderAll(){
  renderAuthArea();
  renderUserSelect();
  renderProfileCard();
  renderFeed(searchInput.value || '');
  // show composer if signed in
  if(STATE.currentUserId) composer.classList.remove('hidden'); else composer.classList.add('hidden');
}

// ---------- Actions ----------
function openAuthModal(mode='signin'){
  authModal.classList.remove('hidden');
  if(mode === 'signin'){
    authTitle.textContent = 'Sign In';
    authName.classList.add('hidden');
    toggleAuth.textContent = 'Switch to Sign up';
  } else {
    authTitle.textContent = 'Sign Up';
    authName.classList.remove('hidden');
    toggleAuth.textContent = 'Switch to Sign in';
  }
  authModal.dataset.mode = mode;
}

authClose.addEventListener('click', ()=> authModal.classList.add('hidden'));
toggleAuth.addEventListener('click', ()=> {
  const mode = authModal.dataset.mode === 'signin' ? 'signup' : 'signin';
  openAuthModal(mode);
});

authForm.addEventListener('submit', e=>{
  e.preventDefault();
  const mode = authModal.dataset.mode;
  const username = authUsername.value.trim();
  const password = authPassword.value;
  if(mode === 'signup'){
    const name = authName.value.trim();
    if(!username || !name) return alert('username & name required');
    if(STATE.users.some(u=>u.username.toLowerCase() === username.toLowerCase())) return alert('username taken');
    const u = { id: uid('u'), username, name, bio:'', password };
    STATE.users.push(u);
    STATE.currentUserId = u.id;
    saveState(STATE);
    authModal.classList.add('hidden');
    authForm.reset();
    rerenderAll();
  } else {
    // signin
    const u = STATE.users.find(u=>u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if(!u) return alert('invalid credentials');
    STATE.currentUserId = u.id;
    saveState(STATE);
    authModal.classList.add('hidden');
    authForm.reset();
    rerenderAll();
  }
});

// create post
postForm.addEventListener('submit', e=>{
  e.preventDefault();
  if(!STATE.currentUserId) return openAuthModal('signin');
  const title = (postText.value || '').trim();
  const image = (postImage.value || '').trim();
  if(!title) return alert('Post text required');
  const p = { id: uid('p'), authorId: STATE.currentUserId, title: title.slice(0,120), body: title, image, createdAt: now(), likes: [], comments: [] };
  STATE.posts.unshift(p);
  saveState(STATE);
  postForm.reset();
  rerenderAll();
});

// toggle composer
btnShowComposer.addEventListener('click', ()=>{
  if(!STATE.currentUserId) return openAuthModal('signin');
  composer.classList.toggle('hidden');
});
btnCancelPost.addEventListener('click', ()=> { postForm.reset(); composer.classList.add('hidden'); });

// like/unlike
function toggleLike(postId){
  if(!STATE.currentUserId) return openAuthModal('signin');
  const p = STATE.posts.find(x=>x.id===postId);
  if(!p) return;
  const i = p.likes.indexOf(STATE.currentUserId);
  if(i===-1) p.likes.push(STATE.currentUserId); else p.likes.splice(i,1);
  saveState(STATE);
  renderFeed(searchInput.value || '');
}

// add comment
function addComment(postId){
  if(!STATE.currentUserId) return openAuthModal('signin');
  const input = $(#comment-${postId});
  const text = (input.value || '').trim();
  if(!text) return;
  const p = STATE.posts.find(x=>x.id===postId);
  p.comments.push({ id: uid('c'), authorId: STATE.currentUserId, text, createdAt: now() });
  saveState(STATE);
  renderFeed(searchInput.value || '');
}

// delete post
function deletePost(postId){
  const p = STATE.posts.find(x=>x.id===postId);
  if(!p) return;
  if(p.authorId !== STATE.currentUserId) return alert('You can only delete your own posts');
  if(!confirm('Delete this post?')) return;
  STATE.posts = STATE.posts.filter(x=>x.id!==postId);
  saveState(STATE);
  rerenderAll();
}

// search
searchInput.addEventListener('input', e=>{
  renderFeed(e.target.value || '');
});

// quick new user button opens signup
btnNewUser.addEventListener('click', ()=> openAuthModal('signup'));

// helpers
function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[m]); }
function escapeAttr(s){ return (s||'').replace(/"/g, '&quot;'); }

// initial render
rerenderAll();

// Expose addComment as global for inline onsubmit usage inside render (forms)
window.addComment = addComment;