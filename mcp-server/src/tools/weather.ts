import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * 核心业务函数：根据城市名查询天气
 * 可被其他 Tool 模块直接调用，实现跨模块复用
 * @param city - 城市名称
 * @param apiKey - 高德 API Key
 * @returns 格式化的天气预报文本
 */
export async function fetchWeatherByCity(city: string, apiKey: string): Promise<string> {
  const url = `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(city)}&key=${apiKey}&extensions=all`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`高德天气 API 请求失败：${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as {
    status: string;
    info: string;
    forecasts?: Array<{
      city: string;
      casts: Array<{
        date: string;
        week: string;
        dayweather: string;
        nightweather: string;
        daytemp: string;
        nighttemp: string;
        daywind: string;
        nightwind: string;
      }>;
    }>;
  };

  if (json.status !== "1" || !json.forecasts?.length) {
    return `天气查询失败：${json.info}`;
  }

  const { city: cityName, casts } = json.forecasts[0];
  const lines = casts.map((c) =>
    `📅 ${c.date}（周${c.week}）\n` +
    `  白天：${c.dayweather} ${c.daytemp}°C ${c.daywind}风\n` +
    `  夜间：${c.nightweather} ${c.nighttemp}°C ${c.nightwind}风`
  );

  return `🌤 ${cityName} 未来天气预报\n\n${lines.join("\n\n")}`;
}

/**
 * 注册天气查询 Tool
 * @param server - McpServer 实例
 */
export function registerWeatherTools(server: McpServer): void {
  server.tool(
    "get_weather",
    "根据城市名称查询未来 4 天天气预报（数据来源：高德地图）",
    {
      city: z.string().describe("城市名称，例如：北京、上海、广州"),
    },
    async ({ city }) => {
      const apiKey = process.env.AMAP_API_KEY;
      if (!apiKey) {
        return { content: [{ type: "text" as const, text: "错误：缺少环境变量 AMAP_API_KEY" }] };
      }
      const result = await fetchWeatherByCity(city, apiKey);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );
}
