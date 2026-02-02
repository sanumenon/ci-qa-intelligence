// ================================
// CONFIG
// ================================
const ALLOWED_DOMAINS = [
  "charitableimpact.com",
  "my.charitableimpact.com"
];

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;
const ipStore = new Map();

// ================================
// HELPERS
// ================================
function rateLimit(ip) {
  const now = Date.now();
  const data = ipStore.get(ip) || { count: 0, start: now };

  if (now - data.start > WINDOW_MS) {
    ipStore.set(ip, { count: 1, start: now });
    return true;
  }

  if (data.count >= RATE_LIMIT) return false;

  data.count++;
  ipStore.set(ip, data);
  return true;
}

function validateDomain(url) {
  return ALLOWED_DOMAINS.some(d => url.includes(d));
}

async function callHF(env, prompt, model) {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { temperature: 0.2, max_new_tokens: 900 }
      })
    }
  );

  const data = await res.json();
  return data[0]?.generated_text || "LLM generation failed";
}

// ================================
// PROMPTS
// ================================
const PROMPTS = {
  plan: `You are a QA engine for Charitable Impact.
Create a detailed Test Plan for:
{goal}`,

  testlink: `Generate TestLink compatible test cases (XML).
Application: Charitable Impact
Feature:
{goal}`,

  java: `Generate Java Selenium TestNG automation code
using Page Object Model.
Base URL must be Charitable Impact.
Feature:
{goal}`,

  python: `Generate Python Selenium PyTest automation code.
Base URL must be Charitable Impact.
Feature:
{goal}`,

  summary: `Create a QA Summary Report for management.
Scope:
{goal}`
};

// ================================
// UI
// ================================
const UI_HTML = `
<!DOCTYPE html>
<html>
<body>
<h2>Charitable Impact – QA Intelligence</h2>

<input id="url" placeholder="Application URL"><br><br>
<textarea id="goal" placeholder="What do you want to test?"></textarea><br><br>

<select id="action">
  <option value="plan">Generate Test Plan</option>
  <option value="testlink">Generate TestLink Test Cases</option>
  <option value="java">Generate Java Automation</option>
  <option value="python">Generate Python Automation</option>
  <option value="summary">Generate QA Summary</option>
</select><br><br>

<button onclick="go()">Generate</button>
<pre id="out"></pre>

<script>
async function go() {
  const res = await fetch("/", {
    method: "POST",
    body: JSON.stringify({
      url: document.getElementById("url").value,
      goal: document.getElementById("goal").value,
      action: document.getElementById("action").value
    })
  });
  document.getElementById("out").innerText = await res.text();
}
</script>
</body>
</html>
`;

// ================================
// WORKER ENTRY
// ================================
export default {
  async fetch(req, env) {

    if (req.method === "GET") {
      return new Response(UI_HTML, {
        headers: { "Content-Type": "text/html" }
      });
    }

    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (!rateLimit(ip)) {
      return new Response("Rate limit exceeded", { status: 429 });
    }

    const { url, goal, action } = await req.json();

    if (!validateDomain(url)) {
      return new Response("Out of scope domain", { status: 403 });
    }

    const template = PROMPTS[action];
    if (!template) {
      return new Response("Invalid action", { status: 400 });
    }

    const prompt = template.replace("{goal}", goal);
    const model = "mistralai/Mistral-7B-Instruct";

    const result = await callHF(env, prompt, model);
    return new Response(result);
  }
};
