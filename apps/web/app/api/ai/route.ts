// Allow responses up to 30 seconds
export const maxDuration = 30;

/**
 * AI Chat Route - Proxies to backend generator service
 * This route handles streaming chat responses while delegating actual code generation
 * to the backend service to avoid duplicating the system prompt and logic.
 */
export async function POST(req: Request) {
  try {
    const { messages, projectId } = await req.json();

    if (!projectId) {
      return new Response('Missing projectId', { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content;

    // Call backend generator service instead of duplicating logic
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      // Call the backend generate endpoint
      const generateResponse = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt: userPrompt,
          model: 'gemini-2.5-flash',
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Backend generation failed: ${errorText}`);
      }

      const generation = await generateResponse.json();

      // Format response for useChat
      const filesList = generation.files
        .map((f: { path: string; content: string }) => `- ${f.path}`)
        .join('\n');

      const responseText = `Generated ${generation.files.length} file(s):\n${filesList}\n\nFiles have been saved to your project.`;

      // Note: Assistant message is saved in the onFinish callback of useChat
      // This ensures it's saved after the full response is received

      return new Response(
        JSON.stringify({
          id: Date.now().toString(),
          role: 'assistant',
          content: responseText,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error calling backend generator:', error);
      // Return error message in chat format
      return new Response(
        JSON.stringify({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('AI route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
