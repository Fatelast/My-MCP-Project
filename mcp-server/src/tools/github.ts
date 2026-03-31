import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** GitHub API 基础地址 */
const GITHUB_API = "https://api.github.com";

/**
 * 构造带鉴权头的 fetch 请求
 * 若设置了 GITHUB_TOKEN 环境变量，附加 Authorization 头（提升速率限制至 5000次/小时）
 * 未设置时匿名请求，速率限制为 60次/小时
 */
function githubFetch(url: string): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { headers });
}

/**
 * 注册 GitHub 相关 Tools
 * @param server - McpServer 实例
 */
export function registerGithubTools(server: McpServer): void {
  /**
   * 总结 GitHub 仓库
   * 汇总仓库基本信息、README 摘要、主要语言、最近 Issues
   * @param owner - 仓库所有者（用户名或组织名）
   * @param repo  - 仓库名称
   */
  server.tool(
    "summarize_github_repo",
    "总结一个 GitHub 仓库：包括基本信息、README 摘要、编程语言占比、最近 Issues",
    {
      owner: z.string().describe("仓库所有者，例如：facebook"),
      repo: z.string().describe("仓库名称，例如：react"),
    },
    async ({ owner, repo }) => {
      const baseUrl = `${GITHUB_API}/repos/${owner}/${repo}`;

      // 并行请求：仓库信息 + 语言 + 最近 Issues + README
      const [repoRes, langsRes, issuesRes, readmeRes] = await Promise.all([
        githubFetch(baseUrl),
        githubFetch(`${baseUrl}/languages`),
        githubFetch(`${baseUrl}/issues?state=open&per_page=5&sort=updated`),
        githubFetch(`${baseUrl}/readme`),
      ]);

      // 仓库基本信息（必须成功）
      if (!repoRes.ok) {
        const msg = repoRes.status === 404
          ? `仓库 ${owner}/${repo} 不存在或为私有仓库`
          : `GitHub API 请求失败：${repoRes.status} ${repoRes.statusText}`;
        return { content: [{ type: "text" as const, text: msg }] };
      }

      const repoData = (await repoRes.json()) as {
        full_name: string;
        description: string | null;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        license: { name: string } | null;
        topics: string[];
        homepage: string | null;
        created_at: string;
        updated_at: string;
        default_branch: string;
      };

      // 语言占比
      let langSummary = "暂无数据";
      if (langsRes.ok) {
        const langs = (await langsRes.json()) as Record<string, number>;
        const total = Object.values(langs).reduce((a, b) => a + b, 0);
        if (total > 0) {
          langSummary = Object.entries(langs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang, bytes]) => `${lang} ${((bytes / total) * 100).toFixed(1)}%`)
            .join(" | ");
        }
      }

      // 最近 Issues
      let issuesSummary = "暂无开放 Issue";
      if (issuesRes.ok) {
        const issues = (await issuesRes.json()) as Array<{
          number: number;
          title: string;
          user: { login: string };
          created_at: string;
        }>;
        if (issues.length > 0) {
          issuesSummary = issues
            .map((i) => `  #${i.number} ${i.title} (@${i.user.login})`)
            .join("\n");
        }
      }

      // README 摘要（取前 500 字符，去除 Markdown 语法噪音）
      let readmeSummary = "暂无 README";
      if (readmeRes.ok) {
        const readmeData = (await readmeRes.json()) as { content: string; encoding: string };
        if (readmeData.encoding === "base64") {
          const raw = Buffer.from(readmeData.content, "base64").toString("utf-8");
          // 去除 HTML 注释、图片、徽章链接，保留纯文本
          const cleaned = raw
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/\[!\[.*?\].*?\]/g, "")
            .replace(/#+\s*/g, "")
            .replace(/\r?\n{3,}/g, "\n\n")
            .trim();
          readmeSummary = cleaned.slice(0, 600) + (cleaned.length > 600 ? "..." : "");
        }
      }

      const topics = repoData.topics?.length
        ? repoData.topics.join(" | ")
        : "无";

      const output = [
        `📦 ${repoData.full_name}`,
        `${repoData.description ?? "（无描述）"}`,
        "",
        `⭐ Star: ${repoData.stargazers_count.toLocaleString()}   🍴 Fork: ${repoData.forks_count.toLocaleString()}   🐛 Open Issues: ${repoData.open_issues_count.toLocaleString()}`,
        `📄 许可证: ${repoData.license?.name ?? "未知"}`,
        `🏷️  Topics: ${topics}`,
        `🔗 主页: ${repoData.homepage ?? "无"}`,
        `🌿 默认分支: ${repoData.default_branch}`,
        `📅 创建: ${repoData.created_at.slice(0, 10)}   最后更新: ${repoData.updated_at.slice(0, 10)}`,
        "",
        `💻 主要语言：`,
        `  ${langSummary}`,
        "",
        `📋 最近 Issues：`,
        issuesSummary,
        "",
        `📖 README 摘要：`,
        readmeSummary,
      ].join("\n");

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
