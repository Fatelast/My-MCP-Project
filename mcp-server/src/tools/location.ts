import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchGeoEncode } from "./geo.js";
import { fetchWeatherByCity } from "./weather.js";

/**
 * 注册地点综合查询 Tool
 * 通过调用 geo 模块与 weather 模块的核心函数，
 * 实现「地址解析 → 天气查询」的跨模块串联，无代码糅合
 * @param server - McpServer 实例
 */
export function registerLocationTools(server: McpServer): void {
  /**
   * 输入任意地点，同时返回经纬度坐标 + 该地点所在城市的天气预报
   * 执行顺序：
   *   1. 调用 fetchGeoEncode()     → 解析地址，获取坐标 + 城市名
   *   2. 调用 fetchWeatherByCity() → 用城市名查询天气
   */
  server.tool(
    "get_location_with_weather",
    "输入任意地点，同时返回经纬度坐标和该地点所在城市的天气预报",
    {
      address: z.string().describe("地点名称或详细地址，例如：故宫、上海迪士尼、成都宽窄巷子"),
    },
    async ({ address }) => {
      const apiKey = process.env.AMAP_API_KEY;
      if (!apiKey) {
        return {
          content: [{ type: "text" as const, text: "错误：缺少环境变量 AMAP_API_KEY" }],
        };
      }

      // Step 1: 调用 geo 模块核心函数解析地址
      const geoResult = await fetchGeoEncode(address, apiKey);
      if (!geoResult) {
        return {
          content: [{
            type: "text" as const,
            text: `地址解析失败，请检查地点名称是否正确：${address}`,
          }],
        };
      }

      // Step 2: 用解析出的城市名，调用 weather 模块核心函数查询天气
      const weatherText = await fetchWeatherByCity(geoResult.city, apiKey);

      // 组合输出
      const output = [
        `📍 地点解析结果`,
        `  地址：${geoResult.formatted_address}`,
        `  坐标：${geoResult.location}`,
        `  精度：${geoResult.level}`,
        ``,
        weatherText,
      ].join("\n");

      return {
        content: [{ type: "text" as const, text: output }],
      };
    }
  );
}
