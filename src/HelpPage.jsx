import { Link } from "react-router-dom";
import { Calculator, ArrowLeft, BookOpen } from "lucide-react";

/** 全体のデータの流れ（入力 → 計算 → 出力） */
function FlowDiagram() {
  return (
    <svg viewBox="0 0 720 280" className="w-full h-auto max-w-3xl mx-auto" role="img" aria-labelledby="flow-title">
      <title id="flow-title">入力・計算・出力の流れ</title>
      <defs>
        <linearGradient id="gIn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
        <linearGradient id="gMid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="gOut" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
      </defs>
      <rect x="8" y="20" width="200" height="220" rx="12" fill="url(#gIn)" stroke="#3b82f6" strokeWidth="2" />
      <text x="108" y="48" textAnchor="middle" className="fill-slate-800 text-[13px] font-bold" style={{ fontSize: "14px" }}>① 入力エリア</text>
      <text x="108" y="72" textAnchor="middle" className="fill-slate-600" style={{ fontSize: "11px" }}>「設定」タブ内</text>
      <rect x="28" y="88" width="160" height="28" rx="4" fill="white" stroke="#93c5fd" />
      <text x="108" y="107" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">薬剤名・カテゴリ・プラン表</text>
      <rect x="28" y="124" width="160" height="28" rx="4" fill="white" stroke="#93c5fd" />
      <text x="108" y="143" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">診療込オペコスト（円/件）</text>
      <rect x="28" y="160" width="160" height="28" rx="4" fill="white" stroke="#93c5fd" />
      <text x="108" y="179" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">ビジネス設定（分配率・PF料）</text>
      <text x="108" y="210" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-500">※金額はすべて税抜</text>

      <line x1="218" y1="130" x2="268" y2="130" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

      <rect x="268" y="60" width="184" height="160" rx="12" fill="url(#gMid)" stroke="#d97706" strokeWidth="2" />
      <text x="360" y="92" textAnchor="middle" className="fill-slate-800 font-bold" style={{ fontSize: "14px" }}>② シミュレーション</text>
      <text x="360" y="118" textAnchor="middle" className="fill-slate-600" style={{ fontSize: "11px" }}>コホート・配送・P&amp;L</text>
      <text x="360" y="148" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">月次で売上・原価・会員数を計算</text>
      <text x="360" y="172" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">入力を変えると即反映</text>

      <line x1="452" y1="130" x2="502" y2="130" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

      <rect x="502" y="20" width="210" height="220" rx="12" fill="url(#gOut)" stroke="#059669" strokeWidth="2" />
      <text x="607" y="48" textAnchor="middle" className="fill-slate-800 font-bold" style={{ fontSize: "14px" }}>③ 出力エリア</text>
      <text x="607" y="72" textAnchor="middle" className="fill-slate-600" style={{ fontSize: "11px" }}>画面上部〜各タブ</text>
      <rect x="522" y="88" width="170" height="24" rx="4" fill="white" stroke="#34d399" />
      <text x="607" y="104" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">KPIカード（累計売上など）</text>
      <rect x="522" y="120" width="170" height="24" rx="4" fill="white" stroke="#34d399" />
      <text x="607" y="136" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">月次P&amp;L 表（千円）</text>
      <rect x="522" y="152" width="170" height="24" rx="4" fill="white" stroke="#34d399" />
      <text x="607" y="168" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">グラフタブ（推移チャート）</text>
      <rect x="522" y="184" width="170" height="24" rx="4" fill="white" stroke="#34d399" />
      <text x="607" y="200" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-700">カテゴリで絞り込み可</text>
    </svg>
  );
}

/** 設定タブの画面イメージ（概念的な図） */
function SettingsMockIllustration() {
  return (
    <svg viewBox="0 0 640 320" className="w-full h-auto rounded-lg border border-slate-200 bg-slate-50" role="img" aria-labelledby="set-mock-title">
      <title id="set-mock-title">設定タブの入力ブロック概念図</title>
      <rect x="8" y="8" width="624" height="36" rx="6" fill="#fff" stroke="#e2e8f0" />
      <text x="20" y="32" style={{ fontSize: "12px" }} className="fill-slate-700 font-bold">薬剤・プラン設定</text>
      <rect x="8" y="52" width="300" height="120" rx="8" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="20" y="76" style={{ fontSize: "11px" }} className="fill-blue-700 font-semibold">プラン行の入力</text>
      <line x1="20" y1="88" x2="288" y2="88" stroke="#e2e8f0" />
      <text x="24" y="108" style={{ fontSize: "9px" }} className="fill-slate-600">薬価・売価 … 1配送あたり（税抜）</text>
      <text x="24" y="124" style={{ fontSize: "9px" }} className="fill-slate-600">月間新規 … そのプランに入る人数/月</text>
      <text x="24" y="140" style={{ fontSize: "9px" }} className="fill-slate-600">継続率 … コミット後の月次継続（月額のみ）</text>
      <text x="24" y="156" style={{ fontSize: "9px" }} className="fill-slate-600">配送間隔 … Nヶ月毎に1回配送として計上</text>

      <rect x="332" y="52" width="300" height="120" rx="8" fill="#fff" stroke="#8b5cf6" strokeWidth="1.5" />
      <text x="344" y="76" style={{ fontSize: "11px" }} className="fill-violet-800 font-semibold">オペコスト・ビジネス</text>
      <line x1="344" y1="88" x2="620" y2="88" stroke="#e2e8f0" />
      <text x="348" y="108" style={{ fontSize: "9px" }} className="fill-slate-600">医師・サーバー・配送・包装・決済%</text>
      <text x="348" y="124" style={{ fontSize: "9px" }} className="fill-slate-600">→ 配送1件ごとに原価へ加算</text>
      <text x="348" y="144" style={{ fontSize: "9px" }} className="fill-slate-600">分配率・PF月額・シミュレーション月数</text>

      <rect x="8" y="188" width="624" height="120" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeDasharray="4 2" />
      <text x="20" y="214" style={{ fontSize: "11px" }} className="fill-emerald-800 font-semibold">出力につながるイメージ</text>
      <text x="20" y="236" style={{ fontSize: "10px" }} className="fill-slate-700">薬価・売価・新規・継続 → 売上・粗利・会員数</text>
      <text x="20" y="254" style={{ fontSize: "10px" }} className="fill-slate-700">オペコスト → 診察費・配送費・決済手数料として P&amp;L に反映</text>
      <text x="20" y="272" style={{ fontSize: "10px" }} className="fill-slate-700">分配率・PF → パートナー利益・累積利益</text>
      <text x="20" y="292" style={{ fontSize: "10px" }} className="fill-slate-500">シミュレーション月数 → 表・グラフの横軸の長さ</text>
    </svg>
  );
}

/** タブと出力の対応図 */
function TabsDiagram() {
  return (
    <svg viewBox="0 0 560 200" className="w-full h-auto" role="img" aria-labelledby="tabs-title">
      <title id="tabs-title">タブと出力の対応</title>
      <rect x="10" y="30" width="120" height="40" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
      <text x="70" y="56" textAnchor="middle" style={{ fontSize: "12px" }} className="fill-blue-800 font-bold">設定</text>
      <text x="70" y="100" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-600">数値を入力</text>

      <rect x="150" y="30" width="120" height="40" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
      <text x="210" y="56" textAnchor="middle" style={{ fontSize: "12px" }} className="fill-green-800 font-bold">月次P&amp;L</text>
      <text x="210" y="100" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-600">月ごとの表（千円）</text>

      <rect x="290" y="30" width="120" height="40" rx="8" fill="#faf5ff" stroke="#9333ea" strokeWidth="2" />
      <text x="350" y="56" textAnchor="middle" style={{ fontSize: "12px" }} className="fill-violet-800 font-bold">グラフ</text>
      <text x="350" y="100" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-600">推移を可視化</text>

      <path d="M 70 75 L 70 115 L 210 115 L 210 75" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M 210 75 L 210 115 L 350 115 L 350 75" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />

      <text x="280" y="140" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-500">※ 上部のカテゴリフィルタは「月次P&amp;L」「グラフ」に反映</text>
      <text x="280" y="162" textAnchor="middle" style={{ fontSize: "10px" }} className="fill-slate-500">※ KPIカードは常に上部に表示（全カテゴリ or カテゴリ別）</text>
    </svg>
  );
}

function Section({ title, children, id }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white rounded-lg p-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">使い方（HOW TO）</h1>
                <p className="text-xs text-gray-500">MDオンライン収益シミュレータ — 入力と出力の対応図</p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              シミュレータに戻る
            </Link>
          </div>
        </header>

        <div className="px-6 py-8 space-y-12 max-w-4xl mx-auto">
          <p className="text-sm text-slate-600 leading-relaxed">
            このページでは、画面上の<strong>どこに何を入れる</strong>と、<strong>どこにどんな結果が出る</strong>かを、図で整理しています。
            数値はすべて<strong>税抜</strong>です。
          </p>

          <Section title="全体の流れ（イメージ図）" id="flow">
            <FlowDiagram />
            <ol className="mt-4 list-decimal pl-5 text-sm text-slate-600 space-y-2">
              <li><strong>① 入力</strong> … 「設定」タブで薬剤・プラン・診療オペコスト・ビジネス条件を入力します。</li>
              <li><strong>② 計算</strong> … 入力はそのまま内部のシミュレーションエンジンに渡り、月次の売上・原価・会員数を求めます（画面の裏側で自動）。</li>
              <li><strong>③ 出力</strong> … 画面上部の KPI、タブ「月次P&amp;L」「グラフ」、およびカテゴリ別に絞った表示に反映されます。</li>
            </ol>
          </Section>

          <Section title="「設定」タブ — どこに何を入れるか" id="settings-input">
            <SettingsMockIllustration />
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-slate-800 mb-2">薬剤・プラン表（各列の意味）</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>プラン名</strong> … 表示用ラベルです。</li>
                  <li><strong>種別</strong> … 「月額」＝サブスク（継続課金）／「買切」＝1回購入のみ（継続率・コミットは使いません）。</li>
                  <li><strong>コミット期間</strong> … 月額のみ。期間中は解約率をかけず「全員継続」として扱います。</li>
                  <li><strong>配送間隔</strong> … 月額のみ。例：1＝毎月配送、3＝3ヶ月に1回配送として売上・原価を計上。</li>
                  <li><strong>薬価・売価</strong> … 1回の配送（または買切の1回購入）あたり、税抜円。</li>
                  <li><strong>月間新規</strong> … そのプランに<strong>毎月</strong>新規で入る人数。</li>
                  <li><strong>継続率</strong> … 月額のみ。コミット終了後、翌月以降に何％が残るか（月次）。</li>
                </ul>
              </div>
              <div className="rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-slate-800 mb-2">診療込オペレーションコスト</h3>
                <p className="mb-2">
                  医師・サーバー・配送作業・包装・配送料は<strong>1配送あたり</strong>（円・税抜）。<strong>決済手数料率</strong>は売上に対する％です。
                  説明にあるとおり、診療は<strong>配送のたび</strong>に発生する前提で、配送件数に乗じて P&amp;L に入ります。
                </p>
              </div>
              <div className="rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-slate-800 mb-2">ビジネス設定</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>パートナー分配率</strong> … 粗利益に対する割合（％）。</li>
                  <li><strong>プラットフォーム利用料</strong> … 月額固定（税抜）。カテゴリ絞り込み時は売上比率で按分されます。</li>
                  <li><strong>シミュレーション期間</strong> … 月次表・グラフの最大月数（最大60ヶ月）。</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section title="画面上部 — KPI（いつも見える出力）" id="kpi">
            <p className="text-sm text-slate-600 mb-4">
              入力を変えると、<strong>累計売上・累計パートナー利益・平均粗利率・累計配送数・最終月売上・黒字化月</strong>が更新されます。
              カテゴリ別にピルを選ぶと、KPI も<strong>そのカテゴリだけ</strong>に基づく値に切り替わります。
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["累計売上", "累計パートナー利益", "平均粗利率", "累計配送数", "最終月売上", "黒字化"].map((label) => (
                <div key={label} className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-center text-xs font-medium text-slate-600">
                  {label}
                </div>
              ))}
            </div>
          </Section>

          <Section title="タブごとの出力の見方" id="tabs">
            <TabsDiagram />
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <h3 className="font-semibold text-green-900 mb-2">月次P&amp;L</h3>
                <p>各行が科目、各列が「月目」です。表の数値は<strong>千円</strong>表示です。合計列は科目の性質に応じて合計または最終月の値になります。</p>
              </div>
              <div className="rounded-lg bg-violet-50 border border-violet-200 p-4">
                <h3 className="font-semibold text-violet-900 mb-2">グラフ</h3>
                <p>売上・粗利・パートナー利益・累積利益・粗利率・配送数・会員数推移などを<strong>チャート</strong>で表示します。カテゴリ別表示中はタイトルにカテゴリ名が付きます。</p>
              </div>
            </div>
          </Section>

          <Section title="操作のコツ" id="tips">
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
              <li>まずは<strong>月間新規</strong>と<strong>薬価・売価</strong>を合わせ、次に<strong>継続率・配送間隔</strong>を触ると挙動が掴みやすいです。</li>
              <li>プランが複数ある薬剤は、行ごとに<strong>月間新規</strong>を分けて入力します（合算で見たい場合は1プランにまとめる）。</li>
              <li>カテゴリは<strong>集計のラベル</strong>です。ピルで選ぶと、KPI・月次P&amp;L・グラフがそのカテゴリのみに絞られます。</li>
            </ul>
          </Section>

          <div className="flex justify-center pt-4 pb-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              <Calculator className="w-4 h-4" />
              シミュレータを開く
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
