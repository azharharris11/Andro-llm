
import { ProjectContext, CreativeFormat } from "../../types";
import { ParsedAngle } from "./imageUtils";
import { ai, generateWithRetry } from "./client";

export const generateTextInstruction = (format: CreativeFormat, parsedAngle: ParsedAngle, project: ProjectContext): string => {
    return `
    CONTEXT: The image must feature text related to "${parsedAngle.cleanAngle}".
    PRODUCT: ${project.productName}.
    FORMAT: ${format}.
    `;
};

export const generateVisualText = async (
    project: ProjectContext,
    format: CreativeFormat,
    parsedAngle: ParsedAngle
): Promise<string> => {
    const model = "gemini-3-flash-preview";
    const { cleanAngle } = parsedAngle;
    const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");

    const langInstruction = isIndo
        ? "LANGUAGE: BAHASA INDONESIA (Gaul/Casual/Slang). Hindari diksi formal marketing."
        : `LANGUAGE: Native language of ${project.targetCountry || "English"}.`;

    let taskInstruction = `
        TASK: Transform the Marketing Hook into a visual text string.
        ORIGINAL HOOK: "${cleanAngle}"
        CORE PRINCIPLE: "Clear over Clever". Text must look organic/human, not like an ad copy.
    `;

    // Add format-specific instructions (abbreviated for brevity, reusing previous logic structure)
    if ([CreativeFormat.GMAIL_UX, CreativeFormat.DM_NOTIFICATION, CreativeFormat.CHAT_CONVERSATION].includes(format)) {
        taskInstruction += `\nSTYLE: Lowercase, personal, vulnerable. Strategy: Curiosity Gap.`;
    } else if ([CreativeFormat.REDDIT_THREAD, CreativeFormat.TWITTER_REPOST].includes(format)) {
        taskInstruction += `\nSTYLE: Confessional / Hot Take.`;
    } else if ([CreativeFormat.BIG_FONT, CreativeFormat.BILLBOARD].includes(format)) {
        taskInstruction += `\nSTYLE: Aggressive Call-out. Massive Typography.`;
    } else {
        taskInstruction += `\nSTYLE: Minimalist & Clear. Focus on Outcome.`;
    }

    const prompt = `
        # ROLE: Expert Direct Response Copywriter (Meta Andromeda Specialist)
        ${langInstruction}
        ${taskInstruction}
        
        CRITICAL: Output ONLY the final text string. Do not use quotation marks. Max 12 words.
    `;

    try {
        const response = await generateWithRetry({ model, contents: prompt });
        return response.text?.trim()?.replace(/^"|"$/g, '') || cleanAngle;
    } catch (e) {
        return cleanAngle;
    }
};
