/**
 * Cloudflare Pages: Basic 認証（全ルート）
 * ダッシュボードで BASIC_USER / BASIC_PASSWORD を上書き可能（未設定時は下記の既定値）
 *
 * 注: ブラウザの認証ダイアログ本体はカスタム不可。案内文は 401 の HTML 本文と realm で補助する。
 */

/** realm は ASCII 推奨（日本語は 401 の HTML 本文に記載） */
const REALM = "MD Online Simulator";

function authHtml(wrongPassword) {
  const err =
    wrongPassword
      ? `<p class="err">認証に失敗しました。担当者より伝えられている ID / パスワードをご確認ください。</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>認証 — MDオンラインシミュレータ</title>
  <style>
    :root {
      color-scheme: light;
      --fg: #1e293b;
      --muted: #64748b;
      --bg: #f8fafc;
      --card: #fff;
      --border: #e2e8f0;
      --err: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.65;
      padding: clamp(1rem, 4vw, 2.5rem);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      max-width: 36rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: clamp(1.25rem, 3vw, 2rem);
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
    }
    h1 {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 1rem;
      letter-spacing: 0.02em;
    }
    p { margin: 0 0 1rem; }
    p:last-child { margin-bottom: 0; }
    .muted { color: var(--muted); font-size: 0.9rem; margin-top: 1.25rem; }
    .err {
      color: var(--err);
      font-size: 0.9rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>MDオンラインシミュレータへようこそ</h1>
    ${err}
    <p>このサイトでは MD オンラインの収益シミュレーションを、変数を入力することで PL ベースに落とし込むことが可能です。</p>
    <p>担当者より伝えられている ID / PW を入力し、BASIC 認証を完了してください。</p>
    <p class="muted">表示されたブラウザのログイン画面に、上記の ID / PW をご入力ください。キャンセルした場合はこの案内を再度表示できます。</p>
  </div>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, next, env } = context;

  const user = env?.BASIC_USER ?? "MDONLINE";
  const pass = env?.BASIC_PASSWORD ?? "MDONLINE_123";
  const expected = `Basic ${btoa(`${user}:${pass}`)}`;

  const auth = request.headers.get("Authorization");
  if (auth !== expected) {
    const wrongPassword = auth != null && auth !== "";
    return new Response(authHtml(wrongPassword), {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "WWW-Authenticate": `Basic realm="${REALM}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return next();
}
