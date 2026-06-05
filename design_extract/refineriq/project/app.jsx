/* ============================================================
   RefineIQ — Root app: routing, shell, tweaks
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aiCardStyle": "glass",
  "accent": ["#6366F1", "#8B5CF6"],
  "motion": "premium",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = React.useState(false);
  const [view, setView] = React.useState("chat");
  const [collapsed, setCollapsed] = React.useState(false);
  const [dept, setDept] = React.useState("safety");
  const [activeConv, setActiveConv] = React.useState("c1");
  const [adminTab, setAdminTab] = React.useState("users");

  // Apply accent tweak to CSS vars
  React.useEffect(() => {
    const [a, b] = t.accent || ["#6366F1", "#8B5CF6"];
    const r = document.documentElement.style;
    r.setProperty("--indigo", a);
    r.setProperty("--violet", b);
    r.setProperty("--ai-grad", `linear-gradient(120deg, ${a} 0%, ${b} 100%)`);
    r.setProperty("--indigo-soft", hexA(a, 0.14));
    r.setProperty("--violet-soft", hexA(b, 0.14));
    r.setProperty("--border-ai", hexA(b, 0.35));
  }, [t.accent]);

  // Motion: disable looping shimmer when "subtle"
  React.useEffect(() => {
    document.body.classList.toggle("motion-subtle", t.motion === "subtle");
  }, [t.motion]);

  if (!authed) {
    return (
      <>
        <Login onLogin={() => setAuthed(true)} />
        <TweaksPanelMount t={t} setTweak={setTweak} />
      </>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", background: "var(--bg-base)" }}>
      <Sidebar
        view={view} setView={setView}
        collapsed={collapsed} setCollapsed={setCollapsed}
        dept={dept} setDept={setDept}
        activeConv={activeConv} setActiveConv={setActiveConv}
        adminTab={adminTab} setAdminTab={setAdminTab}
        onLogout={() => setAuthed(false)}
      />
      <main style={{ flex: 1, minWidth: 0, height: "100%", background: "var(--bg-navy)", position: "relative" }}>
        {view === "chat" && <ChatScreen key={"chat-" + dept + "-" + activeConv} dept={dept} cardVariant={t.aiCardStyle} />}
        {view === "dashboard" && <DashboardScreen />}
        {view === "admin" && <AdminScreen tab={adminTab} />}
      </main>
      <TweaksPanelMount t={t} setTweak={setTweak} />
    </div>
  );
}

function TweaksPanelMount({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="AI response card" />
      <TweakRadio label="Card style" value={t.aiCardStyle}
        options={["glass", "bordered", "minimal"]}
        onChange={v => setTweak("aiCardStyle", v)} />
      <p style={{ margin: "2px 4px 0", fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
        Switch to the Assistant and send a question to preview the streaming card.
      </p>
      <TweakSection label="AI motion" />
      <TweakRadio label="Intensity" value={t.motion}
        options={["subtle", "premium"]}
        onChange={v => setTweak("motion", v)} />
      <TweakSection label="Accent" />
      <TweakColor label="Gradient" value={t.accent}
        options={[
          ["#6366F1", "#8B5CF6"],
          ["#7C5CFC", "#C026D3"],
          ["#4F7CFF", "#22D3EE"],
          ["#8B5CF6", "#EC4899"],
        ]}
        onChange={v => setTweak("accent", v)} />
    </TweaksPanel>
  );
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
