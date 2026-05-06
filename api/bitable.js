// Vercel Serverless Function: Feishu Bitable Proxy + Auto Token Refresh

const FEISHU_APP_ID = 'cli_a9788205a5f8dbc4';
const FEISHU_APP_SECRET = 'Q4Gqek3svAyoZgDXHvgOydhoPPzNPfdW';

let cachedToken = null;

async function getFeishuAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expires_at - 5 * 60 * 1000) {
    return cachedToken.access_token;
  }
  const resp = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
  });
  const data = await resp.json();
  if (!data.tenant_access_token) {
    throw new Error('Failed to get token: ' + data.msg);
  }
  cachedToken = {
    access_token: data.tenant_access_token,
    expires_at: Date.now() + 2 * 60 * 60 * 1000,
  };
  return cachedToken.access_token;
}

const TABLES = [
  { appToken: 'LCJ8bwmHjaBWn4srlRDcBrUpnJg', tableId: 'tblMeoPn2aM3M08c', name: '话题人设分析' },
  { appToken: 'X243btCH0ajsZMsouTNcDhz9nkh', tableId: 'tbly7LcBqLOSf6UT', name: '痛点分析裂变' },
  { appToken: 'QnSEb93LAaXB3lshFPccmP0KnUc', tableId: 'tblqdat1ieqUHjM3', name: '爆款选题库' },
];

async function searchTable(accessToken, table, topic) {
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
  const data = await resp.json();
  return data?.data?.items ?? [];
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { topic, view } = req.body || {};
  if (!topic) {
    return res.status(400).json({ success: false, error: 'Missing topic' });
  }

  try {
    const accessToken = await getFeishuAccessToken();
    const results = {};
    for (const table of TABLES) {
      results[table.name] = await searchTable(accessToken, table, topic);
    }
    return res.status(200).json({ success: true, data: results });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
};
