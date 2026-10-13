/* Preview checkout. Reads the cart the shop saved in this browser and shows a
   full checkout form, but nothing entered in the form leaves the visitor's
   browser: there is no payment and no server. The only way to reach us from
   here is the "Email us" links, which the customer sends themselves. When
   real checkout is ready, replace placeOrder() with a call to the checkout
   server (see worker/). */
import { TYPES, LIGHTS, priceOf, money, clampSpec, describe } from "./pricing.js?v=9";
import { render, esc } from "./drawing.js?v=9";

const $ = s => document.querySelector(s);
const MAX_QTY = 10;
const SUPPORT_EMAIL = "creationsgrainline@gmail.com";
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const RATINGS = [["1", "Frustrating"], ["2", "Confusing"], ["3", "Okay"], ["4", "Easy"], ["5", "Loved it"]];

let cart = [];
try {
  cart = (JSON.parse(localStorage.getItem("gl-cart")) || [])
    .map(l => ({spec: clampSpec(l.spec), qty: Math.min(MAX_QTY, Math.max(1, l.qty | 0))}));
} catch { cart = []; }

const subtotal = cart.reduce((sum, l) => sum + priceOf(l.spec).total * l.qty, 0);

if (!cart.length) {
  $("#empty").hidden = false;
} else {
  $("#checkout").hidden = false;
  $("#items").innerHTML = cart.map(l => `
    <div class="item">
      <div class="thumb${LIGHTS[l.spec.light] ? " lit" : ""}">${render(l.spec)}${l.qty > 1 ? `<span class="q">×${l.qty}</span>` : ""}</div>
      <div><b>${esc(TYPES[l.spec.type].label)}</b><small>${esc(describe(l.spec))}</small></div>
      <div class="p">${money(priceOf(l.spec).total * l.qty)}</div>
    </div>`).join("");
  $("#sub").textContent = money(subtotal);
  // Shipping isn't priced yet, so the total doesn't include it.
  $("#ship").textContent = "Set when orders open";
  $("#total").textContent = money(subtotal);
  $("#state").insertAdjacentHTML("beforeend", STATES.map(s => `<option>${s}</option>`).join(""));
  $("#scale").innerHTML = RATINGS.map(([v, label]) =>
    `<input type="radio" name="rating" id="r${v}" value="${v}"><label for="r${v}"><span>${v}</span><small>${label}</small></label>`).join("");
}

// "Email us" links on this page carry the cart, so we know which order the question is about.
const orderText = cart.map(l => `- ${l.qty} × ${TYPES[l.spec.type].label}: ${describe(l.spec)} (${money(priceOf(l.spec).total)} each)`).join("\n");
document.querySelectorAll(".order-mail").forEach(a => {
  a.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Question about my order")}&body=${encodeURIComponent(`Hi Grainline,\n\nMy question:\n\n\nMy cart:\n${orderText}\nSubtotal: ${money(subtotal)}\n`)}`;
});

$("#form").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  placeOrder();
});

// Preview only: shows the visitor what they entered and sends nothing.
function placeOrder() {
  const val = id => $("#" + id).value.trim();
  const rating = document.querySelector('input[name="rating"]:checked');
  const rows = [
    ["Order", cart.map(l => `${l.qty} × ${TYPES[l.spec.type].label} (${l.spec.wood})`).join(", ") + ` · ${money(subtotal)}`],
    ["Ship to", `${val("first")} ${val("last")}, ${val("street")}${val("apt") ? " " + val("apt") : ""}, ${val("city")}, ${val("state")} ${val("zip")}`],
    ["Email", val("email") + ($("#updates").checked ? " (wants launch updates)" : "")]
  ];
  if (rating) rows.push(["Your rating", `${rating.value} out of 5`]);
  $("#doneTitle").textContent = `Thanks, ${val("first")}! That's how checkout will work.`;
  $("#recap").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  $("#checkout").hidden = true;
  $("#done").hidden = false;
  window.scrollTo(0, 0);
}
