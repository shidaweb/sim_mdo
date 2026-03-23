import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ComposedChart
} from "recharts";
import { Plus, Trash2, Calculator, Settings, BarChart3, Table, Filter, HelpCircle } from "lucide-react";

const createId = () => Math.random().toString(36).substr(2, 9);

// ── デフォルト値（全て税抜） ──────────────────────────
const defaultDrugs = [
  {
    id: createId(),
    name: "マンジャロ皮下注2.5mg",
    category: "ダイエット",
    plans: [
      { id: createId(), label: "月額プラン", planType: "subscription", commitmentMonths: 1, deliveryIntervalMonths: 1, drugCostPerDelivery: 6996, sellingPricePerDelivery: 18000, monthlyNewCustomers: 1000, retentionRate: 80 },
    ],
  },
  {
    id: createId(),
    name: "フィナステリド+ミノキシジル",
    category: "AGA",
    plans: [
      { id: createId(), label: "12ヶ月プラン", planType: "subscription", commitmentMonths: 12, deliveryIntervalMonths: 12, drugCostPerDelivery: 8400, sellingPricePerDelivery: 32400, monthlyNewCustomers: 3000, retentionRate: 70 },
      { id: createId(), label: "6ヶ月プラン", planType: "subscription", commitmentMonths: 6, deliveryIntervalMonths: 6, drugCostPerDelivery: 4200, sellingPricePerDelivery: 18000, monthlyNewCustomers: 0, retentionRate: 60 },
      { id: createId(), label: "3ヶ月プラン", planType: "subscription", commitmentMonths: 3, deliveryIntervalMonths: 3, drugCostPerDelivery: 2100, sellingPricePerDelivery: 12000, monthlyNewCustomers: 0, retentionRate: 50 },
      { id: createId(), label: "1ヶ月プラン", planType: "subscription", commitmentMonths: 1, deliveryIntervalMonths: 1, drugCostPerDelivery: 700, sellingPricePerDelivery: 6000, monthlyNewCustomers: 0, retentionRate: 40 },
    ],
  },
];

const defaultCosts = {
  doctorFee: 1000, onlineServerFee: 100, shippingLabor: 100, packaging: 300, deliveryFee: 800, paymentFeeRate: 3,
};

const defaultBusiness = {
  partnerRate: 50, platformFee: 300000, simulationMonths: 24,
};

// ── コホート会員数ヘルパー ───────────────────────────
function cohortActive(plan, month) {
  if (plan.monthlyNewCustomers <= 0) return 0;
  // 買い切りプランは購入月のみ存在し、翌月以降は会員数0
  if (plan.planType === "oneoff") return 0;
  let total = 0;
  for (let start = 1; start <= month; start++) {
    const age = month - start;
    let active;
    if (age < plan.commitmentMonths) {
      active = plan.monthlyNewCustomers;
    } else {
      const past = age - plan.commitmentMonths;
      active = plan.monthlyNewCustomers * Math.pow(plan.retentionRate / 100, past + 1);
    }
    if (active >= 0.5) total += active;
  }
  return total;
}

// ── シミュレーションエンジン（全て税抜計算） ──────────
function runSimulation(drugs, costs, business) {
  const N = business.simulationMonths;
  const results = [];

  for (let month = 1; month <= N; month++) {
    let totalRevenue = 0, totalDrugCost = 0, totalDeliveries = 0;
    let totalNewCust = 0, totalActiveEnd = 0, totalActivePrevEnd = 0;
    let totalNewSubOnly = 0;
    const drugDetails = {};

    for (const drug of drugs) {
      let dRevenue = 0, dDrugCost = 0, dDeliveries = 0;
      let dNew = 0, dActiveEnd = 0, dActivePrevEnd = 0;
      let dNewSubOnly = 0;

      for (const plan of drug.plans) {
        if (plan.monthlyNewCustomers <= 0) continue;

        // 新規獲得
        dNew += plan.monthlyNewCustomers;

        if (plan.planType === "oneoff") {
          // 買い切りプラン: 毎月の新規が購入月に1回だけ購入・配送
          // 会員数には加算しない（購入完了で離脱、解約ではない）
          dRevenue += plan.monthlyNewCustomers * plan.sellingPricePerDelivery;
          dDrugCost += plan.monthlyNewCustomers * plan.drugCostPerDelivery;
          dDeliveries += plan.monthlyNewCustomers;
          // activeEnd, activePrevEnd は加算しない（買い切りは会員にならない）
        } else {
          dNewSubOnly += plan.monthlyNewCustomers;
          // サブスクリプションプラン: 従来のコホート計算
          for (let start = 1; start <= month; start++) {
            const age = month - start;
            let active;
            if (age < plan.commitmentMonths) {
              active = plan.monthlyNewCustomers;
            } else {
              const past = age - plan.commitmentMonths;
              active = plan.monthlyNewCustomers * Math.pow(plan.retentionRate / 100, past + 1);
            }
            if (active < 0.5) continue;

            dActiveEnd += active;

            const hasDelivery = plan.deliveryIntervalMonths === 0 ? age === 0 : age % plan.deliveryIntervalMonths === 0;
            if (hasDelivery) {
              dRevenue += active * plan.sellingPricePerDelivery;
              dDrugCost += active * plan.drugCostPerDelivery;
              dDeliveries += active;
            }
          }

          // 前月末の会員数（サブスクのみ）
          if (month > 1) {
            dActivePrevEnd += cohortActive(plan, month - 1);
          }
        }
      }

      totalRevenue += dRevenue;
      totalDrugCost += dDrugCost;
      totalDeliveries += dDeliveries;
      totalNewCust += dNew;
      totalActiveEnd += dActiveEnd;
      totalActivePrevEnd += dActivePrevEnd;
      totalNewSubOnly += dNewSubOnly;

      drugDetails[drug.id] = {
        revenue: dRevenue, drugCost: dDrugCost, deliveries: dDeliveries,
        category: drug.category, name: drug.name,
        newCustomers: dNew, activeEnd: dActiveEnd, activePrevEnd: dActivePrevEnd,
        newSubOnly: dNewSubOnly,
      };
    }

    // 解約数 = 前月末会員 + 今月新規(サブスクのみ) - 今月末会員
    // 買い切り顧客は会員にならないので解約計算から除外
    const churnCount = totalActivePrevEnd + totalNewSubOnly - totalActiveEnd;
    const churnDenom = totalActivePrevEnd + totalNewSubOnly;
    const churnRate = churnDenom > 0 ? (churnCount / churnDenom) * 100 : 0;

    const perConsult = costs.doctorFee + costs.onlineServerFee;
    const perShip = costs.shippingLabor + costs.packaging + costs.deliveryFee;
    const consultationCost = totalDeliveries * perConsult;
    const shippingCost = totalDeliveries * perShip;
    const paymentFee = totalRevenue * (costs.paymentFeeRate / 100);
    const totalCogs = totalDrugCost + consultationCost + shippingCost + paymentFee;
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const platformFee = business.platformFee;
    const partnerShare = grossProfit * (business.partnerRate / 100) - platformFee;
    const operatingProfit = grossProfit - platformFee;
    const prev = results.length > 0 ? results[results.length - 1].cumulativeProfit : 0;

    results.push({
      month, revenue: totalRevenue, drugCost: totalDrugCost,
      consultationCost, shippingCost, paymentFee, totalCogs,
      grossProfit, grossMargin, platformFee, operatingProfit, partnerShare,
      deliveries: Math.round(totalDeliveries),
      cumulativeProfit: prev + partnerShare, drugDetails,
      newCustomers: Math.round(totalNewCust),
      newSubOnly: Math.round(totalNewSubOnly),
      newOneoff: Math.round(totalNewCust - totalNewSubOnly),
      activeEnd: Math.round(totalActiveEnd),
      churnCount: Math.round(churnCount),
      churnRate,
    });
  }
  return results;
}

// カテゴリ別にフィルタした結果を計算
function filterResultsByCategory(allResults, drugs, category, costs, business) {
  if (!category) return allResults; // 全カテゴリ

  const catDrugIds = new Set(drugs.filter((d) => d.category === category).map((d) => d.id));
  const filtered = [];

  for (const r of allResults) {
    let revenue = 0, drugCost = 0, deliveries = 0;
    let newCustomers = 0, activeEnd = 0, activePrevEnd = 0, newSubOnly = 0;

    for (const [id, detail] of Object.entries(r.drugDetails)) {
      if (catDrugIds.has(id)) {
        revenue += detail.revenue;
        drugCost += detail.drugCost;
        deliveries += detail.deliveries;
        newCustomers += detail.newCustomers;
        activeEnd += detail.activeEnd;
        activePrevEnd += detail.activePrevEnd;
        newSubOnly += detail.newSubOnly || 0;
      }
    }

    const churnCount = activePrevEnd + newSubOnly - activeEnd;
    const churnDenom = activePrevEnd + newSubOnly;
    const churnRate = churnDenom > 0 ? (churnCount / churnDenom) * 100 : 0;

    const perConsult = costs.doctorFee + costs.onlineServerFee;
    const perShip = costs.shippingLabor + costs.packaging + costs.deliveryFee;
    const consultationCost = deliveries * perConsult;
    const shippingCost = deliveries * perShip;
    const paymentFee = revenue * (costs.paymentFeeRate / 100);
    const totalCogs = drugCost + consultationCost + shippingCost + paymentFee;
    const grossProfit = revenue - totalCogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const revenueRatio = r.revenue > 0 ? revenue / r.revenue : 0;
    const platformFee = business.platformFee * revenueRatio;
    const partnerShare = grossProfit * (business.partnerRate / 100) - platformFee;
    const operatingProfit = grossProfit - platformFee;
    const prev = filtered.length > 0 ? filtered[filtered.length - 1].cumulativeProfit : 0;

    const newOneoff = newCustomers - newSubOnly;
    filtered.push({
      month: r.month, revenue, drugCost, consultationCost, shippingCost, paymentFee,
      totalCogs, grossProfit, grossMargin, platformFee, operatingProfit, partnerShare,
      deliveries: Math.round(deliveries), cumulativeProfit: prev + partnerShare,
      drugDetails: r.drugDetails,
      newCustomers: Math.round(newCustomers),
      newSubOnly: Math.round(newSubOnly),
      newOneoff: Math.round(newOneoff),
      activeEnd: Math.round(activeEnd),
      churnCount: Math.round(churnCount),
      churnRate,
    });
  }
  return filtered;
}

// ── フォーマッタ ─────────────────────────────────────
const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 100000000) return (n < 0 ? "-" : "") + (Math.abs(n) / 100000000).toFixed(1) + "億";
  if (abs >= 10000) return Math.round(n / 10000).toLocaleString() + "万";
  return Math.round(n).toLocaleString();
};
const fmtSen = (n) => { if (n === undefined || isNaN(n)) return "-"; return Math.round(n / 1000).toLocaleString(); };
const fmtYen = (n) => { if (n === undefined || isNaN(n)) return "-"; return Math.round(n).toLocaleString(); };
const fmtPct = (n) => { if (n === undefined || isNaN(n)) return "-"; return n.toFixed(1) + "%"; };

const InputField = ({ label, value, onChange, suffix, type = "number" }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
    <div className="flex items-center gap-1">
      <input type={type} value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        style={{ minWidth: 80 }} />
      {suffix && <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>}
    </div>
  </div>
);

// ── カテゴリフィルタ ピルボタン ──────────────────────
const CategoryFilter = ({ categories, selected, onSelect }) => (
  <div className="flex items-center gap-2 mb-4">
    <Filter className="w-3.5 h-3.5 text-gray-400" />
    <span className="text-xs text-gray-500 font-medium">カテゴリ:</span>
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selected === null
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        全カテゴリ
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === cat
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  </div>
);

// ── メインコンポーネント ────────────────────────────
export default function MDOnlineSimulator() {
  const [drugs, setDrugs] = useState(defaultDrugs);
  const [costs, setCosts] = useState(defaultCosts);
  const [business, setBusiness] = useState(defaultBusiness);
  const [activeTab, setActiveTab] = useState("settings");
  const [expandedDrug, setExpandedDrug] = useState(defaultDrugs[0]?.id);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = 全カテゴリ

  // ユニークなカテゴリ一覧
  const categories = useMemo(() => {
    const cats = [...new Set(drugs.map((d) => d.category).filter(Boolean))];
    return cats.sort();
  }, [drugs]);

  // 全カテゴリの結果
  const allResults = useMemo(() => runSimulation(drugs, costs, business), [drugs, costs, business]);

  // フィルタ済み結果
  const results = useMemo(
    () => filterResultsByCategory(allResults, drugs, selectedCategory, costs, business),
    [allResults, drugs, selectedCategory, costs, business]
  );

  const summary = useMemo(() => {
    if (!results.length) return {};
    const last = results[results.length - 1];
    const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
    const totalProfit = results.reduce((s, r) => s + r.partnerShare, 0);
    const totalDeliveries = results.reduce((s, r) => s + r.deliveries, 0);
    const avgMargin = results.reduce((s, r) => s + r.grossMargin, 0) / results.length;
    const breakEven = results.findIndex((r) => r.cumulativeProfit > 0) + 1;
    return { totalRevenue, totalProfit, totalDeliveries, avgMargin, breakEven, last };
  }, [results]);

  const updateDrug = useCallback((drugId, updater) => {
    setDrugs((prev) => prev.map((d) => (d.id === drugId ? updater(d) : d)));
  }, []);

  const updatePlan = useCallback((drugId, planId, field, value) => {
    updateDrug(drugId, (d) => ({
      ...d,
      plans: d.plans.map((p) => (p.id === planId ? { ...p, [field]: value } : p)),
    }));
  }, [updateDrug]);

  const addDrug = () => {
    const nd = {
      id: createId(), name: "新しい薬剤", category: "新カテゴリ",
      plans: [{ id: createId(), label: "月額プラン", planType: "subscription", commitmentMonths: 1, deliveryIntervalMonths: 1, drugCostPerDelivery: 0, sellingPricePerDelivery: 0, monthlyNewCustomers: 0, retentionRate: 80 }],
    };
    setDrugs((prev) => [...prev, nd]);
    setExpandedDrug(nd.id);
  };

  const addPlan = (drugId) => {
    updateDrug(drugId, (d) => ({
      ...d,
      plans: [...d.plans, { id: createId(), label: "新プラン", planType: "subscription", commitmentMonths: 1, deliveryIntervalMonths: 1, drugCostPerDelivery: 0, sellingPricePerDelivery: 0, monthlyNewCustomers: 0, retentionRate: 80 }],
    }));
  };

  const tabs = [
    { id: "settings", label: "設定", icon: Settings },
    { id: "results", label: "月次P&L", icon: Table },
    { id: "charts", label: "グラフ", icon: BarChart3 },
  ];

  const chartData = results.map((r) => ({
    month: r.month + "月",
    "売上(税抜)": Math.round(r.revenue / 1000),
    "粗利益(税抜)": Math.round(r.grossProfit / 1000),
    "パートナー利益(税抜)": Math.round(r.partnerShare / 1000),
    "累積利益(税抜)": Math.round(r.cumulativeProfit / 1000),
    粗利率: Number(r.grossMargin.toFixed(1)),
    配送数: r.deliveries,
    新規獲得: r.newCustomers,
    "うちサブスク新規": r.newSubOnly,
    "うち買切購入": r.newOneoff,
    解約数: r.churnCount,
    月末会員数: r.activeEnd,
    "解約率(%)": Number(r.churnRate.toFixed(1)),
  }));

  const perDeliveryTotal = costs.doctorFee + costs.onlineServerFee + costs.shippingLabor + costs.packaging + costs.deliveryFee;
  const categoryLabel = selectedCategory || "全カテゴリ";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-blue-600 text-white rounded-lg p-2 shrink-0"><Calculator className="w-5 h-5" /></div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-800">MDオンライン 収益シミュレータ</h1>
                <p className="text-xs text-gray-500">オンライン診療 サブスク＆買い切り 収益モデル ※全て税抜表示</p>
              </div>
            </div>
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <HelpCircle className="w-4 h-4" />
              ヘルプ
            </Link>
          </div>
        </div>

        {/* カテゴリフィルタ（常時表示） */}
        <div className="px-6 pt-4">
          <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {/* KPI Cards */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {[
            { label: `累計売上(税抜)`, value: fmt(summary.totalRevenue), sub: `${categoryLabel} / ${business.simulationMonths}ヶ月`, color: "#2563eb" },
            { label: `累計パートナー利益(税抜)`, value: fmt(summary.totalProfit), sub: `分配率${business.partnerRate}%`, color: "#16a34a" },
            { label: "平均粗利率", value: fmtPct(summary.avgMargin), sub: "税抜ベース", color: "#9333ea" },
            { label: "累計配送数", value: summary.totalDeliveries?.toLocaleString(), sub: "件", color: "#ea580c" },
            { label: `最終月売上(税抜)`, value: fmt(summary.last?.revenue), sub: "/月", color: "#4f46e5" },
            { label: "黒字化", value: summary.breakEven > 0 ? summary.breakEven + "ヶ月目" : "未達", sub: "累積利益ベース", color: "#0d9488" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-lg border p-3">
              <div className="text-xs text-gray-500">{kpi.label}</div>
              <div className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value || "-"}</div>
              <div className="text-xs text-gray-400">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          {/* ===== 設定タブ ===== */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-700">薬剤・プラン設定 ※金額は全て税抜</h2>
                  <button onClick={addDrug} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-3 h-3" /> 薬剤追加
                  </button>
                </div>
                <div className="space-y-3">
                  {drugs.map((drug) => (
                    <div key={drug.id} className="bg-white border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedDrug(expandedDrug === drug.id ? null : drug.id)}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{drug.name}</span>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{drug.category || "未分類"}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{drug.plans.length}プラン</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setDrugs((p) => p.filter((d) => d.id !== drug.id)); }} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-gray-400 text-xs">{expandedDrug === drug.id ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {expandedDrug === drug.id && (
                        <div className="border-t px-4 py-3 space-y-3">
                          <div className="flex gap-3">
                            <InputField label="薬剤名" value={drug.name} onChange={(v) => updateDrug(drug.id, (d) => ({ ...d, name: v }))} type="text" />
                            <InputField label="カテゴリ" value={drug.category} onChange={(v) => updateDrug(drug.id, (d) => ({ ...d, category: v }))} type="text" />
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1.5 px-1 text-gray-500 font-medium">プラン名</th>
                                  <th className="text-center py-1.5 px-1 text-gray-500 font-medium">種別</th>
                                  <th className="text-right py-1.5 px-1 text-gray-500 font-medium">コミット<br/>期間</th>
                                  <th className="text-right py-1.5 px-1 text-gray-500 font-medium">配送<br/>間隔</th>
                                  <th className="text-right py-1.5 px-1 text-gray-500 font-medium">薬価<br/>(税抜)</th>
                                  <th className="text-right py-1.5 px-1 text-gray-500 font-medium">売価<br/>(税抜)</th>
                                  <th className="text-right py-1.5 px-1 text-gray-500 font-medium">月間<br/>新規</th>
                                  <th className="text-right py-1.5 px-1 text-gray-500 font-medium">継続率</th>
                                  <th className="w-16"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {drug.plans.map((plan) => {
                                  const isOneoff = plan.planType === "oneoff";
                                  const margin = plan.sellingPricePerDelivery > 0
                                    ? ((plan.sellingPricePerDelivery - plan.drugCostPerDelivery) / plan.sellingPricePerDelivery * 100).toFixed(1) : "-";
                                  return (
                                    <tr key={plan.id} className="border-b border-gray-100">
                                      <td className="py-1.5 px-1">
                                        <input type="text" value={plan.label} onChange={(e) => updatePlan(drug.id, plan.id, "label", e.target.value)}
                                          className="border border-gray-200 rounded px-1.5 py-0.5 w-24 text-xs" />
                                      </td>
                                      <td className="py-1.5 px-1 text-center">
                                        <select value={plan.planType || "subscription"} onChange={(e) => updatePlan(drug.id, plan.id, "planType", e.target.value)}
                                          className="border border-gray-200 rounded px-1 py-0.5 text-xs bg-white">
                                          <option value="subscription">月額</option>
                                          <option value="oneoff">買切</option>
                                        </select>
                                      </td>
                                      <td className="py-1.5 px-1 text-right">
                                        {isOneoff ? (
                                          <span className="text-xs text-gray-300">-</span>
                                        ) : (
                                          <div className="flex items-center justify-end gap-0.5">
                                            <input type="number" value={plan.commitmentMonths} onChange={(e) => updatePlan(drug.id, plan.id, "commitmentMonths", Number(e.target.value))}
                                              className="border border-gray-200 rounded px-1.5 py-0.5 w-14 text-xs text-right" /><span className="text-gray-400">月</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-1 text-right">
                                        {isOneoff ? (
                                          <span className="text-xs text-gray-300">-</span>
                                        ) : (
                                          <div className="flex items-center justify-end gap-0.5">
                                            <input type="number" value={plan.deliveryIntervalMonths} onChange={(e) => updatePlan(drug.id, plan.id, "deliveryIntervalMonths", Number(e.target.value))}
                                              className="border border-gray-200 rounded px-1.5 py-0.5 w-14 text-xs text-right" /><span className="text-gray-400">月毎</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-1 text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                          <input type="number" value={plan.drugCostPerDelivery} onChange={(e) => updatePlan(drug.id, plan.id, "drugCostPerDelivery", Number(e.target.value))}
                                            className="border border-gray-200 rounded px-1.5 py-0.5 w-20 text-xs text-right text-blue-600 font-medium" /><span className="text-gray-400">円</span>
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-1 text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                          <input type="number" value={plan.sellingPricePerDelivery} onChange={(e) => updatePlan(drug.id, plan.id, "sellingPricePerDelivery", Number(e.target.value))}
                                            className="border border-gray-200 rounded px-1.5 py-0.5 w-20 text-xs text-right text-blue-600 font-medium" /><span className="text-gray-400">円</span>
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-1 text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                          <input type="number" value={plan.monthlyNewCustomers} onChange={(e) => updatePlan(drug.id, plan.id, "monthlyNewCustomers", Number(e.target.value))}
                                            className="border border-gray-200 rounded px-1.5 py-0.5 w-16 text-xs text-right text-blue-600 font-medium" /><span className="text-gray-400">人</span>
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-1 text-right">
                                        {isOneoff ? (
                                          <span className="text-xs text-gray-300">-</span>
                                        ) : (
                                          <div className="flex items-center justify-end gap-0.5">
                                            <input type="number" value={plan.retentionRate} onChange={(e) => updatePlan(drug.id, plan.id, "retentionRate", Number(e.target.value))}
                                              className="border border-gray-200 rounded px-1.5 py-0.5 w-14 text-xs text-right text-blue-600 font-medium" /><span className="text-gray-400">%</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-1 text-center">
                                        <span className="text-xs text-gray-400">粗利{margin}%</span><br />
                                        <button onClick={() => updateDrug(drug.id, (d) => ({ ...d, plans: d.plans.filter((p) => p.id !== plan.id) }))}
                                          className="text-gray-300 hover:text-red-500 mt-0.5"><Trash2 className="w-3 h-3" /></button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <button onClick={() => addPlan(drug.id)} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                            <Plus className="w-3 h-3" /> プラン追加
                          </button>
                          <div className="bg-gray-50 rounded p-2 text-xs text-gray-500 space-y-0.5">
                            <p><strong>種別</strong>: 月額＝サブスクリプション（継続課金）/ 買切＝1回購入のみ（継続率・コミット期間なし）</p>
                            <p><strong>コミット期間</strong>: （月額のみ）この期間中は継続率100%（解約なし）</p>
                            <p><strong>配送間隔</strong>: （月額のみ）1=毎月配送, 3=3ヶ月毎, 12=年1回配送</p>
                            <p><strong>継続率</strong>: （月額のみ）コミット期間終了後の月次継続率</p>
                            <p><strong>薬価・売価</strong>: 1回の配送（購入）あたりの金額（税抜）</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-1">診療込オペレーションコスト設定（1配送あたり・税抜）</h2>
                <p className="text-xs text-gray-500 mb-3">診療込オペレーション頻度: <strong>上記の配送間隔の都度</strong>（全配送でオンライン診療を実施する前提で計算）</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-2">診察・システム（税抜）</h3>
                    <div className="space-y-2">
                      <InputField label="医師人件費(税抜)" value={costs.doctorFee} onChange={(v) => setCosts((c) => ({ ...c, doctorFee: v }))} suffix="円/件" />
                      <InputField label="オンラインサーバー利用料(税抜)" value={costs.onlineServerFee} onChange={(v) => setCosts((c) => ({ ...c, onlineServerFee: v }))} suffix="円/件" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-2">配送（税抜）</h3>
                    <div className="space-y-2">
                      <InputField label="配送作業費(税抜)" value={costs.shippingLabor} onChange={(v) => setCosts((c) => ({ ...c, shippingLabor: v }))} suffix="円/件" />
                      <InputField label="包装・箱代(税抜)" value={costs.packaging} onChange={(v) => setCosts((c) => ({ ...c, packaging: v }))} suffix="円/件" />
                      <InputField label="配送料(税抜)" value={costs.deliveryFee} onChange={(v) => setCosts((c) => ({ ...c, deliveryFee: v }))} suffix="円/件" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-2">決済</h3>
                    <InputField label="決済手数料率" value={costs.paymentFeeRate} onChange={(v) => setCosts((c) => ({ ...c, paymentFeeRate: v }))} suffix="%" />
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  1配送あたりのオペコスト合計(税抜): <strong>{fmtYen(perDeliveryTotal)}円</strong>
                  （診察 {fmtYen(costs.doctorFee + costs.onlineServerFee)}円 + 配送 {fmtYen(costs.shippingLabor + costs.packaging + costs.deliveryFee)}円）
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3">ビジネス設定</h2>
                <div className="grid grid-cols-3 gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <InputField label="パートナー分配率" value={business.partnerRate} onChange={(v) => setBusiness((b) => ({ ...b, partnerRate: v }))} suffix="%" />
                  <InputField label="プラットフォーム利用料(税抜)" value={business.platformFee} onChange={(v) => setBusiness((b) => ({ ...b, platformFee: v }))} suffix="円/月" />
                  <InputField label="シミュレーション期間" value={business.simulationMonths} onChange={(v) => setBusiness((b) => ({ ...b, simulationMonths: Math.min(60, Math.max(1, v)) }))} suffix="ヶ月" />
                </div>
              </div>
            </div>
          )}

          {/* ===== 月次P&Lタブ ===== */}
          {activeTab === "results" && (
            <div>
              {selectedCategory && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  カテゴリ「<strong>{selectedCategory}</strong>」のみ表示中。PF利用料は全体売上比率で按分しています。
                </div>
              )}
              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 sticky left-0 bg-gray-50" style={{ minWidth: 170 }}>
                        項目（税抜・千円）{selectedCategory ? ` [${selectedCategory}]` : ""}
                      </th>
                      {results.map((r) => (
                        <th key={r.month} className="text-right py-2 px-2 font-medium text-gray-600 whitespace-nowrap" style={{ minWidth: 72 }}>
                          {r.month}月目
                        </th>
                      ))}
                      <th className="text-right py-2 px-3 font-bold text-gray-700 bg-blue-50" style={{ minWidth: 85 }}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "売上高(税抜)", key: "revenue", bold: true, color: "#2563eb" },
                      { label: "  薬剤原価(税抜)", key: "drugCost" },
                      { label: "  診察・システム費(税抜)", key: "consultationCost" },
                      { label: "  配送費(税抜)", key: "shippingCost" },
                      { label: "  決済手数料", key: "paymentFee" },
                      { label: "売上原価計(税抜)", key: "totalCogs", bold: true },
                      { label: "粗利益(税抜)", key: "grossProfit", bold: true, color: "#16a34a" },
                      { label: "（粗利率）", key: "grossMargin", isPct: true },
                      { label: "PF利用料(税抜)", key: "platformFee" },
                      { label: "営業利益(税抜)", key: "operatingProfit", bold: true },
                      { label: "パートナー分配額(税抜)", key: "partnerShare", bold: true, color: "#9333ea" },
                      { label: "累積パートナー利益(税抜)", key: "cumulativeProfit", bold: true, color: "#0d9488" },
                      { label: "配送数(件)", key: "deliveries", isCount: true },
                      { label: "", key: "_sep1", isSep: true },
                      { label: "新規獲得数(人)", key: "newCustomers", isCount: true, bold: true, color: "#2563eb" },
                      { label: "  うちサブスク新規", key: "newSubOnly", isCount: true },
                      { label: "  うち買い切り購入", key: "newOneoff", isCount: true },
                      { label: "解約数(人)", key: "churnCount", isCount: true, bold: true, color: "#dc2626" },
                      { label: "解約率", key: "churnRate", isPct: true, bold: true },
                      { label: "月末会員数(人)", key: "activeEnd", isCount: true, bold: true, color: "#0d9488" },
                    ].map((row) => {
                      if (row.isSep) return (
                        <tr key={row.key} className="border-t-2 border-gray-300">
                          <td className="py-1 px-3 sticky left-0 bg-gray-100 text-xs font-bold text-gray-600" colSpan={1}>会員数推移</td>
                          <td colSpan={results.length + 1} className="bg-gray-100"></td>
                        </tr>
                      );
                      const isLastVal = row.key === "cumulativeProfit" || row.key === "activeEnd";
                      const isAvgPct = row.isPct;
                      const totalVal = isLastVal
                        ? results[results.length - 1]?.[row.key]
                        : isAvgPct
                        ? results.reduce((s, r) => s + r[row.key], 0) / results.length
                        : results.reduce((s, r) => s + r[row.key], 0);
                      return (
                        <tr key={row.key} className={`border-t ${row.bold ? "bg-gray-50" : ""}`}>
                          <td className={`py-1.5 px-3 sticky left-0 whitespace-nowrap ${row.bold ? "font-bold bg-gray-50" : "bg-white"}`}
                            style={{ color: row.color || "inherit" }}>{row.label}</td>
                          {results.map((r) => (
                            <td key={r.month}
                              className={`text-right py-1.5 px-2 tabular-nums ${row.bold ? "font-medium" : ""}`}
                              style={{ color: row.isPct ? "#6b7280" : r[row.key] < 0 ? "#dc2626" : "inherit" }}>
                              {row.isPct ? fmtPct(r[row.key]) : row.isCount ? r[row.key].toLocaleString() : fmtSen(r[row.key])}
                            </td>
                          ))}
                          <td className={`text-right py-1.5 px-3 bg-blue-50 ${row.bold ? "font-bold" : "font-medium"}`}>
                            {isAvgPct
                              ? fmtPct(totalVal)
                              : row.isCount
                              ? Math.round(totalVal).toLocaleString()
                              : fmtSen(totalVal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== グラフタブ ===== */}
          {activeTab === "charts" && (
            <div className="space-y-6">
              {selectedCategory && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  カテゴリ「<strong>{selectedCategory}</strong>」のみ表示中
                </div>
              )}

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  月次 売上 / 粗利益 / パートナー利益（税抜・千円）{selectedCategory ? ` [${selectedCategory}]` : ""}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, name) => [v.toLocaleString() + "千円", name]} contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="売上(税抜)" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="粗利益(税抜)" fill="#86efac" radius={[2, 2, 0, 0]} />
                    <Line dataKey="パートナー利益(税抜)" stroke="#9333ea" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  累積パートナー利益（税抜・千円）{selectedCategory ? ` [${selectedCategory}]` : ""}
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, name) => [v.toLocaleString() + "千円", name]} contentStyle={{ fontSize: 12 }} />
                    <Line dataKey="累積利益(税抜)" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">粗利率推移（税抜ベース %）{selectedCategory ? ` [${selectedCategory}]` : ""}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v + "%", "粗利率"]} contentStyle={{ fontSize: 12 }} />
                    <Line dataKey="粗利率" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">月間配送数（件）{selectedCategory ? ` [${selectedCategory}]` : ""}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v.toLocaleString() + "件", "配送数"]} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="配送数" fill="#fdba74" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">会員数推移（人）{selectedCategory ? ` [${selectedCategory}]` : ""}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 'auto']} unit="%" />
                    <Tooltip formatter={(v, name) => {
                      if (name === "解約率(%)") return [v + "%", name];
                      return [v.toLocaleString() + "人", name];
                    }} contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="新規獲得" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="left" dataKey="解約数" fill="#fca5a5" radius={[2, 2, 0, 0]} />
                    <Line yAxisId="left" dataKey="月末会員数" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 2 }} />
                    <Line yAxisId="right" dataKey="解約率(%)" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}