import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CopyIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IContentGroup {
  id: number;
  title: string;
  coverCopy: string;
  styleTag: string;
  content: string;
  script: string;
  storyboard: string;
  coverDesign: string;
}

interface IGeneratedData {
  titles: string[];
  groups: IContentGroup[];
}

// Vercel 代理 API 地址（绕过 CORS）
const API_PROXY_URL = "https://feishu-proxy-9cc3beg8w-linjunhui717s-projects.vercel.app/api/bitable";

// 三个飞书表格配置
const TABLES = {
  table1: { appToken: "LCJ8bwmHjaBWn4srlRDcBrUpnJg", tableId: "tblMeoPn2aM3M08c", name: "话题人设分析" },
  table2: { appToken: "X243btCH0ajsZMsouTNcDhz9nkh", tableId: "tbly7LcBqLOSf6UT", name: "痛点分析裂变" },
  table3: { appToken: "QnSEb93LAaXB3lshFPccmP0KnUc", tableId: "tblqdat1ieqUHjM3", name: "爆款选题库" },
};

export default function XiaohongshuPage() {
  const [topic, setTopic] = useState("");
  const [view, setView] = useState<"consumer" | "merchant">("consumer");
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<IGeneratedData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 从飞书字段中提取文本
  const extractText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      return value.map(extractText).filter(Boolean).join("\n");
    }
    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      if ("text" in obj) return String(obj.text);
      if ("link" in obj) return String(obj.link);
    }
    return "";
  };

  // 获取字段值
  const getFieldValue = (record: Record<string, unknown>, fieldName: string): string => {
    const fields = record.fields as Record<string, unknown> | undefined;
    if (!fields) return "";
    return extractText(fields[fieldName]);
  };

  // 搜索单个飞书表格
  async function searchFeishuTable(
    appToken: string,
    tableId: string,
    filters: Array<{ field_name: string; operator: string; value: string[] }>
  ): Promise<Record<string, unknown>[]> {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FEISHU_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        filter: { conjunction: "or", conditions: filters },
        page_size: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401 || errorData.code === 99991663) {
        throw new Error("TOKEN_EXPIRED");
      }
      throw new Error(`飞书 API 错误: ${errorData.msg || response.statusText}`);
    }

    const data = await response.json() as { data?: { items?: Record<string, unknown>[] }; code?: number; msg?: string };
    if (data.code && data.code !== 0) {
      if (data.code === 99991663) throw new Error("TOKEN_EXPIRED");
      throw new Error(`飞书 API 错误: ${data.msg}`);
    }
    return data.data?.items ?? [];
  }

  // 调用飞书 API 获取数据
  // 通过 Vercel 代理调用飞书 API
  async function callFeishuAPI(searchTopic: string, viewType: string): Promise<{
    table1: Record<string, unknown>[];
    table2: Record<string, unknown>[];
    table3: Record<string, unknown>[];
    topic: string;
    view: string;
  }> {
    const response = await fetch(API_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: searchTopic, view: viewType }),
    });
    const result = await response.json() as { success: boolean; data?: Record<string, Record<string, unknown>[]>; error?: string };
    if (!result.success || !result.data) {
      throw new Error(result.error || "API 调用失败");
    }
    return {
      table1: result.data["话题人设分析"] || [],
      table2: result.data["痛点分析裂变"] || [],
      table3: result.data["爆款选题库"] || [],
      topic: searchTopic,
      view: viewType,
    };
  }

  // 解析飞书数据生成内容组
  const parseFeishuData = (data: {
    table1: Record<string, unknown>[];
    table2: Record<string, unknown>[];
    table3: Record<string, unknown>[];
    topic: string;
    view: string;
  }): IGeneratedData => {
    const groups: IContentGroup[] = [];

    // 从 table2（痛点分析裂变）提取裂变标题和方向
    const table2Items = data.table2.slice(0, 3);
    
    // 从 table3（爆款选题库）提取正文和脚本
    const table3Items = data.table3.slice(0, 3);

    // 从 table1（话题人设分析）提取风格标签
    const table1Items = data.table1.slice(0, 3);

    for (let i = 0; i < 3; i++) {
      const t2Item = table2Items[i];
      const t3Item = table3Items[i];
      const t1Item = table1Items[i];

      // 提取裂变标题（优先从 table2 的 "裂变标题" 或 "裂变方向"）
      let title = getFieldValue(t2Item, "裂变标题") || getFieldValue(t2Item, "裂变方向");
      if (!title && t3Item) {
        title = getFieldValue(t3Item, "标题") || getFieldValue(t3Item, "【AI生成】标题");
      }
      if (!title) {
        title = `关于「${data.topic}」的第${i + 1}个切入点`;
      }

      // 提取封面文案
      const coverCopy = getFieldValue(t2Item, "封面文案建议") || 
                        getFieldValue(t3Item, "封面文案") || 
                        getFieldValue(t3Item, "封面标题") ||
                        title.slice(0, 20);

      // 提取风格标签
      const styleTag = getFieldValue(t1Item, "【AI分析】人设风格") || 
                       getFieldValue(t1Item, "人设标签") || 
                       getFieldValue(t2Item, "风格标签") ||
                       (data.view === "素人消费者" ? "素人视角" : "商家视角");

      // 提取正文内容
      let content = getFieldValue(t3Item, "【AI生成】正文") || 
                    getFieldValue(t3Item, "正文") ||
                    getFieldValue(t3Item, "笔记正文");
      if (!content && t2Item) {
        const painPoint = getFieldValue(t2Item, "用户痛点");
        const direction = getFieldValue(t2Item, "裂变方向");
        if (painPoint || direction) {
          content = `💡 ${painPoint || "用户真实痛点"}\n\n${direction || "解决思路分享"}\n\n#${data.topic.replace(/\s+/g, " #")}`;
        }
      }
      if (!content) {
        content = `关于「${data.topic}」的内容分享\n\n${data.view}视角的深度解析`;
      }

      // 提取脚本/逐字稿
      const script = getFieldValue(t3Item, "【AI生成】逐字稿") || 
                     getFieldValue(t3Item, "逐字稿") ||
                     getFieldValue(t3Item, "口播稿") ||
                     content.slice(0, 100) + "...";

      // 提取分镜头大纲
      let storyboard = getFieldValue(t3Item, "【AI生成】分镜头大纲") || 
                        getFieldValue(t3Item, "分镜头大纲") ||
                        getFieldValue(t3Item, "分镜脚本");
      if (!storyboard) {
        storyboard = `1. 开场：引入「${data.topic}」话题\n2. 痛点：描述用户常见问题\n3. 解决方案：展示核心内容\n4. 演示：具体操作/效果展示\n5. 结尾：引导互动关注`;
      }

      // 提取封面设计规范
      const coverDesign = getFieldValue(t3Item, "封面设计规范") || 
                          getFieldValue(t3Item, "封面图设计") ||
                          `• 主标题：${coverCopy}\n• 配色：高对比度\n• 元素：产品/场景图 + 大字号标题\n• 风格：${styleTag}`;

      groups.push({
        id: i + 1,
        title: title || `标题${i + 1}`,
        coverCopy: coverCopy || "封面文案",
        styleTag: styleTag || "风格标签",
        content: content || "正文内容",
        script: script || "逐字稿",
        storyboard: storyboard || "分镜头大纲",
        coverDesign: coverDesign || "封面设计规范",
      });
    }

    return {
      titles: groups.map(g => g.title),
      groups,
    };
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setErrorMsg("");
    
    try {
      const viewType = view === "consumer" ? "素人消费者" : "商家主理人";
      const feishuData = await callFeishuAPI(topic.trim(), viewType);
      const parsedData = parseFeishuData(feishuData);
      setGeneratedData(parsedData);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Generate error:", error);
      setGeneratedData(null);
      setSelectedIndex(null);
      
      if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
        setErrorMsg("Token 已过期，请联系管理员刷新");
      } else {
        setErrorMsg(error instanceof Error ? error.message : "获取数据失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">小红书内容工厂</h1>
          <p className="text-gray-500 text-base">输入选题，AI为你生成完整小红书内容</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          {/* Topic Input */}
          <div className="mb-5">
            <Input
              placeholder="输入你的选题关键词，例如：轻奢穿搭、护肤心得..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 rounded-xl border-gray-200 text-base focus:border-[#FE2C55] focus:ring-[#FE2C55]"
            />
          </div>

          {/* View Selection */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setView("merchant")}
              className={cn(
                "flex-1 h-11 rounded-xl border transition-all text-sm font-medium",
                view === "merchant"
                  ? "bg-[#FE2C55] text-white border-[#FE2C55]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              商家主理人
            </button>
            <button
              onClick={() => setView("consumer")}
              className={cn(
                "flex-1 h-11 rounded-xl border transition-all text-sm font-medium",
                view === "consumer"
                  ? "bg-[#FE2C55] text-white border-[#FE2C55]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              素人消费者
            </button>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full h-12 rounded-full bg-[#FE2C55] hover:bg-[#e6294d] text-white font-medium text-base disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                生成内容
              </>
            )}
          </Button>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Results Section */}
        {generatedData && (
          <div className="space-y-6">
            {/* Title Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generatedData.groups.map((group, index) => (
                <Card
                  key={group.id}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "p-5 cursor-pointer transition-all rounded-2xl",
                    selectedIndex === index
                      ? "border-2 border-[#FE2C55] shadow-lg"
                      : "border border-gray-100 hover:border-gray-200 hover:shadow-md"
                  )}
                >
                  <p className="text-sm font-medium text-gray-900 mb-3 line-clamp-3">
                    {group.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-600">
                      封面文案：{group.coverCopy}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      风格标签：{group.styleTag}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-gray-400 text-sm">
              点击任意标题查看完整内容（标题、正文、脚本、封面图）
            </p>

            {/* Detail Section */}
            {selectedIndex !== null && generatedData.groups[selectedIndex] && (
              <div className="space-y-4">
                {/* Title Module */}
                <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                  <div className="bg-pink-50 px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-pink-600">裂变标题</span>
                    <button
                      onClick={() => copyToClipboard(generatedData.groups[selectedIndex].title)}
                      className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors"
                    >
                      <CopyIcon className="w-4 h-4 text-pink-500" />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-900 font-medium">
                      {generatedData.groups[selectedIndex].title}
                    </p>
                  </div>
                </Card>

                {/* Content Module */}
                <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">正文内容</span>
                    <button
                      onClick={() => copyToClipboard(generatedData.groups[selectedIndex].content)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <CopyIcon className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5">
                    <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {generatedData.groups[selectedIndex].content}
                    </pre>
                  </div>
                </Card>

                {/* Script Module */}
                <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">拍摄脚本</span>
                    <button
                      onClick={() => copyToClipboard(
                        `逐字稿：\n${generatedData.groups[selectedIndex].script}\n\n分镜头大纲：\n${generatedData.groups[selectedIndex].storyboard}`
                      )}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <CopyIcon className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-2">逐字稿</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {generatedData.groups[selectedIndex].script}
                      </p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">分镜头大纲</h4>
                      <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                        {generatedData.groups[selectedIndex].storyboard}
                      </pre>
                    </div>
                  </div>
                </Card>

                {/* Cover Module */}
                <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">封面设计</span>
                    <button
                      onClick={() => copyToClipboard(
                        `封面文案：${generatedData.groups[selectedIndex].coverCopy}\n\n设计规范：${generatedData.groups[selectedIndex].coverDesign}`
                      )}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <CopyIcon className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-2">封面文案</h4>
                      <p className="text-gray-900 font-medium text-lg">
                        {generatedData.groups[selectedIndex].coverCopy}
                      </p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">设计规范</h4>
                      <p className="text-gray-700 text-sm">
                        {generatedData.groups[selectedIndex].coverDesign}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-100">
          <p className="text-gray-400 text-sm">基于3个飞书多维表格数据智能分析生成</p>
        </div>
      </div>
    </div>
  );
}
