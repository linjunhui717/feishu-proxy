const FEISHU_APP_ID = "cli_a9788205a5f8dbc4";
const FEISHU_APP_SECRET = "Q4Gqek3svAyoZgDXHvgOydhoPPzNPfdW";
let cachedToken = null;
async function getFeishuAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expires_at - 5 * 60 * 1e3) {
    return cachedToken.access_token;
  }
  const resp = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET })
  });
  const data = await resp.json();
  if (!data.tenant_access_token) {
    throw new Error(`Failed to get token: ${data.msg}`);
  }
  cachedToken = {
    access_token: data.tenant_access_token,
    expires_at: Date.now() + 2 * 60 * 60 * 1e3
  };
  return cachedToken.access_token;
}
async function handleSearchTables(topic, view) {
  const accessToken = await getFeishuAccessToken();
  const tables = [
    { appToken: "LCJ8bwmHjaBWn4srlRDcBrUpnJg", tableId: "tblMeoPn2aM3M08c", name: "\u8BDD\u9898\u4EBA\u8BBE\u5206\u6790" },
    { appToken: "X243btCH0ajsZMsouTNcDhz9nkh", tableId: "tbly7LcBqLOSf6UT", name: "\u75DB\u70B9\u5206\u6790\u88C2\u53D8" },
    { appToken: "QnSEb93LAaXB3lshFPccmP0KnUc", tableId: "tblqdat1ieqUHjM3", name: "\u7206\u6B3E\u9009\u9898\u5E93" }
  ];
  const results = {};
  for (const table of tables) {
    try {
      const resp = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${table.appToken}/tables/${table.tableId}/records/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            filter: {
              conjunction: "or",
              conditions: [
                { field_name: "\u8BDD\u9898", operator: "contains", value: [topic] },
                { field_name: "\u5173\u952E\u8BCD", operator: "contains", value: [topic] },
                { field_name: "\u9009\u9898", operator: "contains", value: [topic] }
              ]
            },
            page_size: 10
          })
        }
      );
      const data = await resp.json();
      results[table.name] = data?.data?.items ?? [];
    } catch (e) {
      results[table.name] = [];
    }
  }
  return results;
}
var feishu_proxy_worker_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (url.pathname === "/api/bitable/search" && request.method === "POST") {
      try {
        const body = await request.json();
        const { topic, view } = body;
        if (!topic) {
          return Response.json({ success: false, error: "Missing topic" }, {
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
        const data = await handleSearchTables(topic, view ?? "\u7D20\u4EBA\u6D88\u8D39\u8005");
        return Response.json({ success: true, data }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return Response.json({ success: false, error: String(e) }, {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
export {
  feishu_proxy_worker_default as default
};
