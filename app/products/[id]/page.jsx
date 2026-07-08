"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { useLang } from "@/app/context/language";
import LanguageToggle from "@/app/components/LanguageToggle";
import MobileNav from "@/app/components/MobileNav";
import i18n from "@/app/i18n";

const TEAM_LOGOS = {
  // ── Premier League ──
  "Arsenal":"https://a.espncdn.com/i/teamlogos/soccer/500/359.png",
  "Aston Villa":"https://a.espncdn.com/i/teamlogos/soccer/500/1082.png",
  "Bournemouth":"https://a.espncdn.com/i/teamlogos/soccer/500/349.png",
  "Brentford":"https://a.espncdn.com/i/teamlogos/soccer/500/337.png",
  "Brighton & Hove Albion":"https://a.espncdn.com/i/teamlogos/soccer/500/331.png",
  "Chelsea":"https://a.espncdn.com/i/teamlogos/soccer/500/363.png",
  "Crystal Palace":"https://a.espncdn.com/i/teamlogos/soccer/500/384.png",
  "Everton":"https://a.espncdn.com/i/teamlogos/soccer/500/368.png",
  "Fulham":"https://a.espncdn.com/i/teamlogos/soccer/500/370.png",
  "Ipswich Town":"https://a.espncdn.com/i/teamlogos/soccer/500/373.png",
  "Leicester City":"https://a.espncdn.com/i/teamlogos/soccer/500/375.png",
  "Liverpool":"https://a.espncdn.com/i/teamlogos/soccer/500/364.png",
  "Manchester City":"https://a.espncdn.com/i/teamlogos/soccer/500/382.png",
  "Manchester United":"https://a.espncdn.com/i/teamlogos/soccer/500/360.png",
  "Newcastle United":"https://a.espncdn.com/i/teamlogos/soccer/500/361.png",
  "Nottingham Forest":"https://a.espncdn.com/i/teamlogos/soccer/500/393.png",
  "Southampton":"https://a.espncdn.com/i/teamlogos/soccer/500/376.png",
  "Tottenham Hotspur":"https://a.espncdn.com/i/teamlogos/soccer/500/367.png",
  "West Ham United":"https://a.espncdn.com/i/teamlogos/soccer/500/371.png",
  "Wolverhampton Wanderers":"https://a.espncdn.com/i/teamlogos/soccer/500/380.png",
  // ── La Liga ──
  "Real Madrid":"https://a.espncdn.com/i/teamlogos/soccer/500/86.png",
  "Barcelona":"https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
  "Atletico Madrid":"https://a.espncdn.com/i/teamlogos/soccer/500/1068.png",
  "Athletic Bilbao":"https://a.espncdn.com/i/teamlogos/soccer/500/77.png",
  "Real Sociedad":"https://a.espncdn.com/i/teamlogos/soccer/500/89.png",
  "Real Betis":"https://a.espncdn.com/i/teamlogos/soccer/500/88.png",
  "Villarreal":"https://a.espncdn.com/i/teamlogos/soccer/500/94.png",
  "Valencia":"https://a.espncdn.com/i/teamlogos/soccer/500/532.png",
  "Sevilla":"https://a.espncdn.com/i/teamlogos/soccer/500/243.png",
  "Osasuna":"https://a.espncdn.com/i/teamlogos/soccer/500/87.png",
  "Celta Vigo":"https://a.espncdn.com/i/teamlogos/soccer/500/558.png",
  "Girona":"https://a.espncdn.com/i/teamlogos/soccer/500/9783.png",
  "Getafe":"https://a.espncdn.com/i/teamlogos/soccer/500/9812.png",
  "Rayo Vallecano":"https://a.espncdn.com/i/teamlogos/soccer/500/9817.png",
  "Mallorca":"https://a.espncdn.com/i/teamlogos/soccer/500/9786.png",
  "Deportivo Alaves":"https://a.espncdn.com/i/teamlogos/soccer/500/9829.png",
  "Espanyol":"https://a.espncdn.com/i/teamlogos/soccer/500/85.png",
  // ── Serie A ──
  "Inter Milan":"https://a.espncdn.com/i/teamlogos/soccer/500/110.png",
  "AC Milan":"https://a.espncdn.com/i/teamlogos/soccer/500/103.png",
  "Juventus":"https://a.espncdn.com/i/teamlogos/soccer/500/111.png",
  "Napoli":"https://a.espncdn.com/i/teamlogos/soccer/500/114.png",
  "Atalanta":"https://a.espncdn.com/i/teamlogos/soccer/500/104.png",
  "AS Roma":"https://a.espncdn.com/i/teamlogos/soccer/500/113.png",
  "Lazio":"https://a.espncdn.com/i/teamlogos/soccer/500/112.png",
  "Fiorentina":"https://a.espncdn.com/i/teamlogos/soccer/500/109.png",
  "Bologna":"https://a.espncdn.com/i/teamlogos/soccer/500/105.png",
  "Torino":"https://a.espncdn.com/i/teamlogos/soccer/500/115.png",
  "Genoa":"https://a.espncdn.com/i/teamlogos/soccer/500/107.png",
  "Udinese":"https://a.espncdn.com/i/teamlogos/soccer/500/116.png",
  "Cagliari":"https://a.espncdn.com/i/teamlogos/soccer/500/106.png",
  "Hellas Verona":"https://a.espncdn.com/i/teamlogos/soccer/500/119.png",
  "Empoli":"https://a.espncdn.com/i/teamlogos/soccer/500/2274.png",
  "Lecce":"https://a.espncdn.com/i/teamlogos/soccer/500/2281.png",
  // ── Ligue 1 ──
  "Paris Saint-Germain":"https://a.espncdn.com/i/teamlogos/soccer/500/160.png",
  "Monaco":"https://a.espncdn.com/i/teamlogos/soccer/500/162.png",
  "Olympique de Marseille":"https://a.espncdn.com/i/teamlogos/soccer/500/164.png",
  "Olympique Lyonnais":"https://a.espncdn.com/i/teamlogos/soccer/500/163.png",
  "Lille":"https://a.espncdn.com/i/teamlogos/soccer/500/167.png",
  "Lens":"https://a.espncdn.com/i/teamlogos/soccer/500/2803.png",
  "OGC Nice":"https://a.espncdn.com/i/teamlogos/soccer/500/176.png",
  "Rennes":"https://a.espncdn.com/i/teamlogos/soccer/500/168.png",
  "Reims":"https://a.espncdn.com/i/teamlogos/soccer/500/2826.png",
  "Brest":"https://a.espncdn.com/i/teamlogos/soccer/500/3011.png",
  "Nantes":"https://a.espncdn.com/i/teamlogos/soccer/500/173.png",
  "Montpellier":"https://a.espncdn.com/i/teamlogos/soccer/500/172.png",
  "Toulouse":"https://a.espncdn.com/i/teamlogos/soccer/500/178.png",
  "Saint-Etienne":"https://a.espncdn.com/i/teamlogos/soccer/500/174.png",
  // ── NBA ──
  "Atlanta Hawks":"https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
  "Boston Celtics":"https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
  "Brooklyn Nets":"https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
  "Charlotte Hornets":"https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
  "Chicago Bulls":"https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
  "Cleveland Cavaliers":"https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
  "Dallas Mavericks":"https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
  "Denver Nuggets":"https://a.espncdn.com/i/teamlogos/nba/500/den.png",
  "Detroit Pistons":"https://a.espncdn.com/i/teamlogos/nba/500/det.png",
  "Golden State Warriors":"https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
  "Houston Rockets":"https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
  "Indiana Pacers":"https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
  "LA Clippers":"https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
  "Los Angeles Lakers":"https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  "Memphis Grizzlies":"https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
  "Miami Heat":"https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
  "Milwaukee Bucks":"https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
  "Minnesota Timberwolves":"https://a.espncdn.com/i/teamlogos/nba/500/min.png",
  "New Orleans Pelicans":"https://a.espncdn.com/i/teamlogos/nba/500/no.png",
  "New York Knicks":"https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
  "Oklahoma City Thunder":"https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
  "Orlando Magic":"https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
  "Philadelphia 76ers":"https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
  "Phoenix Suns":"https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
  "Portland Trail Blazers":"https://a.espncdn.com/i/teamlogos/nba/500/por.png",
  "Sacramento Kings":"https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
  "San Antonio Spurs":"https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
  "Toronto Raptors":"https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
  "Utah Jazz":"https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
  "Washington Wizards":"https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
};

const TEAM_LEAGUE_MAP = {
  "Arsenal":"Premier League","Aston Villa":"Premier League","Bournemouth":"Premier League","Brentford":"Premier League","Brighton & Hove Albion":"Premier League","Chelsea":"Premier League","Crystal Palace":"Premier League","Everton":"Premier League","Fulham":"Premier League","Ipswich Town":"Premier League","Leicester City":"Premier League","Liverpool":"Premier League","Manchester City":"Premier League","Manchester United":"Premier League","Newcastle United":"Premier League","Nottingham Forest":"Premier League","Southampton":"Premier League","Tottenham Hotspur":"Premier League","West Ham United":"Premier League","Wolverhampton Wanderers":"Premier League",
  "Real Madrid":"La Liga","Barcelona":"La Liga","Atletico Madrid":"La Liga","Athletic Bilbao":"La Liga","Real Sociedad":"La Liga","Real Betis":"La Liga","Villarreal":"La Liga","Valencia":"La Liga","Sevilla":"La Liga","Osasuna":"La Liga","Celta Vigo":"La Liga","Girona":"La Liga","Getafe":"La Liga","Rayo Vallecano":"La Liga","Mallorca":"La Liga","Las Palmas":"La Liga","Leganes":"La Liga","Deportivo Alaves":"La Liga","Valladolid":"La Liga","Espanyol":"La Liga",
  "Inter Milan":"Serie A","AC Milan":"Serie A","Juventus":"Serie A","Napoli":"Serie A","Atalanta":"Serie A","AS Roma":"Serie A","Lazio":"Serie A","Fiorentina":"Serie A","Bologna":"Serie A","Torino":"Serie A","Genoa":"Serie A","Monza":"Serie A","Como":"Serie A","Udinese":"Serie A","Lecce":"Serie A","Cagliari":"Serie A","Parma":"Serie A","Venezia":"Serie A","Hellas Verona":"Serie A","Empoli":"Serie A",
  "Paris Saint-Germain":"Ligue 1","Monaco":"Ligue 1","Olympique de Marseille":"Ligue 1","Olympique Lyonnais":"Ligue 1","Lille":"Ligue 1","Lens":"Ligue 1","OGC Nice":"Ligue 1","Rennes":"Ligue 1","Reims":"Ligue 1","Strasbourg":"Ligue 1","Brest":"Ligue 1","Nantes":"Ligue 1","Montpellier":"Ligue 1","Toulouse":"Ligue 1","Le Havre":"Ligue 1","Angers":"Ligue 1","Saint-Etienne":"Ligue 1",
  "Atlanta Hawks":"NBA","Boston Celtics":"NBA","Brooklyn Nets":"NBA","Charlotte Hornets":"NBA","Chicago Bulls":"NBA","Cleveland Cavaliers":"NBA","Dallas Mavericks":"NBA","Denver Nuggets":"NBA","Detroit Pistons":"NBA","Golden State Warriors":"NBA","Houston Rockets":"NBA","Indiana Pacers":"NBA","LA Clippers":"NBA","Los Angeles Lakers":"NBA","Memphis Grizzlies":"NBA","Miami Heat":"NBA","Milwaukee Bucks":"NBA","Minnesota Timberwolves":"NBA","New Orleans Pelicans":"NBA","New York Knicks":"NBA","Oklahoma City Thunder":"NBA","Orlando Magic":"NBA","Philadelphia 76ers":"NBA","Phoenix Suns":"NBA","Portland Trail Blazers":"NBA","Sacramento Kings":"NBA","San Antonio Spurs":"NBA","Toronto Raptors":"NBA","Utah Jazz":"NBA","Washington Wizards":"NBA",
};

const GRADE_INFO = {
  S: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  A: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  B: { bg: "#fef9c3", text: "#a16207", border: "#fde68a" },
};
const CAT_ICON  = {
  football:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>,
  basketball: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c4.69 4.69 10.12 9.27 9.14 9.14-.98-.14-4.45-4.45-9.14-9.14z"/><path d="M19.07 4.93c-4.69 4.69-10.12 9.27-9.14 9.14"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>,
  retro:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

const PLATFORM_PROMPTPAY = "0994156241";

export default function ProductDetailPage() {
  const supabase = createClient();
  const router   = useRouter();
  const { id }   = useParams();

  const [product, setProduct]         = useState(null);
  const [seller, setSeller]           = useState(null);
  const [buyer, setBuyer]             = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeImg, setActiveImg]     = useState(0);
  const [lightbox, setLightbox]       = useState(false);
  const [navUser, setNavUser]         = useState(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [step, setStep]               = useState(0);
  const [addrForm, setAddrForm]       = useState({
    full_name: "", phone: "", address: "", subdistrict: "", district: "", province: "", postal_code: "",
  });
  const [slipFile, setSlipFile]       = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [qrDataUrl, setQrDataUrl]     = useState(null);
  const [ordering, setOrdering]       = useState(false);
  const [orderId, setOrderId]         = useState(null);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [verifyMsg, setVerifyMsg]     = useState("");
  const [transRef, setTransRef]       = useState(null);
  const [slipHash, setSlipHash]       = useState(null);
  const [reviews, setReviews]         = useState([]);
  const [shippedCount, setShippedCount] = useState(0);
  const [timeLeft, setTimeLeft]       = useState(180);
  const [isReservedByMe, setIsReservedByMe] = useState(false);
  const isReservedRef = useRef(false);
  const intervalRef   = useRef(null);

  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;

  useEffect(() => {
    async function load() {
      const [{ data: prod }, { data: { user } }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.auth.getUser(),
      ]);
      if (!prod) { router.push("/"); return; }
      setProduct(prod);
      setNavUser(user);

      const [{ data: sellerProfile }, { count }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, avatar_url").eq("id", prod.seller_id).single(),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", prod.seller_id).eq("status", "completed"),
      ]);
      setSeller(sellerProfile);
      setShippedCount(count ?? 0);

      // โหลด reviews ของ seller นี้
      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id")
        .eq("seller_id", prod.seller_id)
        .order("created_at", { ascending: false });
      if (reviewRows?.length) {
        const rIds = [...new Set(reviewRows.map(r => r.reviewer_id))];
        const { data: reviewers } = await supabase
          .from("profiles").select("id, full_name, avatar_url").in("id", rIds);
        setReviews(reviewRows.map(r => ({
          ...r,
          reviewer_name:   reviewers?.find(p => p.id === r.reviewer_id)?.full_name || "Buyer",
          reviewer_avatar: reviewers?.find(p => p.id === r.reviewer_id)?.avatar_url || null,
        })));
      }

      if (user) {
        setBuyer(user);
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setBuyerProfile(profile);
        setAddrForm({
          full_name:   profile?.full_name   || "",
          phone:       profile?.phone       || "",
          address:     profile?.address     || "",
          subdistrict: profile?.subdistrict || "",
          district:    profile?.district    || "",
          province:    profile?.province    || "",
          postal_code: profile?.postal_code || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);


  // Revert product back to available if payment was abandoned
  async function unreserveProduct() {
    if (!isReservedRef.current) return;
    clearInterval(intervalRef.current);
    isReservedRef.current = false;
    setIsReservedByMe(false);
    await supabase
      .from("products")
      .update({ status: "approved" })
      .eq("id", product.id)
      .eq("status", "sold");
  }

  // Clear interval on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  // Real-time product status subscription — updates other browsers/tabs immediately
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`product-${id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${id}`,
      }, ({ new: updated }) => {
        // Don't override local state if WE are the ones who locked it
        if (!isReservedRef.current) {
          setProduct(prev => prev ? { ...prev, ...updated } : prev);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generateQR(amount) {
    const payload = generatePayload(PLATFORM_PROMPTPAY, { amount });
    const url = await QRCode.toDataURL(payload, { width: 220, margin: 2 });
    setQrDataUrl(url);
  }

  async function openCheckout() {
    if (!buyer) { router.push("/login"); return; }

    // Lock the product the moment user opens checkout
    if (!isReservedRef.current) {
      const { data: locked } = await supabase
        .from("products")
        .update({ status: "sold" })
        .eq("id", product.id)
        .eq("status", "approved")
        .select("id");

      if (!locked?.length) {
        alert(t("alertReserved"));
        setProduct(p => p ? { ...p, status: "sold" } : p);
        return;
      }
      isReservedRef.current = true;
      setIsReservedByMe(true);

      // Start 3-minute countdown from the moment checkout opens
      setTimeLeft(180);
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            ;(async () => {
              if (isReservedRef.current) {
                isReservedRef.current = false;
                await supabase.from("products").update({ status: "approved" }).eq("id", product.id).eq("status", "sold");
              }
              router.push("/");
            })();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setStep(1);
  }

  async function handleChat() {
    if (!buyer) { router.push("/login"); return; }
    if (chatLoading) return;
    setChatLoading(true);
    try {
      const { data: existing, error: findErr } = await supabase
        .from("conversations").select("id")
        .eq("buyer_id", buyer.id).eq("seller_id", product.seller_id).eq("product_id", product.id)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) { router.push(`/messages/${existing.id}`); return; }

      const { data: created, error: createErr } = await supabase
        .from("conversations")
        .insert({ buyer_id: buyer.id, seller_id: product.seller_id, product_id: product.id })
        .select("id").single();
      if (createErr) throw createErr;
      if (created) router.push(`/messages/${created.id}`);
    } catch (err) {
      alert("ไม่สามารถเปิดแชทได้: " + (err?.message || "เกิดข้อผิดพลาด"));
    } finally {
      setChatLoading(false);
    }
  }

  function confirmAddress() {
    const req = ["full_name", "phone", "address", "subdistrict", "district", "province", "postal_code"];
    if (req.some(k => !addrForm[k]?.trim())) { alert(t("alertFillAll")); return; }
    generateQR(product.price);
    setStep(2);
  }

  async function handleSlip(e) {
    const f = e.target.files[0];
    if (!f) return;
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    setVerifyStatus("loading");
    setVerifyMsg("");
    const fd = new FormData();
    fd.append("file", f);
    fd.append("amount", product.price);
    try {
      const res    = await fetch("/api/verify-slip", { method: "POST", body: fd });
      const result = await res.json();
      if (result.ok) {
        setVerifyStatus("ok");
        setVerifyMsg(`ยืนยันสำเร็จ ฿${Number(result.amount).toLocaleString()}`);
        setTransRef(result.transRef || null);
        setSlipHash(result.slipHash || null);
      } else {
        setVerifyStatus("error");
        setVerifyMsg(result.error);
      }
    } catch {
      setVerifyStatus("error");
      setVerifyMsg(t("slipVerifyFail"));
    }
  }

  async function handleOrder() {
    if (!slipFile) { alert(t("alertNoSlip")); return; }
    setOrdering(true);
    const ext  = slipFile.name.split(".").pop();
    const path = `${buyer.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("slips").upload(path, slipFile, { upsert: true });
    if (uploadErr) { alert(`${t("alertSlipUploadFail")}: ${uploadErr.message}`); setOrdering(false); return; }
    const { data: { publicUrl: slip_url } } = supabase.storage.from("slips").getPublicUrl(path);

    const shippingText = [addrForm.address, addrForm.subdistrict, addrForm.district, addrForm.province, addrForm.postal_code].filter(Boolean).join(" ");
    const fee = Math.round(product.price * 0.1 * 100) / 100;

    // Temporarily revert to "approved" so place_order RPC can proceed atomically
    // (We held the lock as "sold" during checkout to block other buyers)
    await supabase.from("products").update({ status: "approved" }).eq("id", product.id).eq("status", "sold");
    isReservedRef.current = false;
    setIsReservedByMe(false);

    const { data: newOrderId, error } = await supabase.rpc("place_order", {
      p_product_id: product.id, p_amount: product.price,
      p_fee_amount: fee, p_seller_amount: product.price - fee,
      p_shipping_name: addrForm.full_name, p_shipping_phone: addrForm.phone,
      p_shipping_addr: shippingText, p_slip_url: slip_url,
    });

    if (error) {
      alert(error.message.includes("ถูกซื้อไปแล้ว") ? t("alertAlreadySold") : `${t("alertOrderFail")}: ${error.message}`);
      setOrdering(false); return;
    }

    await supabase.from("orders").update({
      status: "paid", trans_ref: transRef || null, slip_hash: slipHash || null,
    }).eq("id", newOrderId);

    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_placed", buyerEmail: buyer.email, buyerName: addrForm.full_name,
        sellerEmail: seller?.email, sellerName: seller?.full_name,
        productName: product.name, orderId: newOrderId, amount: product.price,
      }),
    }).catch(() => {});

    clearInterval(intervalRef.current);
    setOrderId(newOrderId);
    setOrdering(false);
    setStep(3);
  }

  if (loading) return <Spinner />;
  if (!product) return null;

  const images    = product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []);
  const gradeInfo = GRADE_INFO[product.grade] || GRADE_INFO.S;
  const isSold    = product.status === "sold";
  const teamBadge = product.team ? TEAM_LOGOS[product.team] || null : null;
  const teamLeague = product.team ? TEAM_LEAGUE_MAP[product.team] || null : null;
  const gradeLabel = i18n[lang]?.gradeLabel?.[product.grade] ?? gradeInfo.label;
  const gradeDesc  = i18n[lang]?.gradeDesc?.[product.grade]  ?? gradeInfo.desc;
  const isOwner   = buyer?.id === product.seller_id;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity:0; transform:scale(0.6); } 70% { transform:scale(1.08); } 100% { opacity:1; transform:scale(1); } }
        .thumb-item { transition: all 0.15s; }
        .thumb-item:hover { border-color: #1e3a8a !important; transform: translateY(-1px); }
        .btn-chat:hover { background: #f1f5f9 !important; border-color: #94a3b8 !important; }
        .rm-mobile-bar { display: none; }
        @media (max-width: 640px) {
          .rm-mobile-bar { display: flex !important; }
          .rm-desktop-cta { display: none !important; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div className="rm-nav-links" style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
          <a href="/shop" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}>{t("navShop")}</a>
          {navUser ? (
            <a href="/dashboard" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 99 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {navUser.email?.[0]?.toUpperCase() || "U"}
              </div>
              {t("navMyAccount")}
            </a>
          ) : (
            <>
              <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: "#475569", textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>{t("navLogin")}</a>
              <a href="/register" style={{ fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none", padding: "8px 20px", borderRadius: 8, background: "#1e3a8a" }}
                onMouseEnter={e => e.currentTarget.style.background = "#172554"}
                onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>{t("navRegister")}</a>
            </>
          )}
          <LanguageToggle />
        </div>
        {/* Hamburger — mobile only */}
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
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={navUser} profile={buyerProfile} />
      </nav>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
          <a href="/" style={{ color: "#94a3b8", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>{t("breadcrumbHome")}</a>
          <span>/</span>
          <a href="/shop" style={{ color: "#94a3b8", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>{t("breadcrumbShop")}</a>
          <span>/</span>
          <a href={`/shop?category=${product.category}`} style={{ color: "#94a3b8", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>{(i18n[lang]?.catLabel ?? i18n.th.catLabel)[product.category]}</a>
          <span>/</span>
          <span style={{ color: "#374151", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="rm-page" style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 32px 64px" }}>
      <div className="rm-product-grid" style={{ background: "#fff", border: "1.5px solid #e4eaf3", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,.07)", padding: "36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "start" }}>

        {/* ── Left: Images ── */}
        <div className="rm-sticky-img" style={{ position: "sticky", top: 88 }}>
          {/* Main image — portrait 3:4 */}
          <div
            onClick={() => images[activeImg] && setLightbox(true)}
            style={{ borderRadius: 20, overflow: "hidden", background: "#f8fafc", border: "1px solid #e2e8f0", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", cursor: images[activeImg] ? "zoom-in" : "default", position: "relative", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
          >
            {images[activeImg]
              ? <img src={images[activeImg]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.45s ease" }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"} />
              : <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
            }

            {/* Verified badge */}
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.96)", border: "1px solid #bbf7d0", borderRadius: 99, padding: "5px 10px", boxShadow: "0 2px 8px rgba(0,0,0,.08)", backdropFilter: "blur(8px)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d" }}>{t("verifiedBadge")}</span>
            </div>

            {/* Photo counter */}
            {images.length > 1 && (
              <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{activeImg + 1} / {images.length}</span>
              </div>
            )}

            {/* Zoom hint */}
            {images[activeImg] && (
              <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "5px 9px", display: "flex", alignItems: "center", gap: 5, pointerEvents: "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.9)", fontWeight: 600 }}>{t("zoomHint")}</span>
              </div>
            )}
          </div>

          {/* Thumbnails — horizontal strip */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
              {images.map((src, i) => (
                <div key={i} className="thumb-item" onClick={() => setActiveImg(i)}
                  style={{ width: 56, height: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden", border: `2px solid ${activeImg === i ? "#1e3a8a" : "#e5e7eb"}`, cursor: "pointer", boxShadow: activeImg === i ? "0 0 0 3px rgba(30,58,138,.15)" : "none" }}>
                  <img src={src} alt={`รูป ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Trust strip */}
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            {[
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: t("trustEscrow"), bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, text: t("trustVerified"), bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>, text: t("trustReturn"), bg: "#faf5ff", border: "#e9d5ff", color: "#7c3aed" },
            ].map(({ icon, text, bg, border, color }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: bg, border: `1px solid ${border}`, borderRadius: 99, fontSize: 11, fontWeight: 600, color }}>
                {icon}{text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Info ── */}
        <div style={{ animation: "fadeIn 0.35s ease" }}>

          {/* Category + sold badge */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {(i18n[lang]?.catLabel ?? i18n.th.catLabel)[product.category]}
            </span>
            {isSold && (
              <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>{t("soldBadge")}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="rm-thai" style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, color: "#0f172a", margin: "0 0 14px", lineHeight: 1.35 }}>
            {product.name}
          </h1>

          {/* Seller row — right under title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 13px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
              {seller?.avatar_url
                ? <img src={seller.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : seller?.full_name?.[0] || "S"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{seller?.full_name || "Seller"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
                {shippedCount > 0 && <span style={{ fontSize: 11, color: "#6b7280" }}>· {i18n[lang]?.shippedCount?.(shippedCount) ?? `ส่งแล้ว ${shippedCount} ชิ้น`}</span>}
              </div>
            </div>
            {!isOwner && (
              <button onClick={handleChat} disabled={chatLoading} className="btn-chat"
                style={{ padding: "7px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", cursor: chatLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", flexShrink: 0, opacity: chatLoading ? 0.6 : 1 }}>
                {chatLoading
                  ? <span style={{ fontSize: 11 }}>...</span>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                }
                {t("chatBtn")}
              </button>
            )}
          </div>

          {/* Team badge card — shows whenever product.team exists */}
          {product.team && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", animation: "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 12, overflow: "hidden" }}>
                {teamBadge
                  ? <img src={teamBadge} alt={product.team} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.15))" }} />
                  : <span style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a" }}>{product.team.charAt(0)}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.team}</div>
                {teamLeague
                  ? <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 3 }}>{teamLeague}</div>
                  : <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 3 }}>{t("teamLoading")}</div>
                }
              </div>
            </div>
          )}

          {/* Meta tags — size, year, chest */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { icon: "📐", label: i18n[lang]?.sizeTag?.(product.size)  ?? `ไซส์ ${product.size}` },
              product.year  && { icon: "📅", label: i18n[lang]?.yearTag?.(product.year)   ?? `ปี ${product.year}` },
              product.chest && { icon: "📏", label: i18n[lang]?.chestTag?.(product.chest) ?? `รอบอก ${product.chest} cm` },
            ].filter(Boolean).map(({ icon, label }) => (
              <span key={label} style={{ fontSize: 12, color: "#475569", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 8, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10 }}>{icon}</span>{label}
              </span>
            ))}
          </div>

          {/* Condition card */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: gradeInfo.bg, border: `1.5px solid ${gradeInfo.border}`, borderRadius: 12, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: gradeInfo.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>{product.grade}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: gradeInfo.text }}>{gradeLabel}</div>
              <div style={{ fontSize: 11, color: gradeInfo.text, opacity: 0.75, marginTop: 1 }}>{gradeDesc}</div>
            </div>
          </div>

          {/* Price box — dark premium */}
          <div style={{ background: "#0f172a", borderRadius: 14, padding: "18px 20px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "rgba(255,255,255,0.04)", borderRadius: "50%", transform: "translate(20px,-20px)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{t("salePrice")}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>฿</span>
              <span className="rm-price" style={{ fontSize: "clamp(30px, 3.5vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                {Number(product.price).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {t("escrowNote")}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{t("descSec")}</div>
              <p className="rm-thai" style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>{product.description}</p>
            </div>
          )}

          {/* CTA — desktop only, replaced by sticky bar on mobile */}
          <div className="rm-desktop-cta">
            {isSold ? (
              <div style={{ width: "100%", padding: "14px", background: "#f1f5f9", color: "#94a3b8", borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: "center", boxSizing: "border-box" }}>
                {t("soldLabel")}
              </div>
            ) : (
              <button onClick={openCheckout}
                style={{ width: "100%", padding: "14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s", boxSizing: "border-box" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1e3a8a"}
                onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}>
                {t("buyBtn")}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}
          </div>

          {/* Trust row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
            {[
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "Escrow" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "Verified" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>, text: t("trustReturn") },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                {icon}{text}
              </div>
            ))}
          </div>

          {/* Reviews link */}
          <a href="/reviews" style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none", color: "#94a3b8", fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = "#475569"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {reviews.length > 0 ? (i18n[lang]?.reviewsCount?.(reviews.length) ?? `${reviews.length} รีวิว`) : t("noReviews")}
          </a>
        </div>
        </div>

      </div>


      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setLightbox(false)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
          {activeImg > 0 && (
            <button onClick={e => { e.stopPropagation(); setActiveImg(i => i - 1); }}
              style={{ position: "absolute", left: 20, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}>‹</button>
          )}
          <img src={images[activeImg]} alt={product.name} onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 12, userSelect: "none" }} />
          {activeImg < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setActiveImg(i => i + 1); }}
              style={{ position: "absolute", right: 20, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}>›</button>
          )}
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8 }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i); }}
                  style={{ width: i === activeImg ? 24 : 8, height: 8, borderRadius: 99, background: i === activeImg ? "#fff" : "rgba(255,255,255,.35)", border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHECKOUT MODAL (Steps 1 & 2) ── */}
      {step > 0 && step < 3 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { unreserveProduct(); setStep(0); } }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>

            {/* Modal product header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", flexShrink: 0, border: "1px solid #e2e8f0" }}>
                {(product.image_urls?.[0] || product.image_url)
                  ? <img src={product.image_urls?.[0] || product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg></div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{i18n[lang]?.modalSizeGrade?.(product.size, product.grade) ?? `ไซส์ ${product.size} · Grade ${product.grade}`}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a", flexShrink: 0 }}>฿{Number(product.price).toLocaleString()}</div>
              <button onClick={() => { unreserveProduct(); setStep(0); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16, flexShrink: 0 }}>✕</button>
            </div>

            {/* Step bar */}
            <div style={{ padding: "14px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center" }}>
              {[t("stepAddr"), t("stepPay")].map((label, i) => (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i + 1 ? "#15803d" : step === i + 1 ? "#1e3a8a" : "#e2e8f0", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.3s" }}>
                      {step > i + 1
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? "#0f172a" : "#94a3b8" }}>{label}</span>
                  </div>
                  {i < 1 && <div style={{ flex: 1, height: 1, background: step > 1 ? "#1e3a8a" : "#e2e8f0", margin: "0 10px", transition: "background 0.3s" }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: "22px" }}>

              {/* STEP 1 — Address */}
              {step === 1 && (
                <>
                  {/* Countdown timer */}
                  {(() => {
                    const mins = Math.floor(timeLeft / 60);
                    const secs = String(timeLeft % 60).padStart(2, "0");
                    const urgent = timeLeft <= 60;
                    return (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: urgent ? "#fef2f2" : "#f0fdf4", border: `1px solid ${urgent ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: urgent ? "#dc2626" : "#15803d" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {urgent ? t("timerUrgent1") : t("timerNormal")}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: urgent ? "#dc2626" : "#15803d", fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
                          {mins}:{secs}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 13px", marginBottom: 18 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 600 }}>{t("escrowHoldNote")}</span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>{t("addressTitle")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label={`${t("addrFullName")} *`} value={addrForm.full_name} onChange={v => setAddrForm(p => ({ ...p, full_name: v }))} placeholder={t("addrFullNamePH")} />
                      <Field label={`${t("addrPhone")} *`} value={addrForm.phone} onChange={v => setAddrForm(p => ({ ...p, phone: v.replace(/\D/g, "") }))} inputMode="tel" maxLength={10} placeholder="0XXXXXXXXX" />
                    </div>
                    <Field label={`${t("addrAddress")} *`} value={addrForm.address} onChange={v => setAddrForm(p => ({ ...p, address: v }))} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label={t("addrSubdistrict")} value={addrForm.subdistrict} onChange={v => setAddrForm(p => ({ ...p, subdistrict: v }))} />
                      <Field label={t("addrDistrict")} value={addrForm.district} onChange={v => setAddrForm(p => ({ ...p, district: v }))} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label={t("addrProvince")} value={addrForm.province} onChange={v => setAddrForm(p => ({ ...p, province: v }))} />
                      <Field label={t("addrPostal")} value={addrForm.postal_code} onChange={v => setAddrForm(p => ({ ...p, postal_code: v.replace(/\D/g, "") }))} inputMode="numeric" maxLength={5} placeholder="XXXXX" />
                    </div>
                  </div>

                  <button onClick={confirmAddress}
                    style={{ width: "100%", marginTop: 18, padding: "14px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#172554"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>
                    {t("nextPayBtn")}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </>
              )}

              {/* STEP 2 — Payment */}
              {step === 2 && (
                <>
                  {/* Countdown timer */}
                  {(() => {
                    const mins = Math.floor(timeLeft / 60);
                    const secs = String(timeLeft % 60).padStart(2, "0");
                    const urgent = timeLeft <= 60;
                    return (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: urgent ? "#fef2f2" : "#f0fdf4", border: `1px solid ${urgent ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: urgent ? "#dc2626" : "#15803d" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {urgent ? t("timerUrgent2") : t("timerNormal")}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: urgent ? "#dc2626" : "#15803d", fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
                          {mins}:{secs}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Order summary */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "13px 15px", marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{t("orderSummaryLabel")}</div>
                    {[
                      [t("orderProductLabel"), product.name],
                      [t("orderShipToLabel"), `${addrForm.full_name} · ${addrForm.phone}`],
                      [t("orderAddrLabel"), [addrForm.address, addrForm.district, addrForm.province].filter(Boolean).join(", ")],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5, fontSize: 12 }}>
                        <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span>
                        <span style={{ fontWeight: 600, color: "#0f172a", textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t("totalLabel")}</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#1e3a8a" }}>฿{Number(product.price).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* QR */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 18px", marginBottom: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{t("scanQR")}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{t("scanQRSub")}</div>
                      </div>

                      {qrDataUrl ? (
                        <div style={{ padding: 10, background: "#fff", border: "2px solid #e2e8f0", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                          <img src={qrDataUrl} alt="PromptPay QR" style={{ width: 190, height: 190, display: "block" }} />
                        </div>
                      ) : (
                        <div style={{ width: 190, height: 190, background: "#f1f5f9", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", borderRadius: 99, padding: "7px 14px" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 700 }}>พร้อมเพย์ {PLATFORM_PROMPTPAY}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slip upload */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 7 }}>
                      {t("slipUploadLabel")} <span style={{ color: "#dc2626" }}>*</span>
                    </div>
                    <label style={{
                      display: "block", borderRadius: 12, cursor: "pointer", overflow: "hidden",
                      border: `2px dashed ${verifyStatus === "ok" ? "#15803d" : verifyStatus === "error" ? "#dc2626" : "#cbd5e1"}`,
                      background: verifyStatus === "ok" ? "#f0fdf4" : verifyStatus === "error" ? "#fef2f2" : "#fafafa",
                      transition: "all 0.2s",
                    }}>
                      {slipPreview ? (
                        <div style={{ position: "relative" }}>
                          <img src={slipPreview} alt="slip" style={{ width: "100%", maxHeight: 170, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>{t("changeSlipLabel")}</div>
                        </div>
                      ) : (
                        <div style={{ padding: "22px 16px", textAlign: "center" }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{t("slipUploadTitle")}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{t("slipAutoVerify")}</div>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleSlip} style={{ display: "none" }} />
                    </label>

                    {verifyStatus === "loading" && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b", padding: "9px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                        {t("slipBankVerifying")}
                      </div>
                    )}
                    {verifyStatus === "ok" && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 12px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {verifyMsg}
                      </div>
                    )}
                    {verifyStatus === "error" && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 12px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {verifyMsg}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setStep(1)}
                      style={{ padding: "12px 16px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                      {t("backBtn")}
                    </button>
                    <button onClick={handleOrder} disabled={ordering || verifyStatus !== "ok"}
                      style={{ flex: 1, padding: "12px", background: verifyStatus === "ok" ? "#1e3a8a" : "#e2e8f0", color: verifyStatus === "ok" ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: verifyStatus === "ok" ? "pointer" : "not-allowed", opacity: ordering ? 0.7 : 1 }}
                      onMouseEnter={e => { if (verifyStatus === "ok") e.currentTarget.style.background = "#172554"; }}
                      onMouseLeave={e => { if (verifyStatus === "ok") e.currentTarget.style.background = "#1e3a8a"; }}>
                      {ordering ? t("processingBtn") : verifyStatus === "ok" ? `${t("confirmOrderBtn")} →` : t("waitingSlip")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Success ── */}
      {step === 3 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,.2)", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
            <div style={{ background: "#15803d", padding: "30px 28px 26px", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#fff" }}>{t("orderSuccess")}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 5 }}>{t("escrowSafeMsg")}</div>
            </div>

            <div style={{ padding: "22px 26px 26px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t("orderNum")}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", wordBreak: "break-all", fontFamily: "monospace" }}>{orderId}</div>
              </div>

              <div style={{ marginBottom: 22 }}>
                {(i18n[lang]?.orderNextSteps ?? i18n.th.orderNextSteps).map(([title, desc], i) => (
                  <div key={i} style={{ display: "flex", gap: 11, marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{ width: 22, height: 22, background: "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#1e3a8a", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a href="/orders" style={{ flex: 1, padding: "13px", background: "#1e3a8a", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                  {t("viewOrders")}
                </a>
                <a href="/shop" style={{ flex: 1, padding: "13px", background: "#f1f5f9", color: "#374151", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                  {t("continueShopping")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sticky bottom bar — buy only ── */}
      <div className="rm-mobile-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e5e7eb", padding: "10px 16px", zIndex: 150, alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,.06)" }}>
        {isSold ? (
          <div style={{ flex: 1, padding: "13px", background: "#f1f5f9", color: "#94a3b8", borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
            {t("soldLabel")}
          </div>
        ) : (
          <button onClick={openCheckout}
            style={{ width: "100%", padding: "14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {t("buyBtn")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode, maxLength }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={e => e.target.style.borderColor = "#1e3a8a"}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
      />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
