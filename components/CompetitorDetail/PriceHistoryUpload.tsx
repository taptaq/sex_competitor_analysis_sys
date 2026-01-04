import React from "react";
import { Product, PriceHistory } from "../../types";
import { Upload, TrendingUp, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

interface PriceHistoryUploadProps {
  product: Product;
  competitorId: string;
  onUpload: (productId: string, priceHistory: PriceHistory[]) => void;
  onClear: (product: Product) => void;
  onShowChart: (product: Product) => void;
}

const PriceHistoryUpload: React.FC<PriceHistoryUploadProps> = ({
  product,
  competitorId,
  onUpload,
  onClear,
  onShowChart,
}) => {
  const handlePriceHistoryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      let allPriceData: Array<{
        date: string;
        finalPrice: number;
        originalPrice?: number;
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { cellDates: false, raw: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          defval: "",
        }) as any[];

        // 解析价格数据，支持日期、到手价、页面价列
        const priceData: Array<{
          date: string;
          finalPrice: number;
          originalPrice?: number;
        }> = jsonData
          .map((item) => {
            const dateStr = item["日期"] || "";
            const finalPriceValue = item["到手价"] || 0;
            const originalPriceValue = item["页面价"] || null;

            if (!dateStr || !finalPriceValue) return null;

            // 处理日期格式，支持字符串和数字（Excel 序列号）
            let date: string;

            // 如果是数字（Excel 日期序列号），转换为日期字符串
            if (typeof dateStr === "number") {
              const excelEpoch = new Date(1899, 11, 30); // 1899-12-30
              const dateObj = new Date(
                excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000
              );
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const day = String(dateObj.getDate()).padStart(2, "0");
              date = `${year}-${month}-${day}`;
            } else {
              // 如果是字符串，直接使用
              const dateStrTrimmed = String(dateStr).trim();
              const yyyyMmDdPattern = /^\d{4}-\d{2}-\d{2}$/;
              if (!yyyyMmDdPattern.test(dateStrTrimmed)) {
                return null;
              }
              date = dateStrTrimmed;
            }

            const finalPrice = Number(finalPriceValue);
            if (isNaN(finalPrice) || finalPrice <= 0) return null;

            const originalPrice = originalPriceValue
              ? Number(originalPriceValue)
              : undefined;
            if (
              originalPrice !== undefined &&
              (isNaN(originalPrice) || originalPrice <= 0)
            ) {
              return { date, finalPrice };
            }

            return { date, finalPrice, originalPrice };
          })
          .filter((item) => item !== null) as Array<{
            date: string;
            finalPrice: number;
            originalPrice?: number;
          }>;

        allPriceData = [...allPriceData, ...priceData];
      }

      // 处理相同日期的情况：取最低到手价
      const priceMap = new Map<
        string,
        { finalPrice: number; originalPrice?: number }
      >();
      allPriceData.forEach(({ date, finalPrice, originalPrice }) => {
        const existing = priceMap.get(date);
        if (existing === undefined || finalPrice < existing.finalPrice) {
          priceMap.set(date, { finalPrice, originalPrice });
        }
      });

      // 转换为数组并排序
      const priceHistory: PriceHistory[] = Array.from(priceMap.entries())
        .map(([date, { finalPrice, originalPrice }]) => ({
          date,
          finalPrice,
          ...(originalPrice !== undefined && { originalPrice }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (priceHistory.length > 0) {
        onUpload(product.id, priceHistory);
        alert(`成功导入 ${priceHistory.length} 条价格记录`);
      } else {
        alert("未找到有效的价格数据，请检查 Excel 文件格式");
      }
    } catch (error) {
      console.error("Price history upload error:", error);
      alert("文件解析失败，请检查文件格式");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <label className="text-xs text-gray-500 mb-1 block">
          导入价格数据 (Excel/CSV):
        </label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors">
            <Upload size={14} />
            <span>选择文件导入</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              multiple
              onChange={handlePriceHistoryUpload}
            />
          </label>
          <span className="text-[10px] text-gray-400">
            已录入 {product.priceHistory?.length || 0} 条价格记录
          </span>
          {product.priceHistory && product.priceHistory.length > 0 && (
            <button
              onClick={() => onClear(product)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
              title="清空价格走势数据"
            >
              <Trash2 size={12} />
              清空
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          支持 .xlsx, .xls, .csv 格式，需包含日期、到手价列（页面价可选）。重新上传将覆盖现有数据。
        </p>
      </div>
      <button
        onClick={() => onShowChart(product)}
        disabled={!product.priceHistory || product.priceHistory.length === 0}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-10"
      >
        <TrendingUp size={16} />
        查看价格走势
      </button>
    </div>
  );
};

export default PriceHistoryUpload;

