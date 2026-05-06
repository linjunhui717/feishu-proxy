// Cloudflare Worker: Feishu Bitable CORS Proxy + Auto Token Refresh
// 用途：绕过CORS限制，自动刷新飞书access_token

const FEISHU_APP_ID = 'cli_a9788205a5f8dbc4';
const FEISHU_APP_SECRET = 'Q4Gqek3svAyoZgDXHvgOydhoPPzNPfdW';

interface Env {
  // Cloudflare Workers secret bindings (set via wrangler secret put)
}

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getFeishuAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 5 * 60 * 1000) {
    return cachedToken.access_token;
  }

  const resp = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
  });
  const data = await resp.json() as { tenant_access_token?: string; code?: number; msg?: string };
  if (!data.tenant_access_token) {
    throw new Error(`Failed to get token: ${data.msg}`);
  }
  // Token usually valid for 2 hours
  cachedToken = {
    access_token: data.tenant_access_token,
    expires_at: Date.now() + 2 * 60 * 60 * 1000,
  };
  return cachedToken.access_token;
}

async function handleSearchTables(topic: string, view: string) {
  const accessToken = await getFeishuAccessToken();

  // 3 bitable tables
  const tables = [
    { appToken: 'LCJ8bwmHjaBWn4srlRDcBrUpnJg', tableId: 'tblMeoPn2aM3M08c', name: '话题人设分析' },
    { appToken: 'X243btCH0ajsZMsouTNcDhz9nkh', tableId: 'tbly7LcBqLOSf6UT', name: '痛点分析裂变' },
    { appToken: 'QnSEb93LAaXB3lshFPccmP0KnUc', tableId: 'tblqdat1ieqUHjM3', name: '爆款选题库' },
  ];

  const results: Record<string, unknown[]> = {};

  for (const table of tables) {
    try {
      const resp = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${table.appToken}/tables/${table.tableId}/records/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            filter: {
              conjunction: 'or',
              conditions: [
                { field_name: '话题', operator: 'contains', value: [topic] },
                { field_name: '关键词', operator: 'contains', value: [topic] },
                { field_name: '选题', operator: 'contains', value: [topic] },
              ],
            },
            page_size: 10,
          }),
        }
      );
      const data = await resp.json() as { data?: { items?: Record<string, unknown>[] }; code?: number };
      results[table.name] = data?.data?.items ?? [];
    } catch (e) {
      results[table.name] = [];
    }
  }
  return results;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // POST /api/bitable/search
    if (url.pathname === '/api/bitable/search' && request.method === 'POST') {
      try {
        const body = await request.json() as { topic?: string; view?: string };
        const { topic, view } = body;
        if (!topic) {
          return Response.json({ success: false, error: 'Missing topic' }, {
            headers: { 'Access-Control-Allow-Origin': '*' },
          });
        }
        const data = await handleSearchTables(topic, view ?? '素人消费者');
        return Response.json({ success: true, data }, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      } catch (e) {
        return Response.json({ success: false, error: String(e) }, {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
