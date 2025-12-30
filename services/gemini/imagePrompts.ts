
import { StrategyMode, CreativeFormat, MarketAwareness } from "../../types";
import { generateWithRetry } from "./client";
import { PromptContext } from "./imageUtils";

/**
 * ANDROMEDA LEVEL 2: AWARENESS MAPPING
 * Returns specific visual logic based on how much the prospect knows.
 */
const getAwarenessVisualLogic = (awareness: MarketAwareness): string => {
    switch (awareness) {
        case MarketAwareness.UNAWARE:
            return "UNAWARE STAGE (CRITICAL): DO NOT SHOW THE PRODUCT PACKAGING. I repeat: NO PRODUCT. The user doesn't know it exists. Focus 100% on a 'Visual Metaphor' (e.g., a melting clock for lost time), an 'Anomaly' (something that looks 'wrong' or 'glitched'), or a shocking specific symptom. The goal is purely CURIOSITY and PATTERN INTERRUPT.";
        case MarketAwareness.PROBLEM_AWARE:
            return "PROBLEM AWARE STAGE: Focus on the SYMPTOM. Show the 'Visceral Pain'. A close-up of the body part hurting, or the messy room, or the frustration. Emphasize the 'Before' state. Product can appear subtly as a saviour, but pain is the hero.";
        case MarketAwareness.SOLUTION_AWARE:
            return "SOLUTION AWARE STAGE: Focus on the MECHANISM. Show 'Us vs Them', a diagram, an X-Ray of the effect, or a unique ingredient. Show WHY the old way failed and this new way works.";
        case MarketAwareness.PRODUCT_AWARE:
        case MarketAwareness.MOST_AWARE:
            return "MOST AWARE STAGE: HERO SHOT & MAFIA OFFER. Show the product looking majestic with a 'Value Stack' visualization (e.g., product + bonuses + guarantee badge). High contrast, professional, 'Ready to Ship' vibe. Focus on the OFFER and SCARCITY.";
        default:
            return "General Direct Response Visual.";
    }
};

const getFormatVisualGuide = (format: CreativeFormat): string => {
    switch (format) {
        // --- CAROUSEL SPECIALS (NARRATIVE & DATA FLOW) ---
        case CreativeFormat.CAROUSEL_EDUCATIONAL:
            return "Style: High-value Slide Deck. Bold headlines, flat vector icons, clean grid. Educational vibe. Focus on 'How-to' content.";
        case CreativeFormat.CAROUSEL_TESTIMONIAL:
            return "Style: Testimonial Pile. A stack of review cards with 5-star ratings overlaid on a high-end product shot. Social proof overload.";
        case CreativeFormat.CAROUSEL_PANORAMA:
            return "Style: Seamless 9:16 or 1:1 wide image split across slides. Visual continuity that forces swiping interaction.";
        case CreativeFormat.CAROUSEL_PHOTO_DUMP:
            return "Style: Raw, unedited 'Weekend Dump' vibe. Flash photography, candid shots, imperfect framing. Looks like a friend's post.";
        case CreativeFormat.CAROUSEL_REAL_STORY:
            return "Style: UGC Journey. A mix of raw selfies and 'day in the life' frames. Very high authenticity, zero studio feel.";

        // --- PATTERN INTERRUPT (BREAKING THE FEED) ---
        case CreativeFormat.BIG_FONT:
            return "Style: Massive, aggressive typography filling 80% of the frame. High contrast (e.g., Neon Green on Black). Text IS the visual hook.";
        case CreativeFormat.GMAIL_UX:
            return "Style: Gmail Inbox Interface. MUST have: White background, Standard Google font, Star icon (yellow), 'Inbox' label, Subject line in bold.";
        case CreativeFormat.BILLBOARD:
            return "Style: Realistic outdoor billboard on a highway or skyscraper. Cinematic lighting. Perception of scale and authority.";
        case CreativeFormat.UGLY_VISUAL:
            return "Style: THE UGLY AD BLUEPRINT. Intentionally 'Amateur' and 'Low-Fi'. Use clashing colors, MS Paint arrows, or low-res collage. DO NOT make it look pretty. It must look like a 'mistake' or a raw meme to break banner blindness.";
        case CreativeFormat.MS_PAINT:
            return "Style: Crude MS Paint drawings. Amateur brush strokes, neon colors. Intentionally lo-fi to trigger curiosity and pattern interrupt.";
        case CreativeFormat.REDDIT_THREAD:
            return "Style: Reddit Discussion UI. Dark Mode. MUST have: Upvote/Downvote arrows (orange/blue), u/username, 'Join' button, Award icons. Vibe: 'The community found a secret'.";
        case CreativeFormat.MEME:
            return "Style: Classic meme format. Impact font with black borders or X/Twitter style caption over a relatable, funny image.";
        case CreativeFormat.LONG_TEXT:
            return "Style: Native Mini Sales Letter. Off-white background, clean serif typography (Kindle/Article style). Zero visual distractions.";
        case CreativeFormat.CARTOON:
            return "Style: Hand-drawn editorial cartoon or comic strip. Expressive characters illustrating a relatable pain point.";
        case CreativeFormat.BEFORE_AFTER:
            return "Style: Visceral Transformation split-screen. Left: Gritty/Problem. Right: Vibrant/Solution. Clear, hard division line.";
        case CreativeFormat.WHITEBOARD:
            return "Style: Educational drawing on a real whiteboard. Marker texture, hand visible drawing a diagram. Authority/Teacher vibe.";
        case CreativeFormat.EDUCATIONAL_RANT:
            return "Style: Green Screen effect. A person talking over a news article, research paper, or a graph. High information density.";
        case CreativeFormat.OLD_ME_VS_NEW_ME:
            return "Style: Split screen comparing body language or skin. Sad/Slouching vs Confident/Glowing. Emotional transformation.";
        case CreativeFormat.PRESS_FEATURE:
            return "Style: Featured article layout (Forbes/Vogue style). Large headline, sub-headline, and a professional hero image. Institutional trust.";
        case CreativeFormat.LEAD_MAGNET_3D:
            return "Style: Sabri Suby Style. High-quality 3D render of a physical book or report floating with depth shadows. tangible value.";
        case CreativeFormat.MECHANISM_XRAY:
            return "Style: Scientific visualization. X-Ray or 3D cross-section showing molecules or 'inside the body' action. Unique Mechanism proof.";

        // --- NATIVE / SOCIAL (UX FAMILIARITY BIAS) ---
        case CreativeFormat.IG_STORY_TEXT:
            return "Style: 100% Native IG Story. Font: Typewriter. Background: Blurry candid photo. Must look like a real user story.";
        case CreativeFormat.TWITTER_REPOST:
            return "Style: X/Twitter Post screenshot. Sharp UI. MUST have: Profile pic, Handle (@name), Retweet/Like icons, Time stamp. High authority.";
        case CreativeFormat.PHONE_NOTES:
            return "Style: Apple Notes UI. Dark mode or yellow paper. MUST have: Back arrow '< Notes', Date stamp, Digital scribbles/circles in marker.";
        case CreativeFormat.AESTHETIC_MINIMAL:
            return "Style: High-end editorial (Beige/Cream tones). Serif fonts, plenty of white space. Aspirational and premium.";
        case CreativeFormat.STORY_POLL:
        case CreativeFormat.STORY_QNA:
            return "Style: IG Story with interactive stickers (Poll/Q&A) in center. UGC background. Invites 'Phantom Interaction' touching.";
        case CreativeFormat.REELS_THUMBNAIL:
            return "Style: High-energy thumbnail. Bold text, expressive faces, high saturation. Designed for the Reels Explore feed.";
        case CreativeFormat.DM_NOTIFICATION:
            return "Style: Stacked iPhone lockscreen notifications. Glassmorphism blur. Triggers dopamine 'New Message' reflex.";
        case CreativeFormat.UGC_MIRROR:
            return "Style: Raw mirror selfie. Flash photography, messy room background. 100% authentic human connection.";
        case CreativeFormat.HANDHELD_TWEET:
            return "Style: POV photo of a hand holding a phone displaying a tweet. Depth of field focus on the screen. Cafe/Street background.";
        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return "Style: 3-5 social media comment bubbles stacked over a raw product shot. Proves massive market validation.";
        case CreativeFormat.CHAT_CONVERSATION:
            return "Style: iMessage/WhatsApp thread simulation. Green/Blue bubbles. Includes 'Typing...' for realistic immersion.";
        case CreativeFormat.REMINDER_NOTIF:
            return "Style: iPhone Reminder notification bubble. Minimalist, urgent, and personal. 'Don't forget this' vibe.";

        // --- LOGIC / CONVERSION (THE PROOF) ---
        case CreativeFormat.US_VS_THEM:
            return "Style: Binary Logic table. Vibrant 'Us' vs Grayscale 'Them'. Checkmarks vs X-marks. Brutal logical comparison.";
        case CreativeFormat.VENN_DIAGRAM:
            return "Style: Data visualization of the 'Sweet Spot'. Clear overlapping circles. The 'Eureka' moment of the solution.";
        case CreativeFormat.TESTIMONIAL_HIGHLIGHT:
            return "Style: Screenshot of a text review with a yellow marker highlight over the 'Benefit' sentence. Authentic proof.";
        case CreativeFormat.GRAPH_CHART:
            return "Style: Rising line graph or bar chart. Visualizing growth or pain reduction. Proof of results through data.";
        case CreativeFormat.TIMELINE_JOURNEY:
            return "Style: Horizontal timeline (Day 1, Day 7, Day 30). Visualizes the speed of results and the transformation process.";
        case CreativeFormat.BENEFIT_POINTERS:
        case CreativeFormat.ANNOTATED_PRODUCT:
            return "Style: Hero shot of product with thin 'leader lines' pointing to ingredients/features. Educational anatomy.";
        case CreativeFormat.SEARCH_BAR:
            return "Style: Google Search simulation. White background. A query typed in (The Pain Point). Focus on 'Unaware' problem solving.";
        case CreativeFormat.POV_HANDS:
            return "Style: First-person POV looking down at hands using the product. High tactile detail. 'In-use' demonstration.";

        // --- AESTHETIC ---
        case CreativeFormat.COLLAGE_SCRAPBOOK:
            return "Style: Mixed media collage. Ripped paper, tape, polaroids, and textures. Artsy, tactile, and highly engaging.";
        case CreativeFormat.CHECKLIST_TODO:
            return "Style: Handwritten to-do list on a clipboard or notepad. Problems are crossed out, solutions are checked.";

        default:
            return "Style: High-quality, native social media asset. Realistic lighting, sharp focus, authentic texture. Hindari estetika stock photo.";
    }
};

export const generateAIWrittenPrompt = async (ctx: PromptContext): Promise<string> => {
    const { 
        project, format, parsedAngle, visualScene, visualStyle,
        culturePrompt, congruenceRationale, aspectRatio,
        rawPersona, embeddedText, safety, enhancer,
        fullStoryContext 
    } = ctx;

    const isHardSell = project.strategyMode === StrategyMode.HARD_SELL;
    const marketAwareness = project.marketAwareness || MarketAwareness.PROBLEM_AWARE;

    // LEVEL 2: AWARENESS MAPPING LOGIC
    // We override general visual directives with specific awareness-level instructions.
    const awarenessLogic = getAwarenessVisualLogic(marketAwareness);

    // Baseline Style Override for Native Formats
    const isNativeStory = [
        CreativeFormat.IG_STORY_TEXT, 
        CreativeFormat.PHONE_NOTES, 
        CreativeFormat.LONG_TEXT,
        CreativeFormat.UGC_MIRROR
    ].includes(format);

    let styleInstruction = "Style: Professional Ad.";
    if (isNativeStory) {
        styleInstruction = "Style: AMATEUR UGC. No professional lighting. Camera shake/grain allowed. Looks like a friend sent it. 'Authenticity Bias'.";
    } else if (isHardSell) {
        styleInstruction = "Style: HARD HITTING DIRECT RESPONSE. High contrast, grit, and urgency.";
    }

    const strategicContext = {
        campaign: {
            product: project.productName,
            brandVoice: project.brandVoice || "Adaptable",
            // Menambahkan mekanisme agar visual selaras dengan logika solusi
            mechanismUMS: fullStoryContext?.mechanism?.ums 
        },
        persona: {
            identity: rawPersona?.profile || "General Audience",
            // Fokus pada micro-moment penderitaan/kebutuhan persona
            visceralContext: rawPersona?.visceralSymptoms?.join(", ") 
        },
        narrative: {
            angle: parsedAngle.cleanAngle,
            textToRender: embeddedText, // CRITICAL FOR ONE-SHOT
            specificAction: visualScene, // Adegan dari Creative Director
            visualMood: visualStyle,     // Gaya dari Creative Director
            congruenceGoal: congruenceRationale // FIX: Now correctly destructured and used
        },
        execution: {
            format: format,
            formatRule: getFormatVisualGuide(format),
            awarenessLogic: awarenessLogic, // NEW INJECTION
            culture: culturePrompt,
            aspectRatio: aspectRatio
        }
    };

    const systemPrompt = `
    ROLE: Senior AI Prompt Engineer & Creative Director.
    TASK: Translate a Creative Concept into a single, high-conversion Image Generation Prompt.

    --- STRATEGIC CONTEXT ---
    ${JSON.stringify(strategicContext, null, 2)}

    --- DIRECTIVES ---
    1. CORE COMPOSITION: Execute the scene "${visualScene}" precisely. 
    2. VISUAL DNA: Strictly follow the style "${visualStyle}" and format rule: "${getFormatVisualGuide(format)}".
    3. MARKET AWARENESS RULE: ${awarenessLogic} (This is CRITICAL - Do not show product if UNAWARE).
    4. NO STOCK LOOK: ${styleInstruction}. Avoid smooth, generic AI lighting. Make it "Thoughtful but not pretty".
    5. TEXT RENDERING: The image MUST include the text "${embeddedText}" clearly visible in the scene (e.g., on the screen, sign, or overlay).
    6. CONGRUENCE: The visual must prove the text. "${congruenceRationale || 'Visual evidence of the claim'}".
    
    --- TECHNICAL PARAMETERS ---
    - Style Enhancer: ${enhancer}
    - Safety & Quality: ${safety}
    - Localization: ${culturePrompt}

    Output ONLY the raw prompt string for the image generator.
    `;
    
    try {
        const response = await generateWithRetry({
            model: "gemini-3-flash-preview", 
            contents: systemPrompt
        });
        return response.text?.trim() || "";
    } catch (e) {
        // Fallback jika API gagal
        return `${format} style. ${visualScene}. ${visualStyle}. ${culturePrompt}. RENDER TEXT: "${embeddedText}"`; 
    }
};
