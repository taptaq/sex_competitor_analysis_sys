import React, { useState } from "react";
import { Competitor, QAAnalysis } from "../../types";
import {
  Upload,
  Loader2,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import * as XLSX from "xlsx";
import { analyzeQA } from "../../services/gemini";

interface QAAnalysisPanelProps {
  competitor: Competitor;
  onUpdateCompetitor: (updatedCompetitor: Competitor) => void;
}

const QAAnalysisPanel: React.FC<QAAnalysisPanelProps> = ({
  competitor,
  onUpdateCompetitor,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      let allTextContent = "";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileContent = "";

        if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          fileContent = await file.text();
        } else if (
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".csv")
        ) {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];

          // 智能处理表格数据
          fileContent = jsonData
            .map((row, index) => {
              // 跳过可能的标题行（如果第一列像"问题"或"Question"）
              if (
                index === 0 &&
                (String(row[0]).includes("问题") ||
                  String(row[0]).includes("Question"))
              ) {
                return "";
              }

              // 尝试按照用户描述的三列结构格式化：问题 | 购买状态 | 回答
              // 为了节省 Token，只保留 [用户提问] 和 [购买状态]
              if (row.length >= 2) {
                const question = row[0] || "";
                const status = row[1] || "未知状态";
                // const answer = row[2] || ""; // 忽略回答列以节省 Token
                return `[用户提问]: ${question}\n[购买状态]: ${status}\n---`;
              }

              // 如果列数不对，回退到普通拼接
              return row.join(" ");
            })
            .filter((line) => line.trim() !== "") // 过滤空行
            .join("\n");
        } else {
          console.warn(`跳过不支持的文件格式: ${file.name}`);
          continue;
        }

        if (fileContent.trim()) {
          allTextContent += `\n\n--- 文件: ${file.name} ---\n\n` + fileContent;
        }
      }

      if (!allTextContent.trim()) {
        throw new Error("所有文件内容为空或格式不支持");
      }

      const analysis = await analyzeQA(allTextContent);

      onUpdateCompetitor({
        ...competitor,
        qaAnalysis: analysis,
      });
    } catch (err: any) {
      console.error("QA Analysis error:", err);
      setError(err.message || "分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
      // 清空 input value 以便重复上传同一文件
      e.target.value = "";
    }
  };

  return (
    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
      <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
        <MessageSquare size={16} />
        用户问答与痛点分析
      </div>

      <p className="text-xs text-orange-800/80 leading-relaxed">
        上传用户问答记录或评论数据（支持多个 Excel/Txt 文件），AI
        将自动提取用户痛点和核心关注点。
      </p>

      {!competitor.qaAnalysis ? (
        <div className="pt-2 border-t border-orange-200">
          <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer transition-colors text-xs font-medium">
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>正在分析文档...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>上传问答数据文档 (支持多选)</span>
              </>
            )}
            <input
              type="file"
              accept=".txt,.md,.xlsx,.xls,.csv"
              className="hidden"
              multiple
              onChange={handleFileUpload}
              disabled={isAnalyzing}
            />
          </label>
          {error && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 pt-2 border-t border-orange-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-orange-900">分析结果</span>
            <label className="text-[10px] text-orange-600 cursor-pointer hover:underline flex items-center gap-1">
              <Upload size={10} />
              重新上传
              <input
                type="file"
                accept=".txt,.md,.xlsx,.xls,.csv"
                className="hidden"
                multiple
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
            </label>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-4 text-orange-600 gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">重新分析中...</span>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-bold text-orange-800 mb-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> 用户痛点
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {competitor.qaAnalysis.painPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-orange-700 leading-relaxed"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-orange-800 mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} /> 用户关注点
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {competitor.qaAnalysis.concerns.map((point, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-orange-700 leading-relaxed"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {competitor.qaAnalysis.suggestions && (
                <div>
                  <h4 className="text-xs font-bold text-orange-800 mb-1.5 flex items-center gap-1">
                    <Lightbulb size={12} /> 改进建议
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {competitor.qaAnalysis.suggestions.map((point, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-orange-700 leading-relaxed"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-orange-200/50">
                <h4 className="text-xs font-bold text-orange-800 mb-1.5">
                  综合总结
                </h4>
                <p className="text-xs text-orange-700 leading-relaxed">
                  {competitor.qaAnalysis.summary}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QAAnalysisPanel;
