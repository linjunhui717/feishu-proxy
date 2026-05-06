const FEISHU_TOKEN = "eyJhbGciOiJFUzI1NiIsImZlYXR1cmVfY29kZSI6IkZlYXR1cmVPQXV0aEpXVFNpZ25fQ04iLCJraWQiOiI3NjM1MDc3NTI4NDU3MDcxNzk1IiwidHlwIjoiSldUIn0.eyJqdGkiOiI3NjM2NDIzMTI3ODMzNTk1MDgyIiwiaWF0IjoxNzc3OTkzMzEyLCJleHAiOjE3NzgwMDA1MTIsInZlciI6InYxIiwidHlwIjoiYWNjZXNzX3Rva2VuIiwiY2xpZW50X2lkIjoiY2xpX2E5Nzg4MjA1YTVmOGRiYzQiLCJzY29wZSI6ImF1dGg6dXNlci5pZDpyZWFkIGJhc2U6YXBwOmNvcHkgYmFzZTphcHA6Y3JlYXRlIGJhc2U6YXBwOnJlYWQgYmFzZTphcHA6dXBkYXRlIGJhc2U6ZmllbGQ6Y3JlYXRlIGJhc2U6ZmllbGQ6ZGVsZXRlIGJhc2U6ZmllbGQ6cmVhZCBiYXNlOmZpZWxkOnVwZGF0ZSBiYXNlOnJlY29yZDpjcmVhdGUgYmFzZTpyZWNvcmQ6ZGVsZXRlIGJhc2U6cmVjb3JkOnJldHJpZXZlIGJhc2U6cmVjb3JkOnVwZGF0ZSBiYXNlOnRhYmxlOmNyZWF0ZSBiYXNlOnRhYmxlOnJlYWQgYmFzZTp0YWJsZTp1cGRhdGUgYml0YWJsZTphcHA6cmVhZG9ubHkiLCJhdXRoX2lkIjoiNzYzNjQyMzEwMjI4ODY0NTMyOSIsImF1dGhfdGltZSI6MTc3Nzk5MzMxMSwiYXV0aF9leHAiOjE4MDk1MjkzMTEsInVuaXQiOiJldV9uYyIsInRlbmFudF91bml0IjoiZXVfbmMiLCJvcGFxdWUiOnRydWUsImVuYyI6IkFpUWtBUUVDQU1JREFBRUJBd0FDQVEwQUF3c0xBQUFBQUFXQUFBQURHWldGMGRYSmxBQUFBRUc5aGRYUm9YMjl3WVhGMVpWOXFkM1FBQUFBSVZHVnVZVzUwU1dRQUFBQUJNQUFBQUFSV1FXMWxBQUFBQ2pFM056YzROVEk0TURBUEFBUU1BQUFBQVFvQUFXTEZJbG12Z0FBaUN3QUNBQUFBREpsUXArWXdldmhpZG5OS2d3c0FBd0FBQUREbHpmUVlVeUYvSEpqT2lzNFBYOUVIMEVmUjh1eVM3SGZhVmV3bWQ5c09vUWNESFUrTmNuS1FLd2NtZEIrMXFHQUFDeUFGQUFBQUJXVjFYMjVqQUc3b3BMTndzU29TNVBRRk5uREhnSC9YL1k4TGFMYk9sY216OFF2TGcrVkFIYXhjRUtWUEdoTDFVWnE4b3VkWDRzU0lWZEhxWDhnc1o4Vlllb1Rxbz90VGFSMVJXOU5YYnZHWkhvUFhoUzhVd3BmZVRaWkZpSi9jNXhaUzRDcU1La2p6ZnNSUVZjZERhUGw1YjlvbnYzU1BjNVdsRmtlVDhWNGdwSVVFZnpNcURGR2lIdDI3UU1IQ0hRNDIyN1Brd1dIdHBnPT0iLCJlbmNfX3ZlciI6InYxIiwic2Vzc2lvbl9leHRyYSI6eyJpc19hbm9ueW1vdXMiOmZhbHNlLCJuZWVkX2F1dGgiOmZhbHNlLCJ2YWxpZF9mb3JfYXBwX2lkIjpmYWxzZSwiZHBvcF90aHVtYnByaW50IjoiIiwidGVuYW50X2NyZWF0ZV9zb3VyY2UiOjJ9fQ.ggrg8QmczLPENWez7qAfpyR0DTqr78-6IV-j4nwniNBY6VDq4OaVrm2IPGJZCoOZXfl4avJ5F3h0Os9uvroANQ";

const COZE_API_URL = "https://q4kmq5yf.coze.site/run";
const COZE_API_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZDRlNDQ5LWRhYzYtNDljOS1hYWQyLWQwNmRhMGRlOWZkZCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIndJVmdXRE1JWnR1VEtGSUZuYVRwV0R0VE9PZVp6S0dzIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzc4MDYzMTc0Iiwic3ViIjoic3BpZmZlOi8vYXBpLmNveGUuY24vd29ya2xvYWRfaWRlbnRpdHkvaWQ6NzYzNjY5MjY2Mzc4NTIyNjI4MyIsInNyYyI6ImluYm91bmRfYXV0aF9hY2Nlc3NfdG9rZW5faWQ6NzYzNjc3MjMxODM5Mjc2ODkyMzEifQ.k_Z7_RrNcd1yiP-uzJI9WYWaUWt4P0XupKzZncWoWX7AOmyysAq35Hl13WDnQU7NKuMSKX4C6yEvZwu2drVFIMzyGujik5QTW6eXweFp_LwRXNJVd-WzoiaogdFqXWifQ5PdtMQNRuh25zrh2b2Qzd47lQ98HoLcJuhtIaB46UkvD8Y9_oQvLfxkx5BwVcAvc8QJrBRUBOZC93W-zEKVrvHKER4tmd_JwNitdpa-ApjRR_cVhVfvrtIV0UqKJHAC3v5DaMWUzhIAEJcLjBmapb1tEk5ihxDG4AFq_cmz4Z-PCzJFNa5MlNCHLBhtyLt8ZhoaixF_XDnERCI_Mnha0Q";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  try {
    const { topic_keyword, content_perspective, table1, table2, table3 } = req.body;
    
    // Call Coze API
    const cozeResponse = await fetch(COZE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COZE_API_TOKEN}`,
      },
      body: JSON.stringify({
        topic_keyword,
        content_perspective,
        table1,
        table2,
        table3,
      }),
    });
    
    const cozeData = await cozeResponse.json();
    res.json(cozeData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
