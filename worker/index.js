import { rateLimit } from "./rateLimiter";
import { validateDomain } from "./domainGuard";
import { callHF } from "./hfClient";

export default {
  async fetch(req, env) {
    if (req.method === "GET") {
      return new Response(await (await fetch("ui/index.html")).text(), {
        headers: { "Content-Type": "text/html" }
      });
    }

    const ip = req.headers.get("CF-Connecting-IP");
    if (!rateLimit(ip)) {
      return new Response("Rate limit exceeded", { status: 429 });
    }

    const { url, goal, action } = await req.json();
    if (!validateDomain(url)) {
      return new Response("Out of scope domain", { status: 403 });
    }

    const prompts = {
      plan: "test_plan.txt",
      testlink: "testlink_cases.txt",
      java: "automation_java.txt",
      python: "automation_python.txt",
      summary: "qa_summary.txt"
    };

    const promptTemplate = await (await fetch(`prompts/${prompts[action]}`)).text();
    const prompt = promptTemplate.replace("{goal}", goal);

    const model = "mistralai/Mistral-7B-Instruct";
    const result = await callHF(env, prompt, model);

    return new Response(result);
  }
};

