import Lenis from "lenis";
import {
  createIcons,
  AppWindow,
  Smartphone,
  Monitor,
  Cpu,
  Workflow,
  Braces,
} from "lucide";
import "./style.css";

function initSiteLoader() {
  let hasSeenLoader = false;
  try {
    hasSeenLoader = sessionStorage.getItem("bobok-loader-seen") === "true";
  } catch {
    hasSeenLoader = false;
  }
  if (hasSeenLoader) return;

  const loader = document.createElement("div");
  loader.className = "site-loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML = `
    <div class="loader-panel loader-panel-top"></div>
    <div class="loader-panel loader-panel-bottom"></div>
    <span class="loader-coordinate loader-coordinate-left">BKK / TH</span>
    <span class="loader-coordinate loader-coordinate-right">INDEPENDENT SOFTWARE STUDIO</span>
    <div class="loader-core">
      <div class="loader-wordmark" aria-label="bobok">
        <span style="--i:0">b</span><span style="--i:1">o</span><span style="--i:2">b</span><span style="--i:3">o</span><span style="--i:4">k</span><sup>®</sup>
      </div>
      <div class="loader-progress"><i></i></div>
      <div class="loader-meta"><span class="loader-status">INITIALIZING</span><b class="loader-count">000</b></div>
    </div>`;
  document.body.prepend(loader);
  document.body.classList.add("loader-active");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const loadingDuration = reducedMotion ? 80 : 1450;
  const readyAt = reducedMotion ? 90 : 1500;
  const finishAt = reducedMotion ? 160 : 1800;
  const removeAt = reducedMotion ? 360 : 2450;
  const counter = loader.querySelector(".loader-count");
  const status = loader.querySelector(".loader-status");
  const startedAt = performance.now();

  requestAnimationFrame(() => loader.classList.add("is-running"));
  const updateCounter = (now) => {
    const progress = Math.min((now - startedAt) / loadingDuration, 1);
    counter.textContent = String(Math.round(progress * 100)).padStart(3, "0");
    if (progress < 1) requestAnimationFrame(updateCounter);
  };
  requestAnimationFrame(updateCounter);
  window.setTimeout(() => {
    loader.classList.add("is-ready");
    status.textContent = "SYSTEM READY";
  }, readyAt);
  window.setTimeout(() => loader.classList.add("is-complete"), finishAt);
  window.setTimeout(() => {
    loader.remove();
    document.body.classList.remove("loader-active");
    try {
      sessionStorage.setItem("bobok-loader-seen", "true");
    } catch {
      // The animation still works when browser storage is unavailable.
    }
  }, removeAt);
}

initSiteLoader();

const services = [
  [
    "AppWindow",
    "Web Application",
    "เว็บที่ทำงานได้มากกว่าแค่แสดงผล",
    "ระบบจัดการธุรกิจ แพลตฟอร์มออนไลน์ และเว็บแอปที่ตอบโจทย์ทุกหน้าจอ",
    "DASHBOARD / E-COMMERCE / SAAS",
  ],
  [
    "Smartphone",
    "Mobile Application",
    "อยู่ใกล้ผู้ใช้ ในทุกการเคลื่อนไหว",
    "แอป iOS และ Android ที่ใช้งานง่าย เชื่อมต่อบริการของคุณกับลูกค้า",
    "iOS / ANDROID / CROSS-PLATFORM",
  ],
  [
    "Monitor",
    "Desktop Application",
    "ประสิทธิภาพเต็มกำลัง บนเดสก์ท็อป",
    "โปรแกรมเฉพาะทางสำหรับทีม เชื่อมต่ออุปกรณ์และรองรับงานที่ซับซ้อน",
    "WINDOWS / macOS / LINUX",
  ],
  [
    "Cpu",
    "IoT & Embedded",
    "เชื่อมโลกจริง เข้ากับโลกดิจิทัล",
    "เซนเซอร์ อุปกรณ์อัจฉริยะ และระบบติดตามข้อมูลที่มองเห็นได้จากทุกที่",
    "SENSORS / MONITORING / CONTROL",
  ],
  [
    "Workflow",
    "Automation & AI",
    "งานน้อยลง ความเป็นไปได้มากขึ้น",
    "ลดงานซ้ำด้วย workflow อัตโนมัติ และประยุกต์ AI ให้เหมาะกับงานจริง",
    "WORKFLOW / AI INTEGRATION / RPA",
  ],
  [
    "Braces",
    "Custom Software",
    "สร้างเฉพาะ เพื่อธุรกิจของคุณ",
    "ระบบหลังบ้าน ERP, CRM และ API ที่เชื่อมเครื่องมือทั้งหมดเข้าด้วยกัน",
    "ERP / CRM / API INTEGRATION",
  ],
];
const serviceGrid = document.querySelector("#service-grid");
if (serviceGrid) {
  serviceGrid.innerHTML = services
    .map(
      (s, i) =>
        `<a href="/contact/?service=${encodeURIComponent(s[1])}" class="service-card reveal" data-delay="${(i % 3) * 100}"><div class="service-card-top"><i data-lucide="${s[0]}"></i><span>0${i + 1} <b>↗</b></span></div><h3>${s[1]}</h3><h4>${s[2]}</h4><p>${s[3]}</p><span class="service-tech">${s[4]}</span></a>`,
    )
    .join("");
}
createIcons({
  icons: { AppWindow, Smartphone, Monitor, Cpu, Workflow, Braces },
});
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
let lenis;
if (!reduced.matches) {
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    anchors: true,
    autoRaf: true,
  });
}
const header = document.querySelector("header");
if (header) {
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  if (lenis) lenis.on("scroll", onScroll);
  onScroll();
}
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.08 },
);
document.querySelectorAll(".reveal").forEach((e, i) => {
  e.style.setProperty("--delay", `${e.dataset.delay || 0}ms`);
  e.style.setProperty("--duration", `${650 + (i % 4) * 140}ms`);
  observer.observe(e);
});
const menu = document.querySelector(".menu-toggle");
if (menu) {
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    document.querySelector("nav").classList.toggle("open", open);
  });
}
document.querySelectorAll("nav a").forEach((a) =>
  a.addEventListener("click", () => {
    menu?.setAttribute("aria-expanded", "false");
    document.querySelector("nav").classList.remove("open");
  }),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu) {
    menu.setAttribute("aria-expanded", "false");
    document.querySelector("nav").classList.remove("open");
  }
});
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
fetch("/api/index.php?route=content")
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => {
    if (data?.content)
      document.querySelectorAll("[data-content]").forEach((e) => {
        if (data.content[e.dataset.content])
          e.textContent = data.content[e.dataset.content];
      });
  })
  .catch(() => {});
const contactForm = document.querySelector("#contact-form");
if (contactForm)
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      button = form.querySelector("button"),
      status = document.querySelector("#form-status");
    button.disabled = true;
    status.textContent = "กำลังส่งข้อมูล...";
    try {
      const response = await fetch("/api/index.php?route=inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ส่งข้อมูลไม่สำเร็จ");
      form.reset();
      status.textContent =
        "ส่งรายละเอียดเรียบร้อยแล้ว ขอบคุณที่ไว้วางใจ เราจะติดต่อกลับทางข้อมูลที่คุณให้ไว้";
    } catch (error) {
      status.textContent =
        error instanceof SyntaxError
          ? "ยังไม่สามารถเชื่อมต่อระบบรับข้อมูลได้ กรุณาลองใหม่ภายหลัง"
          : error.message;
    } finally {
      button.disabled = false;
    }
  });

const requestedService = new URLSearchParams(location.search).get("service");
const serviceSelect = document.querySelector('select[name="service"]');
if (requestedService && serviceSelect) serviceSelect.value = requestedService;

function enhanceSelect(select) {
  const wrap = document.createElement("div");
  wrap.className = "c-select";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "c-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const list = document.createElement("ul");
  list.className = "c-select-list";
  list.setAttribute("role", "listbox");
  list.setAttribute("data-lenis-prevent", "");
  list.tabIndex = -1;
  list.id = `c-select-${select.name}`;
  trigger.setAttribute("aria-controls", list.id);

  const options = [...select.options].filter((o) => o.value !== "");
  const items = options.map((o) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.textContent = o.textContent;
    li.dataset.value = o.value;
    li.addEventListener("click", () => choose(o.value));
    list.append(li);
    return li;
  });
  let active = -1;

  function sync() {
    const opt = select.selectedOptions[0];
    trigger.textContent = opt ? opt.textContent : "";
    trigger.classList.toggle("placeholder", !select.value);
    items.forEach((li) =>
      li.setAttribute("aria-selected", li.dataset.value === select.value),
    );
  }
  function setActive(i) {
    active = (i + items.length) % items.length;
    items.forEach((li, j) => li.classList.toggle("active", j === active));
    items[active].scrollIntoView({ block: "nearest" });
  }
  function open() {
    wrap.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    const i = items.findIndex((li) => li.dataset.value === select.value);
    setActive(i < 0 ? 0 : i);
  }
  function close() {
    wrap.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }
  function choose(value) {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    wrap.classList.remove("invalid");
    sync();
    close();
    trigger.focus();
  }

  trigger.addEventListener("click", () =>
    wrap.classList.contains("open") ? close() : open(),
  );
  trigger.addEventListener("keydown", (e) => {
    const isOpen = wrap.classList.contains("open");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) return open();
      setActive(active + (e.key === "ArrowDown" ? 1 : -1));
    } else if ((e.key === "Enter" || e.key === " ") && isOpen) {
      e.preventDefault();
      choose(items[active].dataset.value);
    } else if (e.key === "Escape" && isOpen) {
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close();
    }
  });
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });
  select.addEventListener("invalid", () => wrap.classList.add("invalid"));
  select.form?.addEventListener("reset", () => setTimeout(sync));

  select.classList.add("c-select-native");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.after(wrap);
  wrap.append(select, trigger, list);
  sync();
}
document.querySelectorAll("select").forEach(enhanceSelect);

const toTop = document.createElement("button");
toTop.type = "button";
toTop.className = "to-top";
toTop.setAttribute("aria-label", "กลับด้านบน");
toTop.textContent = "↑";
toTop.addEventListener("click", () => {
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: reduced.matches ? "auto" : "smooth" });
});
document.body.append(toTop);
const onTopScroll = () =>
  toTop.classList.toggle("show", window.scrollY > window.innerHeight * 0.6);
window.addEventListener("scroll", onTopScroll, { passive: true });
if (lenis) lenis.on("scroll", onTopScroll);
onTopScroll();
