import React, { useState, useMemo } from "react";
import { Competitor } from "../../types";
import {
  Globe,
  Venus,
  Mars,
  VenusAndMars,
  Pencil,
  Save,
  X,
  Plus,
  Sparkles,
  Loader2,
  Download,
  FileJson,
  FileText,
  Network,
} from "lucide-react";
import {
  analyzeBrandCharacteristics,
  analyzeUserGroupProfile,
} from "../../services/gemini";
import { TagCloud } from "react-tagcloud";
import QAAnalysisPanel from "./QAAnalysisPanel";

interface CompetitorSidebarProps {
  competitor: Competitor;
  onUpdateCompetitor: (competitor: Competitor) => void;
}

const CompetitorSidebar: React.FC<CompetitorSidebarProps> = ({
  competitor,
  onUpdateCompetitor,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [tempDomain, setTempDomain] = useState("");
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [tempFocus, setTempFocus] = useState<string>("");
  const [isEditingPhilosophy, setIsEditingPhilosophy] = useState(false);
  const [tempPhilosophy, setTempPhilosophy] = useState<string[]>([]);
  const [isEditingFoundedDate, setIsEditingFoundedDate] = useState(false);
  const [tempFoundedDate, setTempFoundedDate] = useState("");
  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [tempCountry, setTempCountry] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isEditingUserGroupProfile, setIsEditingUserGroupProfile] =
    useState(false);
  const [tempUserGroupProfile, setTempUserGroupProfile] = useState("");
  const [isAnalyzingUserGroup, setIsAnalyzingUserGroup] = useState(false);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 导出辅助函数
  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(competitor, null, 2);
    downloadFile(
      jsonString,
      `${competitor.name}_brand_data.json`,
      "application/json"
    );
  };

  const handleExportMarkdown = () => {
    const date = new Date().toLocaleDateString();
    let md = `# ${competitor.name} - 品牌分析报告\n\n`;
    md += `> 生成日期: ${date}\n\n`;

    md += `## 1. 品牌概览\n`;
    md += `- **品牌名称**: ${competitor.name}\n`;
    md += `- **品牌Slogan**: ${competitor.slogan || "未记录"}\n`;
    md += `- **成立时间**: ${competitor.foundedDate || "未记录"}\n`;
    md += `- **所属国家**: ${competitor.country || "未记录"}\n`;
    md += `- **核心理念**: ${competitor.philosophy?.join(" / ") || "未记录"}\n`;
    md += `- **主攻方向**: ${competitor.focus || "未记录"}\n`;
    md += `- **主要用户群体画像**: ${
      competitor.majorUserGroupProfile || "未记录"
    }\n`;
    md += `- **其他说明**: ${competitor.description || "未记录"}\n\n`;

    if (competitor.brandCharacteristicAnalysis) {
      md += `## 2. 品牌特质分析\n`;
      const analysis = competitor.brandCharacteristicAnalysis;
      md += `### 品牌定位\n${analysis.brandPositioning}\n\n`;
      md += `### 产品特征\n${analysis.productCharacteristics}\n\n`;
      md += `### 价格策略\n${analysis.priceStrategy}\n\n`;
      md += `### 目标受众\n${analysis.targetAudience}\n\n`;
      md += `### 品牌个性\n${analysis.brandPersonality}\n\n`;
      md += `### 总结\n${analysis.summary}\n\n`;
    }

    if (competitor.qaAnalysis) {
      md += `## 3. 用户痛点与机会\n`;
      md += `### 核心痛点\n`;
      competitor.qaAnalysis.painPoints.forEach((p) => (md += `- ${p}\n`));
      md += `\n### 用户关注点\n`;
      competitor.qaAnalysis.concerns.forEach((p) => (md += `- ${p}\n`));
      if (competitor.qaAnalysis.suggestions) {
        md += `\n### 改进建议\n`;
        competitor.qaAnalysis.suggestions.forEach((p) => (md += `- ${p}\n`));
      }
      md += `\n### 总结\n${competitor.qaAnalysis.summary}\n\n`;
    }

    md += `## 4. 产品矩阵\n`;
    competitor.products?.forEach((p) => {
      md += `### ${p.name}\n`;
      md += `- 价格: ¥${p.price}\n`;
      md += `- 销量: ${p.sales || 0}\n`;
      md += `- 上市时间: ${p.launchDate || "未知"}\n`;
      md += `- 适用性别: ${
        p.gender === "Male" ? "男用" : p.gender === "Female" ? "女用" : "通用"
      }\n`;

      if (p.specs) {
        md += `\n#### 规格参数\n`;
        if (p.specs.material) md += `- 材质: ${p.specs.material}\n`;
        if (p.specs.dimensions) md += `- 尺寸: ${p.specs.dimensions}\n`;
        if (p.specs.weight) md += `- 重量: ${p.specs.weight}\n`;
        if (p.specs.controlMethod)
          md += `- 控制方式: ${p.specs.controlMethod}\n`;
        if (p.specs.noiseLevel) md += `- 噪音: ${p.specs.noiseLevel}\n`;
        if (p.specs.chargingTime) md += `- 充电: ${p.specs.chargingTime}\n`;
        if (p.specs.usageTime) md += `- 续航: ${p.specs.usageTime}\n`;
        if (p.specs.ipRating) md += `- 防水: ${p.specs.ipRating}\n`;
      }

      if (p.analysis) {
        md += `\n#### 用户评价分析\n`;
        md += `**优点**:\n`;
        p.analysis.pros.forEach((item) => (md += `- ${item}\n`));
        md += `\n**缺点**:\n`;
        p.analysis.cons.forEach((item) => (md += `- ${item}\n`));
        md += `\n**总结**: ${p.analysis.summary}\n`;
      }

      if (p.priceAnalysis) {
        md += `\n#### 价格分析\n`;
        md += `- 趋势: ${p.priceAnalysis.trend}\n`;
        md += `- 波动: ${p.priceAnalysis.fluctuation}\n`;
        md += `- 建议: ${p.priceAnalysis.recommendations.join("; ")}\n`;
        md += `\n**综合分析**: ${p.priceAnalysis.summary}\n`;
      }

      if (p.reviews && p.reviews.length > 0) {
        md += `\n- 评论数: ${p.reviews.length}\n`;
      }
      md += `\n---\n\n`;
    });

    downloadFile(md, `${competitor.name}_report.md`, "text/markdown");
  };

  const handleExportOPML = () => {
    // 生成 XMind 兼容的 OPML 格式
    let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
<head>
    <title>${competitor.name} 品牌分析</title>
</head>
<body>
    <outline text="${competitor.name} 品牌分析">
        <outline text="品牌概览">
            <outline text="Slogan: ${competitor.slogan || "未记录"}" />
            <outline text="成立时间: ${competitor.foundedDate || "未记录"}" />
            <outline text="所属国家: ${competitor.country || "未记录"}" />
            <outline text="主攻方向: ${competitor.focus || "未记录"}" />
            <outline text="主要用户群体画像: ${(
              competitor.majorUserGroupProfile || "未记录"
            ).replace(/"/g, "&quot;")}" />
            <outline text="其他说明: ${(
              competitor.description || "未记录"
            ).replace(/"/g, "&quot;")}" />
            <outline text="品牌理念">`;
    competitor.philosophy?.forEach((p) => {
      opml += `\n                <outline text="${p}" />`;
    });
    opml += `
            </outline>
        </outline>`;

    if (competitor.brandCharacteristicAnalysis) {
      const bca = competitor.brandCharacteristicAnalysis;
      // 构建综合分析文本，处理可能存在的 undefined 字段
      const analysisText = [
        `品牌定位: ${bca.brandPositioning || "无"}`,
        `产品特征: ${bca.productCharacteristics || "无"}`,
        `价格策略: ${bca.priceStrategy || "无"}`,
        `目标受众: ${bca.targetAudience || "无"}`,
        `品牌个性: ${bca.brandPersonality || "无"}`,
        `总结: ${bca.summary || "无"}`,
      ].join("; ");

      opml += `
        <outline text="品牌特质分析">
            <outline text="分析内容" _note="${analysisText.replace(
              /"/g,
              "&quot;"
            )}" />
            <outline text="关键词">`;
      competitor.brandCharacteristicAnalysis.keywords?.forEach((k) => {
        opml += `\n                <outline text="${k}" />`;
      });
      opml += `
            </outline>
        </outline>`;
    }

    if (competitor.qaAnalysis) {
      opml += `
        <outline text="用户洞察">
            <outline text="核心痛点">`;
      competitor.qaAnalysis.painPoints.forEach((p) => {
        opml += `\n                <outline text="${p.replace(
          /"/g,
          "&quot;"
        )}" />`;
      });
      opml += `
            </outline>
            <outline text="用户关注点">`;
      competitor.qaAnalysis.concerns.forEach((p) => {
        opml += `\n                <outline text="${p.replace(
          /"/g,
          "&quot;"
        )}" />`;
      });
      opml += `
            </outline>`;
      if (competitor.qaAnalysis.suggestions) {
        opml += `
            <outline text="改进建议">`;
        competitor.qaAnalysis.suggestions.forEach((p) => {
          opml += `\n                <outline text="${p.replace(
            /"/g,
            "&quot;"
          )}" />`;
        });
        opml += `
            </outline>`;
      }
      opml += `
            <outline text="总结" _note="${competitor.qaAnalysis.summary.replace(
              /"/g,
              "&quot;"
            )}" />
        </outline>`;
    }

    // 产品列表
    if (competitor.products && competitor.products.length > 0) {
      opml += `\n        <outline text="产品矩阵">`;
      competitor.products.forEach((p) => {
        opml += `\n            <outline text="${p.name.replace(
          /"/g,
          "&quot;"
        )}">
                <outline text="基本信息">
                    <outline text="价格: ¥${p.price}" />
                    <outline text="销量: ${p.sales || 0}" />
                    <outline text="上市时间: ${p.launchDate || "未知"}" />
                    <outline text="适用性别: ${
                      p.gender === "Male"
                        ? "男用"
                        : p.gender === "Female"
                        ? "女用"
                        : "通用"
                    }" />
                </outline>`;

        if (p.specs) {
          let specsText = [];
          if (p.specs.material) specsText.push(`材质: ${p.specs.material}`);
          if (p.specs.dimensions) specsText.push(`尺寸: ${p.specs.dimensions}`);
          if (p.specs.noiseLevel) specsText.push(`噪音: ${p.specs.noiseLevel}`);
          if (p.specs.usageTime) specsText.push(`续航: ${p.specs.usageTime}`);

          if (specsText.length > 0) {
            opml += `\n                <outline text="规格参数">`;
            specsText.forEach(
              (s) =>
                (opml += `\n                    <outline text="${s.replace(
                  /"/g,
                  "&quot;"
                )}" />`)
            );
            opml += `\n                </outline>`;
          }
        }

        if (p.analysis) {
          opml += `\n                <outline text="用户评价分析">
                    <outline text="优点">`;
          p.analysis.pros.forEach(
            (item) =>
              (opml += `\n                        <outline text="${item.replace(
                /"/g,
                "&quot;"
              )}" />`)
          );
          opml += `\n                    </outline>
                    <outline text="缺点">`;
          p.analysis.cons.forEach(
            (item) =>
              (opml += `\n                        <outline text="${item.replace(
                /"/g,
                "&quot;"
              )}" />`)
          );
          opml += `\n                    </outline>
                    <outline text="总结" _note="${p.analysis.summary.replace(
                      /"/g,
                      "&quot;"
                    )}" />
                </outline>`;
        }

        if (p.priceAnalysis) {
          const pa = p.priceAnalysis;
          opml += `\n                <outline text="价格分析">
                    <outline text="趋势: ${pa.trend.replace(/"/g, "&quot;")}" />
                    <outline text="波动: ${pa.fluctuation.replace(
                      /"/g,
                      "&quot;"
                    )}" />
                    <outline text="建议" _note="${pa.recommendations
                      .join("; ")
                      .replace(/"/g, "&quot;")}" />
                    <outline text="综合分析" _note="${pa.summary.replace(
                      /"/g,
                      "&quot;"
                    )}" />
                </outline>`;
        }

        opml += `\n            </outline>`;
      });
      opml += `\n        </outline>`;
    }

    opml += `
    </outline>
</body>
</opml>`;

    downloadFile(opml, `${competitor.name}_mindmap.opml`, "text/xml");
  };

  // 生成词云数据 - 优先使用AI生成的关键词，如果没有则使用前端提取
  const wordCloudData = useMemo(() => {
    if (!competitor.brandCharacteristicAnalysis) return [];

    // 优先使用AI生成的关键词，只取前5个
    if (
      competitor.brandCharacteristicAnalysis.wordCloudKeywords &&
      competitor.brandCharacteristicAnalysis.wordCloudKeywords.length > 0
    ) {
      return competitor.brandCharacteristicAnalysis.wordCloudKeywords.slice(
        0,
        5
      );
    }

    // 如果没有AI生成的关键词，则使用前端提取（作为后备方案）
    // 需要过滤的停用词
    const stopWords = new Set([
      "的",
      "了",
      "在",
      "是",
      "我",
      "有",
      "和",
      "就",
      "不",
      "人",
      "都",
      "一",
      "一个",
      "上",
      "也",
      "很",
      "到",
      "说",
      "要",
      "去",
      "你",
      "会",
      "着",
      "没有",
      "看",
      "好",
      "自己",
      "这",
      "为",
      "与",
      "及",
      "等",
      "或",
      "而",
      "但",
      "以",
      "从",
      "对",
      "向",
      "在",
      "于",
      "由",
      "被",
      "让",
      "给",
      "把",
      "用",
      "因",
      "由于",
      "通过",
      "按照",
      "根据",
      "可以",
      "能够",
      "应该",
      "需要",
      "必须",
      "可能",
      "如果",
      "那么",
      "因为",
      "所以",
      "这个",
      "那个",
      "这些",
      "那些",
      "什么",
      "怎么",
      "如何",
      "为什么",
      "以及",
      "并且",
      "而且",
      "同时",
      "另外",
      "此外",
      "因此",
      "所以",
      "然而",
      "但是",
      "不过",
      "虽然",
      "尽管",
      "即使",
      "如果",
      "假如",
      "要是",
      "只要",
      "只有",
      "除非",
      "通过",
      "根据",
      "按照",
      "依据",
      "基于",
      "针对",
      "对于",
      "关于",
      "有关",
      "涉及",
      "包括",
      "含有",
      "具有",
      "拥有",
      "存在",
      "出现",
      "发生",
      "产生",
      "形成",
      "建立",
      "进行",
      "开展",
      "实施",
      "执行",
      "完成",
      "实现",
      "达到",
      "获得",
      "取得",
      "得到",
      "接受",
      "采用",
      "使用",
      "利用",
      "运用",
      "应用",
      "采取",
      "选择",
      "决定",
      "方面",
      "领域",
      "范围",
      "区域",
      "地区",
      "地方",
      "位置",
      "地点",
      "场所",
      "空间",
      "时间",
      "时期",
      "阶段",
      "过程",
      "步骤",
      "方法",
      "方式",
      "手段",
      "途径",
      "渠道",
      "功能",
      "作用",
      "效果",
      "影响",
      "结果",
      "后果",
    ]);

    // 提取所有文本内容
    const analysis = competitor.brandCharacteristicAnalysis;
    const allText = [
      analysis.brandPositioning,
      analysis.productCharacteristics,
      analysis.priceStrategy,
      analysis.targetAudience,
      analysis.brandPersonality,
      analysis.summary,
      ...analysis.competitiveAdvantages,
    ].join(" ");

    // 使用正则表达式提取中文词汇（2-4个字）
    const words = allText.match(/[\u4e00-\u9fa5]{2,4}/g) || [];

    // 统计词频
    const wordCount: Record<string, number> = {};
    words.forEach((word) => {
      // 过滤停用词和单字
      if (!stopWords.has(word) && word.length >= 2) {
        // 过滤掉纯数字或包含数字的词
        if (!/[\d]/.test(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      }
    });

    // 转换为词云数据格式，按词频排序，只取前5个
    // 计算最小和最大词频，用于调整权重
    const counts = Object.values(wordCount);
    if (counts.length === 0) return [];

    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const range = maxCount - minCount || 1;

    const cloudData = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // 只取前5个
      .map(([word, count], index) => ({
        value: word,
        count: Math.max(1, Math.round(((count - minCount) / range) * 9 + 1)), // 归一化到1-10的范围
      }));

    return cloudData;
  }, [competitor.brandCharacteristicAnalysis]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateCompetitor({ ...competitor, name: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveDomain = () => {
    onUpdateCompetitor({ ...competitor, domain: tempDomain });
    setIsEditingDomain(false);
  };

  const handleSaveFocus = () => {
    onUpdateCompetitor({
      ...competitor,
      focus: tempFocus as "Male" | "Female" | "Unisex" | undefined,
    });
    setIsEditingFocus(false);
  };

  const handleSavePhilosophy = () => {
    const filteredPhilosophy = tempPhilosophy.filter((p) => p.trim() !== "");
    onUpdateCompetitor({ ...competitor, philosophy: filteredPhilosophy });
    setIsEditingPhilosophy(false);
  };

  const handleSaveFoundedDate = () => {
    onUpdateCompetitor({
      ...competitor,
      foundedDate: tempFoundedDate.trim() || undefined,
    });
    setIsEditingFoundedDate(false);
  };

  const handleSaveCountry = () => {
    onUpdateCompetitor({
      ...competitor,
      country: tempCountry.trim() || undefined,
    });
    setIsEditingCountry(false);
  };

  const handleSaveUserGroupProfile = () => {
    onUpdateCompetitor({
      ...competitor,
      majorUserGroupProfile: tempUserGroupProfile.trim() || undefined,
    });
    setIsEditingUserGroupProfile(false);
  };

  const handleAnalyzeUserGroup = async () => {
    setIsAnalyzingUserGroup(true);
    try {
      const currentName = isEditingName ? tempName : competitor.name;
      const currentPhilosophy = isEditingPhilosophy
        ? tempPhilosophy
        : competitor.philosophy;
      const currentDescription = isEditingDescription
        ? tempDescription
        : competitor.description;
      // Handle "Unisex" mapping from empty string if needed, or strict value passage
      const currentFocus = isEditingFocus
        ? tempFocus || "Unisex"
        : competitor.focus || "Unisex";

      const result = await analyzeUserGroupProfile(
        currentName,
        competitor.isDomestic,
        {
          philosophy: currentPhilosophy,
          description: currentDescription,
          focus: currentFocus as string,
        }
      );
      if (result) {
        if (isEditingUserGroupProfile) {
          setTempUserGroupProfile(result);
        } else {
          onUpdateCompetitor({
            ...competitor,
            majorUserGroupProfile: result,
          });
        }
      }
    } catch (error) {
      console.error("User Group Analysis Failed:", error);
      alert("用户画像分析失败，请稍后重试");
    } finally {
      setIsAnalyzingUserGroup(false);
    }
  };

  const handlePhilosophyChange = (index: number, value: string) => {
    const newPhilosophy = [...tempPhilosophy];
    newPhilosophy[index] = value;
    setTempPhilosophy(newPhilosophy);
  };

  const handlePhilosophyAdd = () => {
    setTempPhilosophy([...tempPhilosophy, ""]);
  };

  const handlePhilosophyDelete = (index: number) => {
    const newPhilosophy = tempPhilosophy.filter((_, i) => i !== index);
    setTempPhilosophy(newPhilosophy);
  };

  const handleAnalyzeBrandCharacteristics = async () => {
    if (!competitor.products || competitor.products.length === 0) {
      alert("该品牌暂无产品数据，无法进行品牌特点分析");
      return;
    }

    setIsAnalyzingBrand(true);
    try {
      const analysis = await analyzeBrandCharacteristics(
        {
          name: competitor.name,
          philosophy: competitor.philosophy,
          products: competitor.products.map((p) => ({
            name: p.name,
            price: p.price,
            category: p.category,
            tags: p.tags,
            gender: p.gender,
          })),
          focus: competitor.focus,
          ads: competitor.ads,
          isDomestic: competitor.isDomestic,
        },
        competitor.isDomestic || false
      );

      onUpdateCompetitor({
        ...competitor,
        brandCharacteristicAnalysis: analysis,
      });
    } catch (error) {
      console.error("Brand characteristics analysis failed:", error);
      alert("品牌特点分析失败，请稍后重试");
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative group">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
            title="导出品牌信息"
          >
            <Download size={18} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
              >
                <FileJson size={14} />
                导出 JSON 数据
              </button>
              <button
                onClick={handleExportMarkdown}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
              >
                <FileText size={14} />
                导出 Markdown 报告
              </button>
              <button
                onClick={handleExportOPML}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
              >
                <Network size={14} />
                导出 XMind (OPML)
              </button>
            </div>
          )}

          {showExportMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowExportMenu(false)}
            />
          )}
        </div>
        {isEditingName ? (
          <div className="flex items-center gap-2 justify-center mb-6">
            <input
              className="border rounded px-3 py-2 text-xl font-bold text-center w-full"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSaveName();
                } else if (e.key === "Escape") {
                  setIsEditingName(false);
                  setTempName(competitor.name);
                }
              }}
            />
            <button
              onClick={handleSaveName}
              className="text-green-600 hover:text-green-700"
              title="保存"
            >
              <Save size={18} />
            </button>
            <button
              onClick={() => {
                setIsEditingName(false);
                setTempName(competitor.name);
              }}
              className="text-red-500 hover:text-red-600"
              title="取消"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-6 group/name relative">
            <h1 className="text-xl font-bold text-center">{competitor.name}</h1>
            <Pencil
              onClick={() => {
                setTempName(competitor.name);
                setIsEditingName(true);
              }}
              size={14}
              className="text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity cursor-pointer"
              title="编辑品牌名"
            />
          </div>
        )}

        {/* Domain Editing */}
        <div className="flex justify-center items-center mb-6 mt-1">
          {isEditingDomain ? (
            <div className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 text-sm text-center w-full"
                autoFocus
                value={tempDomain}
                onChange={(e) => setTempDomain(e.target.value)}
              />
              <button
                onClick={handleSaveDomain}
                className="text-green-600 hover:text-green-700"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => setIsEditingDomain(false)}
                className="text-red-500 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer">
              {competitor?.domain ? (
                <a
                  href={
                    competitor?.domain?.trim()
                      ? competitor.domain.trim().startsWith("http") ||
                        competitor.domain.trim().startsWith("https")
                        ? competitor.domain.trim()
                        : `https://${competitor.domain.trim()}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  {competitor.domain}
                </a>
              ) : (
                <span className="text-sm text-gray-500 transition-colors">
                  未设置官网
                </span>
              )}
              <Pencil
                onClick={() => {
                  setTempDomain(competitor.domain);
                  setIsEditingDomain(true);
                }}
                size={12}
                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Globe className="text-gray-400" size={18} />
            <span className="text-gray-600">
              {competitor.isDomestic ? "国内品牌" : "国际知名品牌"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm group/focus relative">
            {isEditingFocus ? (
              <div className="flex items-center gap-2 w-full">
                <select
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  value={tempFocus || "Unisex"}
                  onChange={(e) =>
                    setTempFocus(
                      e.target.value === "Unisex" ? "" : e.target.value
                    )
                  }
                  autoFocus
                >
                  <option value="Female">专攻女用</option>
                  <option value="Male">专攻男用</option>
                  <option value="Unisex">男女兼用</option>
                </select>
                <button
                  onClick={handleSaveFocus}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingFocus(false);
                    setTempFocus(competitor.focus || "");
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`${
                    competitor.focus === "Female"
                      ? "text-pink-500"
                      : competitor.focus === "Male"
                      ? "text-blue-500"
                      : "text-purple-500"
                  }`}
                >
                  {competitor.focus === "Female" ? (
                    <Venus size={18} />
                  ) : competitor.focus === "Male" ? (
                    <Mars size={18} />
                  ) : (
                    <VenusAndMars size={18} />
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    competitor.focus === "Female"
                      ? "bg-pink-50 text-pink-600 border-pink-100"
                      : competitor.focus === "Male"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-purple-50 text-purple-600 border-purple-100"
                  }`}
                >
                  {competitor.focus === "Female"
                    ? "专攻女用"
                    : competitor.focus === "Male"
                    ? "专攻男用"
                    : "男女兼用"}
                </span>
                <Pencil
                  onClick={() => {
                    setTempFocus(competitor.focus || "");
                    setIsEditingFocus(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/focus:opacity-100 transition-opacity cursor-pointer"
                />
              </>
            )}
          </div>

          {/* User Group Profile */}
          <div className="pt-4 border-t border-gray-100 group/userGroup relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                主要用户群体画像
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAnalyzeUserGroup}
                  disabled={isAnalyzingUserGroup}
                  className={`p-1 rounded transition-colors ${
                    isAnalyzingUserGroup
                      ? "text-purple-400 cursor-not-allowed"
                      : "text-purple-500 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                  title="AI 智能生成用户画像"
                >
                  {isAnalyzingUserGroup ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                </button>
                {!isEditingUserGroupProfile && (
                  <Pencil
                    onClick={() => {
                      setTempUserGroupProfile(
                        competitor.majorUserGroupProfile || ""
                      );
                      setIsEditingUserGroupProfile(true);
                    }}
                    size={12}
                    className="text-gray-400 opacity-0 group-hover/userGroup:opacity-100 transition-opacity cursor-pointer"
                  />
                )}
              </div>
            </div>
            {isEditingUserGroupProfile ? (
              <div className="space-y-2">
                <textarea
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-purple-200 outline-none"
                  rows={3}
                  value={tempUserGroupProfile}
                  onChange={(e) => setTempUserGroupProfile(e.target.value)}
                  placeholder="请输入主要用户群体画像信息..."
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleSaveUserGroupProfile}
                    className="text-green-600 hover:text-green-700"
                    title="保存"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={() => setIsEditingUserGroupProfile(false)}
                    className="text-red-500 hover:text-red-600"
                    title="取消"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 leading-relaxed">
                {(() => {
                  const profileText = (() => {
                    if (!competitor.majorUserGroupProfile) return null;
                    try {
                      // Check if it's a JSON string with a 'result' key (legacy/buggy data)
                      if (
                        competitor.majorUserGroupProfile.trim().startsWith("{")
                      ) {
                        const parsed = JSON.parse(
                          competitor.majorUserGroupProfile
                        );
                        if (parsed.result) return parsed.result;
                      }
                    } catch (e) {
                      // Not valid JSON, ignore
                    }
                    return competitor.majorUserGroupProfile;
                  })();

                  return profileText
                    ? profileText.split(/\r?\n/).map((line, i) => {
                        // Match lines like: "1. Header: Content" or "【Header】Content"
                        const matchNumbered = line.match(
                          /^(\d+[\.\、]\s*.*?[：:])\s*(.*)/
                        );
                        const matchBracket = line.match(/^【(.*?)】\s*(.*)/);

                        if (matchNumbered) {
                          return (
                            <div
                              key={i}
                              className="mb-2 flex flex-col md:flex-row md:items-start"
                            >
                              <span className="font-bold text-gray-800 min-w-fit md:mr-2 bg-gray-50 px-1.5 py-0.5 rounded text-xs leading-5 mt-0.5">
                                {matchNumbered[1].replace(/[:：]$/, "")}
                              </span>
                              <span className="text-gray-600 flex-1 text-xs leading-6">
                                {matchNumbered[2]}
                              </span>
                            </div>
                          );
                        } else if (matchBracket) {
                          return (
                            <div
                              key={i}
                              className="mb-2 flex flex-col items-start"
                            >
                              <span className="font-bold text-gray-800 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs mb-1">
                                {matchBracket[1]}
                              </span>
                              {matchBracket[2] && (
                                <span className="text-gray-600 text-xs leading-6 w-full pl-1">
                                  {matchBracket[2]}
                                </span>
                              )}
                            </div>
                          );
                        }

                        // Keep empty lines for spacing
                        if (!line.trim())
                          return <div key={i} className="h-2"></div>;

                        return (
                          <div key={i} className="mb-1 whitespace-pre-wrap">
                            {line}
                          </div>
                        );
                      })
                    : "未设置";
                })()}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 group/philosophy relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                品牌理念
              </h4>
              {!isEditingPhilosophy && (
                <Pencil
                  onClick={() => {
                    setTempPhilosophy(
                      competitor.philosophy && competitor.philosophy.length > 0
                        ? [...competitor.philosophy]
                        : [""]
                    );
                    setIsEditingPhilosophy(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/philosophy:opacity-100 transition-opacity cursor-pointer"
                />
              )}
            </div>
            {isEditingPhilosophy ? (
              <div className="space-y-2">
                {tempPhilosophy.map((p, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      className="flex-1 text-sm p-2 border rounded"
                      value={p}
                      onChange={(e) =>
                        handlePhilosophyChange(index, e.target.value)
                      }
                      placeholder={`理念 ${index + 1}`}
                    />
                    <button
                      onClick={() => handlePhilosophyDelete(index)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handlePhilosophyAdd}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded border border-purple-200"
                  >
                    <Plus size={12} /> 添加理念
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      setIsEditingPhilosophy(false);
                      setTempPhilosophy([]);
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSavePhilosophy}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : competitor.philosophy && competitor.philosophy.length > 0 ? (
              <ul className="space-y-1.5">
                {competitor.philosophy.map((p, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 leading-relaxed"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">暂无品牌理念</p>
            )}
          </div>

          {/* 创立日期 */}
          <div className="pt-4 border-t border-gray-100 group/foundedDate relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                创立日期
              </h4>
              {!isEditingFoundedDate && (
                <Pencil
                  onClick={() => {
                    setTempFoundedDate(competitor.foundedDate || "");
                    setIsEditingFoundedDate(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/foundedDate:opacity-100 transition-opacity cursor-pointer"
                />
              )}
            </div>
            {isEditingFoundedDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 text-sm p-2 border rounded"
                  value={tempFoundedDate}
                  onChange={(e) => setTempFoundedDate(e.target.value)}
                  placeholder="如：2020-01 或 2020"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSaveFoundedDate();
                    } else if (e.key === "Escape") {
                      setIsEditingFoundedDate(false);
                      setTempFoundedDate(competitor.foundedDate || "");
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveFoundedDate}
                  className="text-green-600 hover:text-green-700"
                  title="保存"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingFoundedDate(false);
                    setTempFoundedDate(competitor.foundedDate || "");
                  }}
                  className="text-red-500 hover:text-red-600"
                  title="取消"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {competitor.foundedDate
                  ? competitor.foundedDate.includes("-")
                    ? `${competitor.foundedDate.split("-")[0]}年${
                        competitor.foundedDate.split("-")[1]
                      }月`
                    : `${competitor.foundedDate}年`
                  : "未设置"}
              </p>
            )}
          </div>

          {/* 国家名（仅国外品牌显示） */}
          {!competitor.isDomestic && (
            <div className="pt-4 border-t border-gray-100 group/country relative">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  国家
                </h4>
                {!isEditingCountry && (
                  <Pencil
                    onClick={() => {
                      setTempCountry(competitor.country || "");
                      setIsEditingCountry(true);
                    }}
                    size={12}
                    className="text-gray-400 opacity-0 group-hover/country:opacity-100 transition-opacity cursor-pointer"
                  />
                )}
              </div>
              {isEditingCountry ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 text-sm p-2 border rounded"
                    value={tempCountry}
                    onChange={(e) => setTempCountry(e.target.value)}
                    placeholder="如：美国、日本、德国等"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSaveCountry();
                      } else if (e.key === "Escape") {
                        setIsEditingCountry(false);
                        setTempCountry(competitor.country || "");
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveCountry}
                    className="text-green-600 hover:text-green-700"
                    title="保存"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCountry(false);
                      setTempCountry(competitor.country || "");
                    }}
                    className="text-red-500 hover:text-red-600"
                    title="取消"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  {competitor.country || "未设置"}
                </p>
              )}
            </div>
          )}
          {/* 其他说明 */}
          <div className="pt-4 border-t border-gray-100 group/desc relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                其他说明
              </h4>
              {!isEditingDescription && (
                <Pencil
                  onClick={() => {
                    setTempDescription(competitor.description || "");
                    setIsEditingDescription(true);
                  }}
                  size={12}
                  className="text-gray-400 opacity-0 group-hover/desc:opacity-100 transition-opacity cursor-pointer"
                />
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-purple-200 outline-none"
                  rows={4}
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="请输入其他说明..."
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      onUpdateCompetitor({
                        ...competitor,
                        description: tempDescription,
                      });
                      setIsEditingDescription(false);
                    }}
                    className="text-green-600 hover:text-green-700"
                    title="保存"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="text-red-500 hover:text-red-600"
                    title="取消"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {competitor.description || "未设置"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
          <Sparkles size={16} />
          AI 智能分析
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          点击下方按钮，AI
          将综合分析该品牌的所有产品数据，深度提炼其品牌定位、竞争优势及市场策略。
        </p>
        <div className="pt-2 border-t border-blue-200">
          <button
            onClick={handleAnalyzeBrandCharacteristics}
            disabled={
              isAnalyzingBrand ||
              !competitor.products ||
              competitor.products.length === 0
            }
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
          >
            {isAnalyzingBrand ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>
                  {competitor.brandCharacteristicAnalysis
                    ? "重新分析品牌特点"
                    : "分析品牌特点"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 品牌特点分析结果 */}
      {competitor.brandCharacteristicAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-600" size={18} />
            <h3 className="text-base font-bold text-purple-900">
              品牌特点分析
            </h3>
          </div>

          {/* 词云展示 */}
          {wordCloudData.length > 0 && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-purple-800">
                  品牌关键词云
                </h4>
                {competitor.brandCharacteristicAnalysis.wordCloudKeywords &&
                  competitor.brandCharacteristicAnalysis.wordCloudKeywords
                    .length > 0 && (
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      AI生成
                    </span>
                  )}
              </div>
              <div className="flex items-center justify-center min-h-[200px] overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 p-3">
                <TagCloud
                  minSize={14}
                  maxSize={40}
                  tags={wordCloudData}
                  className="simple-tag-cloud"
                  style={{
                    width: "100%",
                    padding: "10px",
                  }}
                  colorOptions={{
                    luminosity: "dark",
                    hue: "purple",
                  }}
                />
              </div>
              <style>{`
                .simple-tag-cloud {
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: center;
                  align-items: center;
                  gap: 8px;
                }
                .simple-tag-cloud span {
                  cursor: default;
                  transition: all 0.2s ease;
                  display: inline-block;
                  padding: 2px 6px;
                  border-radius: 4px;
                }
                .simple-tag-cloud span:hover {
                  transform: scale(1.15);
                  z-index: 10;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
              `}</style>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                品牌定位
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.brandPositioning}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                产品特征
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.productCharacteristics}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                价格策略
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.priceStrategy}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                目标受众
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.targetAudience}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                竞争优势
              </h4>
              <ul className="list-disc list-inside space-y-0.5">
                {competitor.brandCharacteristicAnalysis.competitiveAdvantages.map(
                  (advantage, index) => (
                    <li key={index} className="text-xs text-purple-700">
                      {advantage}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                品牌个性
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.brandPersonality}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                宣传语与创意分析
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.sloganCreativity}
              </p>
            </div>
            <div className="pt-2 border-t border-purple-200">
              <h4 className="text-xs font-bold text-purple-800 mb-1.5">
                综合分析
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                {competitor.brandCharacteristicAnalysis.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 用户问答与痛点分析 */}
      <QAAnalysisPanel
        competitor={competitor}
        onUpdateCompetitor={onUpdateCompetitor}
      />
    </div>
  );
};

export default CompetitorSidebar;
