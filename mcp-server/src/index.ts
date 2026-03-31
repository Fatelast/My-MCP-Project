import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerWeatherTools } from "./tools/weather.js";
import { registerGeoTools } from "./tools/geo.js";
import { registerGithubTools } from "./tools/github.js";
import { registerLocationTools } from "./tools/location.js";

// 实例化 MCP Server
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// =============================
// 注册所有 Tools
// 新增功能模块在此处添加一行即可
// =============================
registerWeatherTools(server);
registerGeoTools(server);
registerGithubTools(server);
registerLocationTools(server);

// 启动 Stdio 传输
const transport = new StdioServerTransport();
await server.connect(transport);

// ⚠️ Stdio 模式下严禁 console.log，只用 console.error
console.error("[MCP Server] 已启动，已注册 Tools: get_weather, geo_encode, geo_decode, summarize_github_repo, get_location_with_weather");
