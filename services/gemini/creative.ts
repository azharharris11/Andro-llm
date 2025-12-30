
import { Type } from "@google/genai";
import { 
  ProjectContext, 
  CreativeFormat, 
  CreativeStrategyResult,
  GenResult, 
  StoryOption, 
  BigIdeaOption, 
  MechanismOption, 
  LanguageRegister, 
  StrategyMode 
} from "../../types";
import { ai, extractJSON, generateWithRetry } from "./client";

export const generateSalesLetter = async (
  project: ProjectContext,
  story: StoryOption,
  bigIdea: BigIdeaOption,
  mechanism: MechanismOption,
  hook: string
): Promise<GenResult<string>> => {
  const model = "gemini-3-flash-preview";
  const country = project.targetCountry || "Indonesia";
  
  const prompt = `
    ROLE: Direct Response Copywriter (Long Form / Advertorial Specialist).
    TARGET COUNTRY: ${country}. 
    
    TASK: Write a high-converting Sales Letter (long-form Facebook Ad) in the NATIVE language of ${country}.
    
    STRATEGY STACK (MUST CONNECT ALL DOTS):
    1. HOOK: "${hook}" (The attention grabber).
    2. STORY: "${story.narrative}" (The emotional bridge).
    3. THE SHIFT (Big Idea): "${bigIdea.headline}" - "${bigIdea.concept}" (The new perspective).
    4. THE SOLUTION (Mechanism): "${mechanism.scientificPseudo}" - "${mechanism.ums}" (The specific logic of how it works).
    5. OFFER: ${project.offer} for ${project.productName}.
    
    PRODUCT DETAILS:
    ${project.productDescription}
    
    TONE: Persuasive, storytelling-based, logical yet emotional.
    FORMAT: Markdown. Paragraphs: 1-2 sentences max. Use bolding for emphasis on core benefits.
  `;

  const response = await generateWithRetry({
    model,
    contents: prompt
  });

  return {
    data: response.text || "",
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

/**
 * ONE-SHOT STRATEGY GENERATOR
 * Combines Visual Concept, Visual Text Overlay, and Ad Copy into a single reasoning step.
 * Reduces latency and ensures congruency between what is seen (Image) and what is read (Copy).
 */
export const generateCreativeStrategy = async (
  project: ProjectContext, 
  fullStrategyContext: any, 
  angle: string, 
  format: CreativeFormat,
  isHVCOFlow: boolean = false
): Promise<GenResult<CreativeStrategyResult>> => {
  const model = "gemini-3-flash-preview";
  const strategyMode = project.strategyMode || StrategyMode.DIRECT_RESPONSE;
  const country = project.targetCountry || "Indonesia";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  
  // Robust Extraction for Context
  const persona = fullStrategyContext || {};
  const personaPain = persona.visceralSymptoms ? persona.visceralSymptoms.join(", ") : "General frustration";
  const mech = fullStrategyContext?.mechanismData;
  const bigIdea = fullStrategyContext?.bigIdeaData;
  const story = fullStrategyContext?.storyData;

  // DYNAMIC STRATEGY DIRECTION
  let strategyInstruction = "";
  if (strategyMode === StrategyMode.HARD_SELL) {
      strategyInstruction = `
        **PRIORITY: CONVERSION & OFFER (HARD SELL)**
        - Visual: "Hero Shot" or "Product in Action". High clarity.
        - Embedded Text: Urgent, scarcity-driven (e.g. "50% OFF", "Last Chance", "Restocked").
        - Copy Tone: Urgent, direct, promotional.
      `;
  } else if (strategyMode === StrategyMode.VISUAL_IMPULSE) {
      strategyInstruction = `
        **PRIORITY: AESTHETIC & DESIRE (VISUAL IMPULSE)**
        - Visual: Aspirational, Pinterest-style, lifestyle focus.
        - Embedded Text: Minimalist (1-3 words max) or NO text if better.
        - Copy Tone: Minimalist, "cool", identity-driven.
      `;
  } else {
      strategyInstruction = `
        **PRIORITY: PATTERN INTERRUPT (DIRECT RESPONSE)**
        - Visual: Start with the PROBLEM/PAIN or a "Mechanism X-Ray".
        - Embedded Text: The "Hook" or "Question" that stops the scroll.
        - Copy Tone: Empathetic, raw, "Stop the scroll" energy.
      `;
  }

  // Format Specific Override
  let formatInstruction = "";
  if (format === CreativeFormat.GMAIL_UX) formatInstruction = "Visual must look like a Gmail interface. Embedded Text is the 'Subject Line'.";
  if (format === CreativeFormat.TWITTER_REPOST) formatInstruction = "Visual must look like a Tweet. Embedded Text is the 'Tweet Content'.";
  if (format === CreativeFormat.REMINDER_NOTIF) formatInstruction = "Visual must look like a Lockscreen Notification. Embedded Text is the notification message.";
  if (format === CreativeFormat.BILLBOARD) formatInstruction = "Visual is a billboard. Embedded Text is the billboard slogan.";

  const prompt = `
    # ROLE: World-Class Creative Strategist (Meta & TikTok Ads)

    **CONTEXT:**
    Strategy Mode: ${strategyMode}
    Format: ${format}
    Target Country: ${country} (Native Language for Copy & Embedded Text)
    Language Register: ${register}

    **STRATEGIC GUIDELINES:**
    ${strategyInstruction}
    ${formatInstruction}

    **CORE INPUTS:**
    Product: ${project.productName} - ${project.productDescription}
    Winning Hook/Angle: "${angle}"
    Mechanism Logic: ${mech?.ums || "Standard benefit"}
    
    **PERSONA DATA:**
    Who: ${persona.name || "Target User"}
    Symptoms: ${personaPain}
    ${story ? `Narrative Context: ${story.narrative}` : ''}
    ${bigIdea ? `Big Idea Shift: ${bigIdea.concept}` : ''}
    
    **TASK:** 
    Design the COMPLETE Creative Asset in one cohesive step.
    1. **Visual Scene:** A detailed description of the image action that proves the hook.
    2. **Embedded Text (Overlay):** The specific text that appears ON the image.
    3. **Ad Copy (Caption):** The primary text and headline for the ad post.

    **CRITICAL:** 
    - The *Embedded Text* and *Visual Scene* must work together to create "Congruence" (The image proves the text).
    
    **OUTPUT JSON:**
    - visualScene: Specific action/setup for the image generator.
    - visualStyle: Camera type, lighting, mood.
    - embeddedText: The exact text string to render on the image (Native Language).
    - primaryText: Ad caption (Native Language).
    - headline: Ad headline (Max 7 words, Native Language).
    - cta: Button text (e.g. Shop Now).
    - rationale: Why this combination hooks the persona.
    - congruenceRationale: How the image visually proves the text claim.
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualScene: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            embeddedText: { type: Type.STRING },
            primaryText: { type: Type.STRING },
            headline: { type: Type.STRING },
            cta: { type: Type.STRING },
            rationale: { type: Type.STRING },
            congruenceRationale: { type: Type.STRING }
          },
          required: ["visualScene", "visualStyle", "embeddedText", "primaryText", "headline", "cta", "rationale"]
        }
      }
    });

    return {
      data: extractJSON(response.text || "{}"),
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    };
  } catch (error) {
    console.error("Creative Strategy Generation Error", error);
    throw error;
  }
};
