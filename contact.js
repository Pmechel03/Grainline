/* Email links that work for everyone.

   A plain mailto: link only works if the visitor has an email app set up,
   which many people who use Gmail in a browser don't. So every mailto: link
   on the page opens a small menu instead: their email app, Gmail in a new
   tab, or copy the address. The link's subject and message carry over. */

const menu = document.createElement("div");
menu.className = "mail-menu";
menu.hidden = true;
menu.setAttribute("role", "menu");
document.body.append(menu);

let opener = null;

function parseMailto(href) {
  const url = new URL(href);
  return {to: decodeURIComponent(url.pathname), subject: url.searchParams.get("subject") || "", body: url.searchParams.get("body") || ""};
}

function openMenu(link) {
  const {to, subject, body} = parseMailto(link.href);
  const gmail = "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  menu.innerHTML = `
    <p class="mail-menu-to">${to}</p>
    <a role="menuitem" href="${link.href}" data-mail-keep>Open my email app</a>
    <a role="menuitem" href="${gmail}" target="_blank" rel="noopener">Open in Gmail</a>
    <button type="button" role="menuitem" data-copy>Copy email address</button>
    <p class="mail-menu-msg" role="status"></p>`;
  menu.querySelector("[data-copy]").onclick = async () => {
    const msg = menu.querySelector(".mail-menu-msg");
    try { await navigator.clipboard.writeText(to); msg.textContent = "Copied. Paste it into any email."; }
    catch { msg.textContent = `Copy this address: ${to}`; }
  };
  menu.hidden = false;
  // Place the menu under the link, kept inside the screen.
  const r = link.getBoundingClientRect(), m = menu.getBoundingClientRect();
  const left = Math.min(Math.max(12, r.left), window.innerWidth - m.width - 12);
  const below = r.bottom + 8 + m.height < window.innerHeight;
  menu.style.left = `${left}px`;
  menu.style.top = `${below ? r.bottom + 8 : Math.max(12, r.top - m.height - 8)}px`;
  opener = link;
  menu.querySelector("a").focus();
}

function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  opener?.focus();
  opener = null;
}

document.addEventListener("click", e => {
  const link = e.target.closest('a[href^="mailto:"]');
  if (link && !link.hasAttribute("data-mail-keep")) {
    e.preventDefault();
    if (opener === link && !menu.hidden) return closeMenu();
    return openMenu(link);
  }
  if (!menu.contains(e.target)) closeMenu();
  else if (e.target.closest("a")) setTimeout(closeMenu, 0);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
window.addEventListener("scroll", closeMenu, {passive: true});
window.addEventListener("resize", closeMenu);
