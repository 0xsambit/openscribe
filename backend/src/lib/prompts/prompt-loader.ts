import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.resolve(__dirname, 'templates');

// Cache templates in memory
const templateCache = new Map<string, string>();

/**
 * Load and interpolate a prompt template.
 * Templates use {{variableName}} syntax for variable substitution.
 */
export function loadPrompt(templateName: string, variables: Record<string, string> = {}): string {
  const cacheKey = templateName;
  let template = templateCache.get(cacheKey);

  if (!template) {
    const filePath = path.join(TEMPLATES_DIR, templateName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt template not found: ${templateName}`);
    }
    template = fs.readFileSync(filePath, 'utf-8');
    templateCache.set(cacheKey, template);
  }

  // Interpolate variables
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return result;
}

/**
 * Clear template cache (useful for development/hot-reload).
 */
export function clearPromptCache(): void {
  templateCache.clear();
}
