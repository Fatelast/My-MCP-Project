import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** 地理编码结果 */
export interface GeoEncodeResult {
  formatted_address: string;
  location: string; // "经度,纬度"
  city: string;     // 城市名，用于下游天气查询
  level: string;
}

/**
 * 核心业务函数：地址转经纬度
 * 可被其他 Tool 模块直接调用，实现跨模块复用
 * @param address - 待解析的地址
 * @param apiKey  - 高德 API Key
 * @param city    - 限定查询城市（可选）
 * @returns GeoEncodeResult 或 null（解析失败时）
 */
export async function fetchGeoEncode(
  address: string,
  apiKey: string,
  city?: string
): Promise<GeoEncodeResult | null> {
  const params = new URLSearchParams({ address, key: apiKey });
  if (city) params.set("city", city);

  const res = await fetch(`https://restapi.amap.com/v3/geocode/geo?${params}`);
  if (!res.ok) throw new Error(`高德地理编码 API 请求失败：${res.status}`);

  const json = (await res.json()) as {
    status: string;
    info: string;
    geocodes?: Array<{
      formatted_address: string;
      location: string;
      level: string;
      city: string | string[];
    }>;
  };

  if (json.status !== "1" || !json.geocodes?.length) return null;

  const g = json.geocodes[0];
  return {
    formatted_address: g.formatted_address,
    location: g.location,
    // city 字段高德有时返回数组，取第一个
    city: Array.isArray(g.city) ? g.city[0] ?? address : g.city,
    level: g.level,
  };
}

/**
 * 注册地理编码相关 Tools
 * @param server - McpServer 实例
 */
export function registerGeoTools(server: McpServer): void {
  server.tool(
    "geo_encode",
    "将详细地址转换为经纬度坐标（支持地标名称解析）",
    {
      address: z.string().describe("待解析的地址，例如：北京市朝阳区阜通东大街6号"),
      city: z.string().optional().describe("限定查询的城市，例如：北京（可选）"),
    },
    async ({ address, city }) => {
      const apiKey = process.env.AMAP_API_KEY;
      if (!apiKey) {
        return { content: [{ type: "text" as const, text: "错误：缺少环境变量 AMAP_API_KEY" }] };
      }
      const result = await fetchGeoEncode(address, apiKey, city);
      if (!result) {
        return { content: [{ type: "text" as const, text: `地址解析失败，请检查地址是否正确：${address}` }] };
      }
      return {
        content: [{
          type: "text" as const,
          text: `📍 地址：${result.formatted_address}\n坐标：${result.location}\n精度级别：${result.level}`,
        }],
      };
    }
  );

  server.tool(
    "geo_decode",
    "将经纬度坐标转换为详细地址（逆地理编码）",
    {
      location: z.string().describe("经纬度坐标，格式：经度,纬度，例如：116.481488,39.990464"),
    },
    async ({ location }) => {
      const apiKey = process.env.AMAP_API_KEY;
      if (!apiKey) {
        return { content: [{ type: "text" as const, text: "错误：缺少环境变量 AMAP_API_KEY" }] };
      }
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?location=${encodeURIComponent(location)}&key=${apiKey}`
      );
      if (!res.ok) throw new Error(`请求失败：${res.status}`);
      const json = (await res.json()) as {
        status: string;
        info: string;
        regeocode?: { formatted_address: string };
      };
      if (json.status !== "1" || !json.regeocode) {
        return { content: [{ type: "text" as const, text: `解析失败：${json.info}` }] };
      }
      return {
        content: [{
          type: "text" as const,
          text: `📍 坐标 ${location} 对应地址：\n${json.regeocode.formatted_address}`,
        }],
      };
    }
  );
}
