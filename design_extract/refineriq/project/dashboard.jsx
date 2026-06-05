/* ============================================================
   RefineIQ — Dashboard (Admin view)
   ============================================================ */

function StatCard({ s, i }) {
  const up = s.dir === "up";
  return (
    <div className="glass fade-up" style={{
      borderRadius: "var(--r-lg)", padding: "18px 20px", animationDelay: `${i * 60}ms`,
      background: "linear-gradient(180deg, rgba(24,34,60,0.5), rgba(14,20,38,0.55))",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,109,245,0.18), transparent 70%)" }} />
      <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500, marginBottom: 12 }}>{s.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600,
          color: up ? "var(--pos)" : "var(--violet)" }}>
          <I.trend size={13} style={{ transform: up ? "none" : "scaleY(-1)" }} />{s.delta}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 4 }}>{s.sub}</div>
    </div>
  );
}

function CoverageChart() {
  return (
    <div className="glass" style={{ borderRadius: "var(--r-lg)", padding: 24, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Department document coverage</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Indexed & retrievable share by team</p>
        </div>
        <span className="badge badge-user"><I.layers size={12} /> 5 depts</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {COVERAGE.map((c, i) => (
          <div key={c.dept}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>{c.dept}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                <span style={{ color: "var(--text-1)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{c.pct}%</span>
                <span style={{ marginLeft: 8 }}>{c.docs.toLocaleString()} docs</span>
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${c.pct}%`, borderRadius: 6,
                background: "var(--ai-grad)",
                boxShadow: "0 0 12px -2px rgba(124,109,245,0.7)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="glass" style={{ borderRadius: "var(--r-lg)", padding: 22, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent activity</h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--pos)" }}>
          <span className="dot dot-pos" style={{ animation: "soft-pulse 1.8s ease-in-out infinite" }} /> Live
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {ACTIVITY.map((a, i) => {
          const ai = a.init === "AI";
          return (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0",
              borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
              <div style={{ flex: "none" }}><Avatar initials={a.init} size={30} ai={ai} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-2)" }}>
                  <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{a.who}</span> {a.act}{" "}
                  <span style={{ color: "var(--text-1)" }}>{a.obj}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--text-4)" }}>{deptName(a.dept)}</span>
                  <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--text-4)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-4)" }}>{a.time} ago</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentQueries() {
  return (
    <div className="glass" style={{ borderRadius: "var(--r-lg)", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent queries</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>Sentiment scored from answer confidence & user feedback</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, color: "var(--text-3)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span className="dot dot-pos" /> Resolved</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span className="dot dot-warn" /> Partial</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span className="dot dot-neg" /> Unresolved</span>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {RECENT_QUERIES.map((q, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0",
            borderTop: "1px solid var(--border-soft)" }}>
            <span className={`dot dot-${q.sentiment}`} style={{ width: 9, height: 9 }} />
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-1)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.q}</span>
            <span className="badge badge-user" style={{ flex: "none" }}>{deptShort(q.dept)}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-3)", width: 70, textAlign: "right", flex: "none" }}>{q.user}</span>
            <span style={{ fontSize: 11.5, color: "var(--text-4)", width: 40, textAlign: "right", flex: "none" }}>{q.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
      <header style={{ flex: "none", height: 64, display: "flex", alignItems: "center", gap: 14,
        padding: "0 30px", borderBottom: "1px solid var(--border)", background: "rgba(10,15,30,0.6)", backdropFilter: "blur(10px)" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.1 }}>Dashboard</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Organization overview · Admin</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="badge badge-admin"><I.sparkle size={12} /> Admin view</span>
        <IconBtn icon={I.search} title="Search" />
        <IconBtn icon={I.bell} title="Notifications" />
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px 40px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {STATS.map((s, i) => <StatCard key={s.id} s={s} i={i} />)}
          </div>
          {/* Coverage + activity */}
          <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, alignItems: "stretch" }}>
            <CoverageChart />
            <ActivityFeed />
          </div>
          {/* Recent queries */}
          <RecentQueries />
        </div>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
