"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/context/language";
import LanguageToggle from "@/app/components/LanguageToggle";
import MobileNav from "@/app/components/MobileNav";
import i18n from "@/app/i18n";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const FOOTBALL_LEAGUES = {
  "ทีมชาติ": [
    "Thailand","Japan","South Korea","Australia","Saudi Arabia","Iran","Iraq","Vietnam",
    "Indonesia","Malaysia","Philippines","Singapore","China","India","UAE",
    "Brazil","Argentina","France","England","Germany","Spain","Portugal","Italy",
    "Netherlands","Belgium","Croatia","Poland","Switzerland","Denmark","Sweden",
    "Norway","Scotland","USA","Mexico","Colombia","Uruguay","Chile","Peru",
    "Ecuador","Canada","Morocco","Senegal","Nigeria","Ghana","Ivory Coast",
    "Egypt","Cameroon","Algeria",
  ],
  "Premier League": [
    "Arsenal","Aston Villa","Bournemouth","Brentford","Brighton & Hove Albion","Chelsea",
    "Crystal Palace","Everton","Fulham","Ipswich Town","Leicester City","Liverpool",
    "Manchester City","Manchester United","Newcastle United","Nottingham Forest",
    "Southampton","Tottenham Hotspur","West Ham United","Wolverhampton Wanderers",
  ],
  "La Liga": [
    "Real Madrid","Barcelona","Atletico Madrid","Athletic Bilbao","Real Sociedad",
    "Real Betis","Villarreal","Valencia","Sevilla","Osasuna","Celta Vigo","Girona",
    "Getafe","Rayo Vallecano","Mallorca","Las Palmas","Leganes","Deportivo Alaves",
    "Valladolid","Espanyol",
  ],
  "Serie A": [
    "Inter Milan","AC Milan","Juventus","Napoli","Atalanta","AS Roma","Lazio",
    "Fiorentina","Bologna","Torino","Genoa","Monza","Como","Udinese","Lecce",
    "Cagliari","Parma","Venezia","Hellas Verona","Empoli",
  ],
  "Ligue 1": [
    "Paris Saint-Germain","Monaco","Olympique de Marseille","Olympique Lyonnais",
    "Lille","Lens","OGC Nice","Rennes","Reims","Strasbourg","Brest","Nantes",
    "Montpellier","Toulouse","Le Havre","Angers","Saint-Etienne",
  ],
};

const NHL_TEAMS = [
  "Anaheim Ducks","Boston Bruins","Buffalo Sabres","Calgary Flames","Carolina Hurricanes",
  "Chicago Blackhawks","Colorado Avalanche","Columbus Blue Jackets","Dallas Stars","Detroit Red Wings",
  "Edmonton Oilers","Florida Panthers","Los Angeles Kings","Minnesota Wild","Montreal Canadiens",
  "Nashville Predators","New Jersey Devils","New York Islanders","New York Rangers","Ottawa Senators",
  "Philadelphia Flyers","Pittsburgh Penguins","San Jose Sharks","Seattle Kraken","St. Louis Blues",
  "Tampa Bay Lightning","Toronto Maple Leafs","Utah Hockey Club","Vancouver Canucks","Vegas Golden Knights",
  "Washington Capitals","Winnipeg Jets",
];

const NFL_TEAMS = [
  "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills","Carolina Panthers",
  "Chicago Bears","Cincinnati Bengals","Cleveland Browns","Dallas Cowboys","Denver Broncos",
  "Detroit Lions","Green Bay Packers","Houston Texans","Indianapolis Colts","Jacksonville Jaguars",
  "Kansas City Chiefs","Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins",
  "Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants","New York Jets",
  "Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers","Seattle Seahawks","Tampa Bay Buccaneers",
  "Tennessee Titans","Washington Commanders",
];

const SPORTSWEAR_BRANDS = [
  "Nike","Adidas","Puma","Under Armour","New Balance","Jordan","Reebok","Asics",
  "Mizuno","Umbro","Hummel","Kappa","Fila","Lotto","Le Coq Sportif","Errea",
  "Macron","Joma","Castore","Champion","2XU","Babolat","Skins",
];

const NBA_TEAMS = [
  "Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls",
  "Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors",
  "Houston Rockets","Indiana Pacers","LA Clippers","Los Angeles Lakers","Memphis Grizzlies",
  "Miami Heat","Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks",
  "Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers",
  "Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards",
];
const MAX_IMAGES = 25;

export default function SellPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef();

  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const CATEGORIES  = i18n[lang]?.categories  ?? i18n.th.categories;
  const GRADE_TYPES = i18n[lang]?.gradeTypes  ?? i18n.th.gradeTypes;
  const CONDITIONS  = i18n[lang]?.conditions  ?? i18n.th.conditions;
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    name: "", category: "", league: "", team: "", year: "", size: "", chest: "", gradeType: "", grade: "", price: "", description: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "seller" && profile?.role !== "admin") { router.push("/seller/verify"); return; }
      setUser(user);
      setLoading(false);
    }
    load();
  }, []);

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }
  function setCategory(val) { setForm(prev => ({ ...prev, category: val, league: "", team: "" })); }
  function setLeague(val)   { setForm(prev => ({ ...prev, league: val, team: "" })); }

  function handleFiles(e) {
    const selected = Array.from(e.target.files);
    const remaining = MAX_IMAGES - files.length;
    const toAdd = selected.slice(0, remaining);
    setFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeImage(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category)  { setError(t("errCategory")); return; }
    if (form.category === "football" && !form.league) { setError(t("errLeague")); return; }
    if (["football","basketball","nhl","nfl","sportswear"].includes(form.category) && !form.team) { setError(t("errTeam")); return; }
    if (!form.size)      { setError(t("errSize")); return; }
    if (!form.gradeType) { setError(t("errGradeType")); return; }
    if (!form.grade)     { setError(t("errGrade")); return; }
    if (files.length === 0) { setError(t("errPhoto")); return; }

    setSaving(true);
    setError("");

    const urls = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("products").upload(path, file, { upsert: true });
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
      urls.push(publicUrl);
    }

    const { error: saveErr } = await supabase.from("products").insert({
      seller_id:   user.id,
      name:        form.name,
      category:    form.category,
      team:        form.team,
      year:        form.year || null,
      size:        form.size,
      chest:       form.chest ? Number(form.chest) : null,
      grade_type:  form.gradeType,
      grade:       form.grade,
      price:       Number(form.price),
      description: form.description,
      image_url:   urls[0],
      image_urls:  urls,
    });

    setSaving(false);
    if (saveErr) { setError(saveErr.message); return; }
    router.push("/seller/dashboard");
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
        <div className="rm-nav-links" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <button onClick={async () => { await fetch("/api/signout", { method: "POST" }); window.location.href = "/"; }} style={S.logoutBtn}>{t("navLogout")}</button>
          <LanguageToggle />
        </div>
        <span className="rm-mobile-only" style={{ marginLeft: "auto" }}><LanguageToggle /></span>
        <button
          className="rm-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          aria-label="Menu"
        >
          {menuOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={null} />
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/seller/dashboard" label={t("sellBackDash")} />
        <h1 style={S.heading}>{t("sellTitle")}</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>{t("sellSub")}</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* รูปสินค้า */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>
              {t("sellPhotos")}
              <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 13 }}>{" "}({lang === "en" ? `Up to ${MAX_IMAGES} photos` : `สูงสุด ${MAX_IMAGES} รูป · เพิ่มได้ทีละหลายรูป`})</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 12 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  <img src={src} alt={`preview ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {i === 0 && (
                    <div style={{ position: "absolute", top: 4, left: 4, background: "#1e3a8a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>{t("mainPhotoLabel")}</div>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>
              ))}

              {previews.length < MAX_IMAGES && (
                <div onClick={() => fileRef.current.click()}
                  style={{ aspectRatio: "1", borderRadius: 10, border: "2px dashed #d1d5db", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#fafafa", color: "#9ca3af", gap: 4, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1e3a8a"; e.currentTarget.style.color = "#1e3a8a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af"; }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{t("sellAddPhoto")}</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{i18n[lang]?.sellPhotosNote?.(MAX_IMAGES) ?? `รูปแรกจะเป็นรูปหลัก · JPG, PNG · เพิ่มได้สูงสุด ${MAX_IMAGES} รูป`}</p>
              <span style={{ fontSize: 11, color: previews.length >= MAX_IMAGES ? "#dc2626" : "#9ca3af", fontWeight: 600 }}>{previews.length}/{MAX_IMAGES}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
          </div>

          {/* ข้อมูลสินค้า */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>{t("sellInfo")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* ชื่อ */}
              <div>
                <label style={S.label}>{t("sellName")}</label>
                <input required value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder={t("sellNamePlaceholder")} style={S.input} />
              </div>

              {/* ประเภท + ปี */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>{t("sellCategory")} <span style={{ color: "#dc2626" }}>*</span></label>
                  <select required value={form.category} onChange={e => setCategory(e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                    <option value="">{t("sellSelectCat")}</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>{t("sellYear")}</label>
                  <input value={form.year} onChange={e => set("year", e.target.value)} placeholder={t("sellYearPlaceholder")} style={S.input} />
                </div>
              </div>

              {/* Team selector — conditional by category */}
              {form.category === "football" && (
                <div>
                  <label style={S.label}>{t("sellLeague")} <span style={{ color: "#dc2626" }}>*</span></label>
                  {/* League pills */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {Object.keys(FOOTBALL_LEAGUES).map(lg => (
                      <button key={lg} type="button" onClick={() => setLeague(lg)}
                        style={{ padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${form.league === lg ? "#1e3a8a" : "#e5e7eb"}`, background: form.league === lg ? "#1e3a8a" : "#fff", color: form.league === lg ? "#fff" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                        {lg}
                      </button>
                    ))}
                  </div>
                  {/* Team search */}
                  {form.league ? (
                    <TeamSearch
                      teams={FOOTBALL_LEAGUES[form.league]}
                      value={form.team}
                      onChange={val => set("team", val)}
                      placeholder={i18n[lang]?.sellSearchTeam?.(form.league) ?? `ค้นหาทีมใน ${form.league}...`}
                    />
                  ) : (
                    <div style={{ padding: "11px 14px", borderRadius: 10, border: "1px dashed #d1d5db", fontSize: 13, color: "#9ca3af", background: "#fafafa" }}>
                      {t("sellSelectLeagueFirst")}
                    </div>
                  )}
                </div>
              )}

              {form.category === "basketball" && (
                <div>
                  <label style={S.label}>{t("sellNBA")} <span style={{ color: "#dc2626" }}>*</span></label>
                  <TeamSearch
                    teams={NBA_TEAMS}
                    value={form.team}
                    onChange={val => set("team", val)}
                    placeholder={t("sellSearchNBA")}
                  />
                </div>
              )}

              {form.category === "nhl" && (
                <div>
                  <label style={S.label}>{t("sellNHL")} <span style={{ color: "#dc2626" }}>*</span></label>
                  <TeamSearch teams={NHL_TEAMS} value={form.team} onChange={val => set("team", val)} placeholder={t("sellSearchNHL")} />
                </div>
              )}

              {form.category === "nfl" && (
                <div>
                  <label style={S.label}>{t("sellNFL")} <span style={{ color: "#dc2626" }}>*</span></label>
                  <TeamSearch teams={NFL_TEAMS} value={form.team} onChange={val => set("team", val)} placeholder={t("sellSearchNFL")} />
                </div>
              )}

              {form.category === "sportswear" && (
                <div>
                  <label style={S.label}>{t("sellBrand")} <span style={{ color: "#dc2626" }}>*</span></label>
                  <TeamSearch teams={SPORTSWEAR_BRANDS} value={form.team} onChange={val => set("team", val)} placeholder={t("sellSearchBrand")} />
                </div>
              )}

              {form.category === "retro" && (
                <div>
                  <label style={S.label}>{t("sellTeam")}</label>
                  <input value={form.team} onChange={e => set("team", e.target.value)} placeholder={t("sellTeamPlaceholder")} style={S.input} />
                </div>
              )}

              {/* ประเภทเสื้อ toggle */}
              <div>
                <label style={S.label}>{t("sellGradeType")} <span style={{ color: "#dc2626" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {GRADE_TYPES.map(gt => (
                    <button key={gt.value} type="button" onClick={() => set("gradeType", gt.value)}
                      style={{ padding: "12px 14px", borderRadius: 12, border: `2px solid ${form.gradeType === gt.value ? "#1e3a8a" : "#e5e7eb"}`, background: form.gradeType === gt.value ? "#eff6ff" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: form.gradeType === gt.value ? "#1e3a8a" : "#374151", marginBottom: 2 }}>{gt.label}</div>
                      <div style={{ fontSize: 11, color: form.gradeType === gt.value ? "#3b82f6" : "#9ca3af" }}>{gt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ขนาด + รอบอก + ราคา */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>{t("sellSize")}</label>
                  <select required value={form.size} onChange={e => set("size", e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                    <option value="">{t("sellSizeDefault")}</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>{t("sellChest")}</label>
                  <input value={form.chest} onChange={e => set("chest", e.target.value.replace(/\D/g, ""))}
                    placeholder={t("sellChestPlaceholder")} inputMode="numeric" maxLength={3} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>{t("sellPrice")}</label>
                  <input required value={form.price} onChange={e => set("price", e.target.value.replace(/\D/g, ""))}
                    placeholder="0" inputMode="numeric" style={S.input} />
                </div>
              </div>

              {/* สภาพเสื้อ */}
              <div>
                <label style={S.label}>{t("sellCondition")} <span style={{ color: "#dc2626" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {CONDITIONS.map(c => (
                    <button key={c.value} type="button" onClick={() => set("grade", c.value)}
                      style={{ padding: "12px 14px", borderRadius: 12, border: `2px solid ${form.grade === c.value ? "#1e3a8a" : "#e5e7eb"}`, background: form.grade === c.value ? "#eff6ff" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: form.grade === c.value ? "#1e3a8a" : "#374151", marginBottom: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 10, color: form.grade === c.value ? "#3b82f6" : "#9ca3af", lineHeight: 1.4 }}>{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* รายละเอียด */}
              <div>
                <label style={S.label}>{t("sellDesc")}</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder={t("sellDescPlaceholder")} rows={4}
                  style={{ ...S.input, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          </div>

          {error && <div style={S.errorBox}>⚠️ {error}</div>}

          <button type="submit" disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.7 : 1 }}>
            {saving ? t("sellSubmitting") : t("sellSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function TeamSearch({ teams, value, onChange, placeholder }) {
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const [query, setQuery]   = useState(value || "");
  const [open, setOpen]     = useState(false);
  const wrapRef             = useRef(null);

  const filtered = query.trim()
    ? teams.filter(t => t.toLowerCase().includes(query.toLowerCase()))
    : teams;

  function select(team) {
    setQuery(team);
    onChange(team);
    setOpen(false);
  }

  // reset query when value cleared externally (e.g. league change)
  useEffect(() => { setQuery(value || ""); }, [value]);

  // close on outside click
  useEffect(() => {
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ width: "100%", padding: "11px 38px 11px 14px", borderRadius: 10, border: `1.5px solid ${open ? "#1e3a8a" : "#e5e7eb"}`, fontSize: 14, color: "#0f0f0e", outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.15s" }}
        />
        {/* search icon */}
        <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 200, maxHeight: 220, overflowY: "auto" }}>
          {filtered.map(t => (
            <div key={t} onMouseDown={() => select(t)}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: t === value ? "#1e3a8a" : "#374151", fontWeight: t === value ? 700 : 400, background: t === value ? "#eff6ff" : "transparent", borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
              onMouseEnter={e => { if (t !== value) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (t !== value) e.currentTarget.style.background = "transparent"; }}>
              {t}
            </div>
          ))}
        </div>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 200, padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>
          {t("sellNoTeamFound")}
        </div>
      )}
    </div>
  );
}

function BackLink({ href, label }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 16 }}
      onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </a>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  nav: { position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 },
  logo: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" },
  logoutBtn: { background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 16px", borderRadius: 99, fontSize: 13, cursor: "pointer" },
  heading: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 6px" },
  card: { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "28px 32px" },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#0f0f0e", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #e2e8f0" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, color: "#0f0f0e", outline: "none", background: "#fafafa", boxSizing: "border-box" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
  primaryBtn: { width: "100%", padding: "13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: "pointer" },
};
