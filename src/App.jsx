import { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════════════════
   HOOKS
   ════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis.length) setActive(vis[0].target.id);
      },
      { threshold: [0.2, 0.5] }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return active;
}

/* ════════════════════════════════════════
   PARTICLES
   ════════════════════════════════════════ */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let w, h, raf;
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * 3000, y: Math.random() * 3000,
      r: Math.random() * 1.4 + 0.4, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.4 + 0.15
    }));
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(0,194,255,${p.o})`; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = dx * dx + dy * dy;
          if (d < 18000) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,194,255,${0.09 * (1 - d / 18000)})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ════════════════════════════════════════
   COMPONENTS
   ════════════════════════════════════════ */
function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, vis] = useInView(0.12);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(36px)",
      transition: `opacity 0.7s ${delay}ms cubic-bezier(.23,1,.32,1), transform 0.7s ${delay}ms cubic-bezier(.23,1,.32,1)`,
      ...style
    }}>{children}</div>
  );
}

function Card({ children, style = {}, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <FadeIn delay={delay}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? "rgba(0,194,255,0.055)" : "rgba(255,255,255,0.025)",
          border: `1px solid ${hov ? "rgba(0,194,255,0.25)" : "rgba(0,194,255,0.1)"}`,
          borderRadius: 14, padding: "26px 22px",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: hov ? "0 0 40px rgba(0,194,255,0.1), inset 0 0 30px rgba(0,194,255,0.02)" : "0 2px 20px rgba(0,0,0,0.2)",
          transition: "all 0.35s ease",
          transform: hov ? "translateY(-2px)" : "translateY(0)",
          ...style
        }}>{children}</div>
    </FadeIn>
  );
}

function Bar({ pct, color = "#00c2ff", thick = 6 }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{ height: thick, borderRadius: thick / 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: thick / 2,
        width: vis ? `${pct}%` : "0%",
        background: `linear-gradient(90deg,${color},${color}77)`,
        boxShadow: `0 0 14px ${color}33`,
        transition: "width 1.3s cubic-bezier(.23,1,.32,1)"
      }} />
    </div>
  );
}

function SectionHeader({ tag, title, accent }) {
  return (
    <FadeIn>
      <p style={S.tag}>{tag}</p>
      <h2 style={S.h2}>{title} <span style={{ color: "#00c2ff" }}>{accent}</span></h2>
    </FadeIn>
  );
}

function Divider() {
  return <div style={{ height: 1, maxWidth: 520, margin: "0 auto", background: "linear-gradient(90deg,transparent,rgba(0,194,255,0.16),transparent)" }} />;
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ════════════════════════════════════════
   NAV
   ════════════════════════════════════════ */
function Nav({ active }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const links = [
    ["hero", "Home"], ["about", "About"], ["experience", "Experience"],
    ["projects", "Projects"], ["skills", "Skills"], ["dashboard", "Dashboard"],
    ["certs", "Certs"], ["education", "Education"], ["contact", "Contact"]
  ];
  const go = (id) => { setOpen(false); scrollTo(id); };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      background: "rgba(6,10,24,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderBottom: "1px solid rgba(0,194,255,0.07)"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 54, justifyContent: "space-between" }}>
        <span onClick={() => go("hero")} style={{ color: "#00c2ff", fontWeight: 800, fontSize: 16, letterSpacing: 3, fontFamily: "var(--mono)", cursor: "pointer" }}>A.S.</span>

        {isMobile && (
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "#00c2ff", fontSize: 22, cursor: "pointer", padding: 4 }}>
            {open ? "✕" : "☰"}
          </button>
        )}

        {(!isMobile || open) && (
          <div style={{
            display: "flex", gap: 2, alignItems: "center",
            ...(isMobile ? {
              flexDirection: "column", position: "absolute",
              top: 54, left: 0, right: 0, background: "rgba(6,10,24,0.97)",
              padding: "12px 0", borderBottom: "1px solid rgba(0,194,255,0.1)", gap: 0
            } : {})
          }}>
            {links.map(([id, label]) => (
              <button key={id} onClick={() => go(id)} style={{
                background: active === id ? "rgba(0,194,255,0.1)" : "transparent",
                border: "none", color: active === id ? "#00c2ff" : "#5a6a80",
                padding: isMobile ? "11px 20px" : "7px 12px", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontFamily: "var(--mono)", fontWeight: 500,
                transition: "all 0.25s", letterSpacing: 0.5, width: isMobile ? "100%" : "auto",
                textAlign: isMobile ? "left" : "center"
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════
   STYLES
   ════════════════════════════════════════ */
const S = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "110px 24px 80px" },
  h2: { fontSize: "clamp(30px,4.5vw,42px)", fontWeight: 800, color: "#fff", margin: "0 0 36px", lineHeight: 1.15, letterSpacing: -0.8 },
  tag: { fontSize: 11, letterSpacing: 4, color: "#00c2ff", fontFamily: "var(--mono)", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 22 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 },
  muted: { color: "#8494a7", fontSize: 14.5, lineHeight: 1.85 },
  white: { color: "#e8edf5" },
  cyan: { color: "#00c2ff" },
};

/* ════════════════════════════════════════
   DATA
   ════════════════════════════════════════ */
const EXP = [
  {
    co: "Plutos One", role: "Compliance Specialist", when: "May 2025 – Present", current: true,
    pts: [
      "Own end-to-end PCI DSS & ISO 27001:2022 compliance — scoping, gap analysis, control implementation, evidence lifecycle, and final QSA coordination",
      "Coordinate directly with bank auditors, acquiring banks, and external QSAs — manage audit timelines, deliverables, and remediation tracking",
      "Architect centralized compliance tracking workflows and evidence management systems across engineering, product, and operations",
      "Drive continuous monitoring of security controls, GCP infrastructure configurations, and regulatory alignment with RBI & PCI Council mandates",
      "Lead due diligence for banking partnerships, vendor risk assessments, and third-party security evaluations"
    ]
  },
  {
    co: "ControlCase", role: "Associate Consultant", when: "May 2023 – Apr 2025",
    pts: [
      "Executed PCI DSS, and ISO 27001:2022 certification assessments for enterprise clients in fintech, SaaS, and e-commerce",
      "Conducted infrastructure and cloud security assessments — identified gaps, validated controls, and accelerated certification timelines",
      "Managed client-facing audit communication, evidence review, and remediation advisory"
    ]
  },
  {
    co: "Isourse Technologies", role: "Network Engineer", when: "Sept 2022 – March 2023",
    pts: [
      "Designed and deployed enterprise LAN/WAN/VPN architectures with endpoint security, DLP, and IDS/IPS integration",
      "Managed Cisco, Sophos, and Seqrite platforms — DHCP snooping, VLAN segmentation, network monitoring and optimization"
    ]
  }
];

const PROJECTS = [
  { title: "Compliance Tracking & Audit Readiness Program", tag: "GRC", color: "#00c2ff",
    desc: "Built end-to-end evidence workflows, centralized compliance tracking, and audit response systems — reduced audit prep time by 40% with zero overdue findings across PCI DSS and ISO 27001 cycles." },
  { title: "Internal GRC Portal", tag: "PRODUCT", color: "#a78bfa",
    desc: "Designed a scalable GRC portal with framework-based questionnaires (PCI DSS, ISO 27001), evidence upload pipelines, dashboard analytics, automated reminders, and role-based access for org-wide compliance visibility." },
  { title: "Vulnerability & Scan Coordination", tag: "SECURITY", color: "#f472b6",
    desc: "Coordinated ASV scans, internal vulnerability assessments, and penetration testing aligned to PCI DSS requirements. Structured evidence packages and remediation tracking for QSA submissions." },
  { title: "PCI DSS Audit Execution", tag: "AUDIT", color: "#34d399",
    desc: "Led full-cycle PCI DSS audit — scoping, gap analysis, control validation, evidence collection, remediation coordination, and final QSA sign-off for Level 1 merchant certification." },
  { title: "Network Security & Migration", tag: "INFRA", color: "#fbbf24",
    desc: "Executed enterprise network migration with DHCP snooping enforcement, VLAN redesign, ADC load balancing, and endpoint hardening — improved uptime across 500+ nodes." },
];

const SKILLS = [
  { title: "GRC & Compliance", items: [["PCI DSS",95],["ISO 27001:2022",92],["DPDP",85],["DL-SAR",75]] },
  { title: "Security Operations", items: [["SIEM & Monitoring",88],["Incident Response",82],["Threat Analysis",80],["Vulnerability Mgmt",90]] },
  { title: "Tools & Platforms", items: [["Wazuh / Nessus / Burp Suite",88],["OWASP ZAP / Google SCC",82],["Cloud Armor / GCP / AWS",80],["Docker / GitHub / Seqrite",78]] },
  { title: "Networking & Scripting", items: [["VLAN / ADC / TCP-IP",85],["Python / Bash / SQL",75]] },
];

const CERTS = [
  { name: "Cisco Certified", sub: "Networking" },
  { name: "Fortinet NSE 1–3", sub: "Network Security" },
  { name: "CEH v12", sub: "Candidate" },
  { name: "ISC2 CC", sub: "Cybersecurity" },
  { name: "ISO 27001:2022", sub: "Lead Implementer Assoc." },
  { name: "Google Cybersecurity", sub: "Professional Certificate" },
  { name: "IBM Cybersecurity Analyst", sub: "Professional Certificate" },
  { name: "Forage – Mastercard", sub: "Cybersecurity Program" },
  { name: "IIT Delhi", sub: "Ethical Hacking" },
];

/* ════════════════════════════════════════
   APP
   ════════════════════════════════════════ */
export default function App() {
  const sectionIds = ["hero","about","experience","projects","skills","dashboard","certs","education","volunteering","contact"];
  const active = useActiveSection(sectionIds);

  return (
    <div style={{ background: "#060a18", color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        :root { --mono: 'JetBrains Mono', monospace; --body: 'Outfit', sans-serif; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; scroll-padding-top: 60px; }
        body { background: #060a18; overflow-x: hidden; }
        ::selection { background: rgba(0,194,255,0.3); color: #fff; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #060a18; }
        ::-webkit-scrollbar-thumb { background: rgba(0,194,255,0.25); border-radius: 3px; }
        @keyframes heroFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { box-shadow: 0 0 14px rgba(0,194,255,0.5); }
          50% { box-shadow: 0 0 24px rgba(0,194,255,0.9), 0 0 48px rgba(0,194,255,0.3); }
        }
        .hero-title {
          font-size: clamp(46px,8vw,88px); font-weight: 900;
          background: linear-gradient(135deg,#ffffff 0%,#00c2ff 50%,#ffffff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 6s ease infinite;
          line-height: 1.05; letter-spacing: -3px;
        }
        button:focus { outline: 2px solid rgba(0,194,255,0.4); outline-offset: 2px; }
        a:focus-visible { outline: 2px solid rgba(0,194,255,0.4); outline-offset: 2px; }
      `}</style>

      <Particles />
      <Nav active={active} />

      {/* ═══ HERO ═══ */}
      <section id="hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 35%,rgba(0,194,255,0.07) 0%,transparent 65%)" }} />
        <div style={{ position: "absolute", top: "15%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(0,100,255,0.03)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "8%", width: 250, height: 250, borderRadius: "50%", background: "rgba(0,194,255,0.03)", filter: "blur(70px)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720, padding: "0 24px" }}>
          <div style={{ animation: "fadeUp 0.8s ease both" }}>
            <div style={{ fontSize: 12, letterSpacing: 6, color: "#00c2ff", fontFamily: "var(--mono)", marginBottom: 24, fontWeight: 600 }}>
              GRC&ensp;•&ensp;CYBERSECURITY&ensp;•&ensp;COMPLIANCE
            </div>
          </div>
          <div style={{ animation: "fadeUp 0.8s 0.15s ease both" }}>
            <h1 className="hero-title">Apardeep Singh</h1>
          </div>
          <div style={{ animation: "fadeUp 0.8s 0.3s ease both" }}>
            <p style={{ fontSize: "clamp(16px,2.4vw,21px)", color: "#8fa3bf", marginTop: 18, fontWeight: 400, lineHeight: 1.5 }}>
              Compliance Specialist & Cybersecurity Expert
            </p>
            <p style={{ color: "#546580", fontSize: 14, fontStyle: "italic", marginTop: 10 }}>
              Building trust through compliance, security, and control
            </p>
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 40, flexWrap: "wrap", animation: "fadeUp 0.8s 0.45s ease both" }}>
            <button onClick={() => scrollTo("contact")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 34px", borderRadius: 8, fontSize: 14,
              fontWeight: 600, fontFamily: "var(--body)", cursor: "pointer",
              transition: "all 0.3s ease", border: "none",
              background: "linear-gradient(135deg,#00c2ff,#0060e0)",
              color: "#fff", boxShadow: "0 4px 24px rgba(0,194,255,0.3)"
            }}>Contact Me →</button>
            <button onClick={() => scrollTo("projects")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 34px", borderRadius: 8, fontSize: 14,
              fontWeight: 600, fontFamily: "var(--body)", cursor: "pointer",
              transition: "all 0.3s ease",
              background: "transparent", color: "#00c2ff",
              border: "1.5px solid rgba(0,194,255,0.35)"
            }}>View Work</button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", animation: "heroFloat 2.5s ease-in-out infinite" }}>
          <div style={{ width: 22, height: 34, borderRadius: 11, border: "2px solid rgba(0,194,255,0.3)", display: "flex", justifyContent: "center", paddingTop: 6 }}>
            <div style={{ width: 3, height: 8, borderRadius: 2, background: "#00c2ff", opacity: 0.7 }} />
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ ABOUT ═══ */}
      <section id="about" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="About" title="The GRC–Security" accent="Bridge" />
          <div style={S.grid2}>
            <FadeIn delay={100}>
              <p style={S.muted}>
                I operate at the intersection of <strong style={S.white}>Governance, Risk & Compliance</strong> and <strong style={S.white}>hands-on cybersecurity</strong> — bridging audit frameworks with real technical controls inside a regulated fintech environment.
              </p>
              <p style={{ ...S.muted, marginTop: 16 }}>
                At Plutos ONE, I own end-to-end <strong style={S.cyan}>PCI DSS</strong> and <strong style={S.cyan}>ISO 27001:2022</strong> compliance — from scoping and gap analysis through evidence lifecycle management and final QSA coordination. I interface directly with bank auditors, acquiring banks, and regulators to ensure audit readiness is a continuous discipline.
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <p style={S.muted}>
                My technical depth spans <strong style={S.white}>GCP & AWS cloud security</strong>, SIEM operations with Wazuh, vulnerability management with Nessus, and network architecture from my engineering background.
              </p>
              <p style={{ ...S.muted, marginTop: 16 }}>
                I don't just check boxes — I build <strong style={S.cyan}>compliance systems</strong>: centralized evidence platforms, GRC portals, automated workflows, and dashboards that give leadership real-time visibility into organizational risk posture.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                {["PCI DSS","ISO 27001","DL-SAR","DPDP","GCP","AWS","Wazuh"].map(t => (
                  <span key={t} style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#00c2ff", background: "rgba(0,194,255,0.08)", border: "1px solid rgba(0,194,255,0.15)", padding: "4px 12px", borderRadius: 5, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ EXPERIENCE ═══ */}
      <section id="experience" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Experience" title="Professional" accent="Timeline" />
          <div style={{ position: "relative", paddingLeft: 28, marginTop: 8 }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(180deg,#00c2ff 0%,rgba(0,194,255,0.15) 100%)", borderRadius: 1 }} />
            {EXP.map((e, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 28 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", background: "#00c2ff",
                  boxShadow: "0 0 14px rgba(0,194,255,0.5)",
                  position: "absolute", left: -7, top: 32, zIndex: 2,
                  animation: e.current ? "dotPulse 2s infinite" : "none"
                }} />
                <Card delay={i * 150} style={{ marginLeft: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{e.co}</h3>
                      <span style={{ color: "#00c2ff", fontSize: 13.5, fontWeight: 600 }}>{e.role}</span>
                    </div>
                    <span style={{ color: "#546580", fontSize: 12, fontFamily: "var(--mono)", alignSelf: "flex-start", marginTop: 4 }}>{e.when}</span>
                  </div>
                  {e.pts.map((p, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, marginBottom: 6, color: "#8494a7", fontSize: 14, lineHeight: 1.8 }}>
                      <span style={{ color: "#00c2ff", marginTop: 2, flexShrink: 0, fontSize: 8 }}>▸</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ PROJECTS ═══ */}
      <section id="projects" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Projects" title="Key" accent="Initiatives" />
          <div style={S.grid2}>
            {PROJECTS.map((p, i) => (
              <Card key={i} delay={i * 110}>
                <span style={{
                  display: "inline-block", fontSize: 10.5, fontFamily: "var(--mono)", fontWeight: 700,
                  color: p.color, background: `${p.color}14`, border: `1px solid ${p.color}30`,
                  padding: "3px 10px", borderRadius: 4, marginBottom: 14, letterSpacing: 1
                }}>{p.tag}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.35 }}>{p.title}</h3>
                <p style={{ color: "#8494a7", fontSize: 13.5, lineHeight: 1.75 }}>{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ SKILLS ═══ */}
      <section id="skills" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Skills" title="Competency" accent="Matrix" />
          <div style={S.grid2}>
            {SKILLS.map((g, i) => (
              <Card key={i} delay={i * 100}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#00c2ff", marginBottom: 18, fontFamily: "var(--mono)", letterSpacing: 0.5 }}>{g.title}</h3>
                {g.items.map(([label, pct], j) => (
                  <div key={j} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#8494a7", fontFamily: "var(--mono)", marginBottom: 5 }}>
                      <span>{label}</span><span>{pct}%</span>
                    </div>
                    <Bar pct={pct} />
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ GRC DASHBOARD ═══ */}
      <section id="dashboard" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Live Metrics" title="GRC" accent="Dashboard" />
          <div style={S.grid2}>
            <Card delay={0}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 22 }}>Compliance Posture</h3>
              {[
                { label: "PCI DSS Compliance", pct: 96, color: "#00c2ff" },
                { label: "ISO 27001 Readiness", pct: 92, color: "#34d399" },
                { label: "DPDP Control Coverage", pct: 88, color: "#a78bfa" },
                { label: "Audit Findings Resolved", pct: 98, color: "#fbbf24" }
              ].map((m, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontFamily: "var(--mono)", color: "#8494a7", marginBottom: 6 }}>
                    <span>{m.label}</span><span style={{ color: m.color, fontWeight: 700 }}>{m.pct}%</span>
                  </div>
                  <Bar pct={m.pct} color={m.color} thick={10} />
                </div>
              ))}
            </Card>
            <Card delay={150}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 22 }}>Risk Assessment</h3>
              {[
                { label: "Third-Party Vendor Risk", score: "LOW", color: "#34d399" },
                { label: "Cloud Misconfiguration", score: "MED", color: "#fbbf24" },
                { label: "Data Exfiltration", score: "LOW", color: "#34d399" },
                { label: "Insider Threat", score: "LOW", color: "#34d399" }
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ color: "#8fa3bf", fontSize: 13.5 }}>{r.label}</span>
                  <span style={{
                    fontSize: 10.5, fontFamily: "var(--mono)", fontWeight: 700, color: r.color,
                    padding: "4px 12px", borderRadius: 4, background: `${r.color}14`, border: `1px solid ${r.color}25`, letterSpacing: 1
                  }}>{r.score}</span>
                </div>
              ))}
              <div style={{
                marginTop: 24, padding: 20, borderRadius: 12, textAlign: "center",
                background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)"
              }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: "#34d399", letterSpacing: -1 }}>A+</div>
                <div style={{ fontSize: 10.5, color: "#546580", fontFamily: "var(--mono)", marginTop: 4, letterSpacing: 2 }}>OVERALL RISK GRADE</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ CERTIFICATIONS ═══ */}
      <section id="certs" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Certifications" title="Credentials &" accent="Qualifications" />
          <div style={S.grid3}>
            {CERTS.map((c, i) => (
              <Card key={i} delay={i * 70} style={{ textAlign: "center", padding: "24px 18px" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,194,255,0.08)", border: "1px solid rgba(0,194,255,0.15)",
                  fontSize: 20, margin: "0 auto 14px"
                }}>🛡</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e8edf5", marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: "#546580", fontFamily: "var(--mono)" }}>{c.sub}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ EDUCATION ═══ */}
      <section id="education" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Education" title="Academic" accent="Background" />
          <Card style={{ maxWidth: 660 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>MCA — Cybersecurity Specialization</h3>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 6, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ color: "#00c2ff", fontWeight: 700, fontSize: 14 }}>CGPA: 8.81</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#334155" }} />
              <span style={{ color: "#546580", fontSize: 13, fontFamily: "var(--mono)" }}>Capstone: Cyber Threat Intelligence</span>
            </div>
            <p style={S.muted}>Researched APT detection methodologies, threat modeling frameworks, and intelligence-driven defense strategies as part of the capstone project.</p>
          </Card>
        </div>
      </section>

      <Divider />

      {/* ═══ VOLUNTEERING ═══ */}
      <section id="volunteering" style={{ position: "relative", zIndex: 1 }}>
        <div style={S.wrap}>
          <SectionHeader tag="Volunteering" title="Community" accent="Impact" />
          <div style={S.grid2}>
            <Card delay={0}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Muskurahat Foundation</h3>
              <p style={S.muted}>Volunteered for children's welfare and educational initiatives, supporting underprivileged communities through mentorship and resource drives.</p>
            </Card>
            <Card delay={140}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Mata Jai Kaur School</h3>
              <p style={S.muted}>Contributed to educational programs and community outreach for students in underserved areas.</p>
            </Card>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ CONTACT ═══ */}
      <section id="contact" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ ...S.wrap, textAlign: "center" }}>
          <SectionHeader tag="Get In Touch" title="Let's" accent="Connect" />
          <FadeIn>
            <p style={{ ...S.muted, maxWidth: 480, margin: "0 auto 36px", textAlign: "center" }}>
              Open to opportunities in GRC leadership, compliance strategy, and cybersecurity consulting.
            </p>
          </FadeIn>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            {[
              { icon: "✉", label: "apardeepsingh@gmail.com", href: "mailto:apardeepsingh@gmail.com" },
              { icon: "☎", label: "+91-8799753263", href: "tel:+918799753263" },
              { icon: "⬡", label: "LinkedIn Profile", href: "https://linkedin.com/in/apardeep-singh" },
              { icon: "◉", label: "Delhi, India", href: null }
            ].map((c, i) => (
              <Card key={i} delay={i * 100} style={{ padding: "15px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, color: "#00c2ff" }}>{c.icon}</span>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: "#00c2ff", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{c.label}</a>
                ) : <span style={{ color: "#e2e8f0", fontSize: 14 }}>{c.label}</span>}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        textAlign: "center", padding: "48px 24px 32px",
        color: "#2a3548", fontSize: 11.5, fontFamily: "var(--mono)",
        position: "relative", zIndex: 1, letterSpacing: 1
      }}>
        © 2026 APARDEEP SINGH — BUILT WITH PRECISION
      </footer>
    </div>
  );
}