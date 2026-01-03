import * as XLSX from "xlsx";
import { PriceHistory } from "../types";

/**
 * 解析 Excel 文件中的价格历史数据
 */
export const parsePriceHistoryFromFiles = async (
  files: FileList
): Promise<PriceHistory[]> => {
  let allPriceData: Array<{ date: string; finalPrice: number; originalPrice?: number }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellDates: false, raw: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" }).map((item) => ({
      ...(item as any),
      日期:
        item?.["日期"]?.split("-")?.length < 3
          ? `2025-${item?.["日期"]}`
          : item?.["日期"],
    })) as any[];

    // 解析价格数据，支持日期、到手价、页面价列
    const priceData = jsonData
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
          const dateObj = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          date = `${year}-${month}-${day}`;
        } else {
          // 如果是字符串，直接使用
          const dateStrTrimmed = String(dateStr).trim();

          // 验证是否为 yyyy-mm-dd 格式（4位年份-2位月份-2位日期）
          const yyyyMmDdPattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!yyyyMmDdPattern.test(dateStrTrimmed)) {
            return null;
          }

          date = dateStrTrimmed;
        }

        const finalPrice = Number(finalPriceValue);
        if (isNaN(finalPrice) || finalPrice <= 0) return null;

        const originalPrice = originalPriceValue ? Number(originalPriceValue) : undefined;
        if (originalPrice !== undefined && (isNaN(originalPrice) || originalPrice <= 0)) {
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
  const priceMap = new Map<string, { finalPrice: number; originalPrice?: number }>();
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

  return priceHistory;
};

/**
 * 获取最近一次日期的价格
 */
export const getLatestPrice = (priceHistory: PriceHistory[]): number | null => {
  if (priceHistory.length === 0) return null;
  return priceHistory[priceHistory.length - 1].finalPrice;
};

