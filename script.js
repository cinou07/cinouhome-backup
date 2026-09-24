/* ==========================================================
   Cinou AI — site script
   - mobile nav
   - fullscreen "download on phone" modal
   - comment system with nested replies (persisted in localStorage)
   ========================================================== */

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------------- Mobile nav ---------------- */
(function(){
  const burger = document.getElementById('burgerBtn');
  const menu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));
})();

/* ---------------- Phone download modal ---------------- */
(function(){
  const modal = document.getElementById('phoneModal');
  const openBtns = [document.getElementById('openPhoneModal'), document.getElementById('openPhoneModal2')];
  const closeBtn = document.getElementById('closePhoneModal');
  let lastFocused = null;

  function openModal(){
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeModal(){
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  openBtns.forEach(btn => btn && btn.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
})();

/* ---------------- iPhone download notice ---------------- */
(function(){
  const link = document.getElementById('iphoneDownloadLink');
  if (!link) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    alert(
      "( if you don't have a PC, don't click it — it's an unsigned iOS app (.ipa), so you need a PC to sign it )\n\n" +
      "To download the app, go to CinouAI on web — it will open an installation window."
    );
    window.location.href = link.href;
  });
})();

/* ---------------- PC download modal ---------------- */
(function(){
  const modal = document.getElementById('pcModal');
  const openBtns = [document.getElementById('openPcModal'), document.getElementById('openPcModal2')];
  const closeBtn = document.getElementById('closePcModal');
  let lastFocused = null;

  function openModal(){
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeModal(){
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  openBtns.forEach(btn => btn && btn.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
})();

/* ---------------- Comment system (public, Google sign-in) ---------------- */
(function(){
  const API_URL = '/api/comments';
  const LIKE_URL = '/api/like';
  const CLIENT_ID_META = document.querySelector('meta[name="google-signin-client_id"]');
  const CLIENT_ID = CLIENT_ID_META ? CLIENT_ID_META.content : '';

  const form = document.getElementById('commentForm');
  const bodyInput = document.getElementById('commentBody');
  const charCount = document.getElementById('charCount');
  const list = document.getElementById('commentList');
  const emptyState = document.getElementById('commentEmpty');

  const signedOutEl = document.getElementById('authSignedOut');
  const signedInEl = document.getElementById('authSignedIn');
  const authAvatar = document.getElementById('authAvatar');
  const authName = document.getElementById('authName');
  const signOutBtn = document.getElementById('signOutBtn');
  const googleBtnSlot = document.getElementById('googleSignInBtn');

  const AVATAR_COLORS = ['#D9622B', '#B84E20', '#3E7C59', '#3E6B8C', '#7A5AA8', '#C0553B'];

  let currentUser = null; // { credential, name, picture }

  function decodeJwt(token){
    try{
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    }catch(e){ return null; }
  }

  function handleCredentialResponse(response){
    const payload = decodeJwt(response.credential);
    if (!payload) return;
    currentUser = { credential: response.credential, name: payload.name, picture: payload.picture };
    signedOutEl.hidden = true;
    signedInEl.hidden = false;
    authAvatar.src = payload.picture || '';
    authName.textContent = payload.name || payload.email || 'Signed in';
    form.hidden = false;
    loadComments(); // refresh so already-liked comments show a filled heart
  }

  function signOut(){
    currentUser = null;
    signedInEl.hidden = true;
    signedOutEl.hidden = false;
    form.hidden = true;
    form.reset();
    charCount.textContent = '0';
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    loadComments(); // reload as an anonymous view (hearts reset to outline)
  }
  signOutBtn.addEventListener('click', signOut);

  function initGoogle(attemptsLeft){
    if (window.google && google.accounts && google.accounts.id) {
      if (!CLIENT_ID || CLIENT_ID.indexOf('PASTE_YOUR_GOOGLE_CLIENT_ID_HERE') === 0) {
        signedOutEl.innerHTML = '<p class="comment-auth__lede">Google sign-in is not configured yet — add your GOOGLE_CLIENT_ID.</p>';
        return;
      }
      google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredentialResponse });
      google.accounts.id.renderButton(googleBtnSlot, {
        theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 260
      });
      return;
    }
    if (attemptsLeft > 0) setTimeout(() => initGoogle(attemptsLeft - 1), 150);
  }
  initGoogle(40); // retry while the Google script loads, ~6s max

  function avatarHTML(name, picture){
    if (picture) return `<img class="comment__avatar comment__avatar--img" src="${escapeHTML(picture)}" alt="">`;
    return `<div class="comment__avatar" style="background:${colorFor(name)}">${initials(name)}</div>`;
  }

  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function initials(name){
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function colorFor(name){
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function timeAgo(timestamp){
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.floor(hours / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    return new Date(timestamp).toLocaleDateString();
  }

  function likeButtonHTML(item){
    const liked = !!item.likedByMe;
    return `
      <button type="button" class="comment__like-btn${liked ? ' is-liked' : ''}" data-id="${item.id}" aria-pressed="${liked ? 'true' : 'false'}" aria-label="Like this comment">
        <span class="comment__like-icon">${liked ? '♥' : '♡'}</span>
        <span class="comment__like-count">${item.likes || 0}</span>
      </button>
    `;
  }

  function wireLikeButton(btn){
    btn.addEventListener('click', async () => {
      if (!currentUser) {
        googleBtnSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      btn.disabled = true;
      try{
        const res = await fetch(LIKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: currentUser.credential, commentId: btn.dataset.id })
        });
        if (!res.ok) throw new Error('request failed');
        const data = await res.json(); // { liked, likes }
        btn.classList.toggle('is-liked', data.liked);
        btn.setAttribute('aria-pressed', data.liked ? 'true' : 'false');
        btn.querySelector('.comment__like-icon').textContent = data.liked ? '♥' : '♡';
        btn.querySelector('.comment__like-count').textContent = data.likes;
      }catch(err){
        alert("Couldn't update your like. Please try again.");
      }finally{
        btn.disabled = false;
      }
    });
  }

  function renderReply(reply){
    const wrap = document.createElement('div');
    wrap.className = 'comment';
    wrap.innerHTML = `
      ${avatarHTML(reply.name, reply.picture)}
      <div class="comment__body">
        <div class="comment__head">
          <span class="comment__name">${escapeHTML(reply.name)}</span>
          <span class="comment__time">${timeAgo(reply.time)}</span>
        </div>
        <p class="comment__text">${escapeHTML(reply.text)}</p>
        <div class="comment__actions">
          ${likeButtonHTML(reply)}
        </div>
      </div>
    `;
    wireLikeButton(wrap.querySelector('.comment__like-btn'));
    return wrap;
  }

  function renderComment(comment){
    const wrap = document.createElement('div');
    wrap.className = 'comment';
    wrap.dataset.id = comment.id;

    wrap.innerHTML = `
      ${avatarHTML(comment.name, comment.picture)}
      <div class="comment__body">
        <div class="comment__head">
          <span class="comment__name">${escapeHTML(comment.name)}</span>
          <span class="comment__time">${timeAgo(comment.time)}</span>
        </div>
        <p class="comment__text">${escapeHTML(comment.text)}</p>
        <div class="comment__actions">
          ${likeButtonHTML(comment)}
          <button type="button" class="comment__reply-btn">Reply</button>
        </div>

        <form class="reply-form">
          <textarea placeholder="Write a reply…" required maxlength="500" rows="2"></textarea>
          <div class="reply-form__actions">
            <button type="button" class="btn btn--secondary btn--small reply-cancel">Cancel</button>
            <button type="submit" class="btn btn--primary btn--small">Reply</button>
          </div>
        </form>

        <div class="comment__replies"></div>
      </div>
    `;

    const replyBtn = wrap.querySelector('.comment__reply-btn');
    const replyForm = wrap.querySelector('.reply-form');
    const cancelBtn = wrap.querySelector('.reply-cancel');
    const repliesEl = wrap.querySelector('.comment__replies');

    wireLikeButton(wrap.querySelector('.comment__like-btn'));
    (comment.replies || []).forEach(r => repliesEl.appendChild(renderReply(r)));

    replyBtn.addEventListener('click', () => {
      if (!currentUser) {
        googleBtnSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      replyForm.classList.toggle('is-open');
      if (replyForm.classList.contains('is-open')) replyForm.querySelector('textarea').focus();
    });
    cancelBtn.addEventListener('click', () => {
      replyForm.classList.remove('is-open');
      replyForm.reset();
    });

    replyForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!currentUser) return;
      const textEl = replyForm.querySelector('textarea');
      const text = textEl.value.trim();
      if (!text) return;

      const submitBtn = replyForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try{
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: currentUser.credential, text, parentId: comment.id })
        });
        if (!res.ok) throw new Error('request failed');
        const reply = await res.json();
        repliesEl.appendChild(renderReply(reply));
        replyForm.reset();
        replyForm.classList.remove('is-open');
      }catch(err){
        alert("Couldn't post your reply. Please try again.");
      }finally{
        submitBtn.disabled = false;
      }
    });

    return wrap;
  }

  async function loadComments(){
    try{
      const url = currentUser ? `${API_URL}?credential=${encodeURIComponent(currentUser.credential)}` : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error('request failed');
      const comments = await res.json();
      list.innerHTML = '';
      comments.slice().sort((a, b) => b.time - a.time).forEach(c => list.appendChild(renderComment(c)));
      emptyState.classList.toggle('is-visible', comments.length === 0);
    }catch(err){
      emptyState.textContent = "Couldn't load comments right now — try refreshing.";
      emptyState.classList.add('is-visible');
    }
  }

  bodyInput.addEventListener('input', () => {
    charCount.textContent = bodyInput.value.length;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser) return;
    const text = bodyInput.value.trim();
    if (!text) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try{
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: currentUser.credential, text })
      });
      if (!res.ok) throw new Error('request failed');
      const comment = await res.json();
      list.prepend(renderComment(comment));
      emptyState.classList.remove('is-visible');
      form.reset();
      charCount.textContent = '0';
    }catch(err){
      alert("Couldn't post your comment. Please try again.");
    }finally{
      submitBtn.disabled = false;
    }
  });

  loadComments();
})();