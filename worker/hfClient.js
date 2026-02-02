export async function callHF(env, prompt, model) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.2,
          max_new_tokens: 900
        }
      })
    }
  );

  const data = await response.json();
  return data[0]?.generated_text || "Generation failed";
}

