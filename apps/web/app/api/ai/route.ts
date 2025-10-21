import { GenerationOutputSchema } from '@repo/shared';
import  { GoogleGenerativeAI } from '@google/generative-ai';

// Allow responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `You are an expert web developer. Generate complete, production-ready HTML/CSS/JS code.

IMPORTANT: Return your response as a JSON structure with this format:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "path": "css/styles.css",
      "content": "body { margin: 0; }..."
    }
  ],
  "metadata": {
    "description": "Brief description of what was generated"
  }
}

Guidelines:
- Generate clean, modern, responsive code
- Use semantic HTML5
- Include proper CSS styling (can be inline or separate files)
- Use vanilla JavaScript when needed
- Ensure all paths are relative
- Create separate files for CSS and JS when appropriate
- Make it visually appealing with good UX
- Include comments in the code

After generating the files, return the JSON structure. The files will be automatically saved to the project.
`;

export async function POST(req: Request) {
  try {
    const { messages, projectId } = await req.json();

    if (!projectId) {
      return new Response('Missing projectId', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('GEMINI_API_KEY not configured', { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format the conversation
    const lastMessage = messages[messages.length - 1];
    const fullPrompt = `${systemPrompt}\n\nUser request: ${lastMessage.content}`;

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to save files
    try {
      const jsonMatch = text.match(/\{[\s\S]*"files"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = GenerationOutputSchema.parse(parsed);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        for (const file of validated.files) {
          await fetch(`${apiUrl}/projects/${projectId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: file.path,
              content: file.content,
            }),
          });
        }
        console.log(`Saved ${validated.files.length} files to project ${projectId}`);
      }
    } catch (error) {
      console.error('Error saving generated files:', error);
    }

    // Return the response in a format compatible with useChat
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
