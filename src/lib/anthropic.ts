export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callLLM(
  messages: LLMMessage[],
  systemPrompt: string,
  stream: boolean = true
): Promise<ReadableStream<Uint8Array> | string> {
  const apiKey =
    typeof window !== "undefined"
      ? localStorage.getItem("paperwalk_api_key")
      : null;
  const model =
    typeof window !== "undefined"
      ? localStorage.getItem("paperwalk_model") ?? "gemini-2.5-pro"
      : "gemini-2.5-pro";

  if (!apiKey) {
    throw new Error("No API key found. Please set your FrogAPI key.");
  }

  const response = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(300000), // 5 minute timeout
    body: JSON.stringify({
      apiKey,
      model,
      system: systemPrompt,
      messages,
      stream,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM call failed: ${response.status} — ${errorText}`);
  }

  if (stream) {
    return response.body!;
  }

  const data = await response.json();
  return data.text;
}

/**
 * Stream an LLM response, parsing OpenAI-compatible SSE chunks.
 */
export async function streamLLMResponse(
  messages: LLMMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  onDone?: (fullText: string) => void
): Promise<string> {
  const stream = (await callLLM(
    messages,
    systemPrompt,
    true
  )) as ReadableStream<Uint8Array>;

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          // OpenAI-compatible: choices[0].delta.content
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }

  onDone?.(fullText);
  return fullText;
}

/**
 * Call LLM and parse JSON from the response.
 */
export async function callLLMJSON<T>(
  messages: LLMMessage[],
  systemPrompt: string
): Promise<T> {
  // Use stream: true behind the scenes to bypass strict reverse-proxy timeouts (e.g. Cloudflare's 100s TTFB limit)
  const text = await streamLLMResponse(messages, systemPrompt, () => {});
  
  // Clean up any markdown code blocks
  let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    // If parsing fails, try to extract just the JSON part
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        // Basic attempt to fix truncated JSON
        try {
          return JSON.parse(jsonMatch[0] + "]}");
        } catch {
          try {
            return JSON.parse(jsonMatch[0] + "]}]}");
          } catch {
            throw new Error(`Failed to parse JSON from LLM: ${innerErr instanceof Error ? innerErr.message : "Unknown error"}`);
          }
        }
      }
    }
    
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try {
            return JSON.parse(arrayMatch[0]);
        } catch {
            throw new Error("Failed to parse JSON array from LLM");
        }
    }
    
    throw new Error("No valid JSON found in LLM response");
  }
}
