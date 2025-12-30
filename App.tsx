
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Canvas, { CanvasHandle } from './components/Canvas';
import Inspector from './components/Inspector';
import ConfigModal from './components/ConfigModal';
import FormatSelector from './components/FormatSelector';
import Node from './components/Node';

import { 
  NodeData, Edge, NodeType, ViewMode, ProjectContext, 
  CreativeFormat, CampaignStage, MarketAwareness, 
  LanguageRegister, FunnelStage, CopyFramework, TestingTier,
  StoryOption, BigIdeaOption, MechanismOption, HVCOOption, StrategyMode, MassDesireOption 
} from './types';

import * as GeminiService from './services/geminiService';

// Initial Data
const initialProject: ProjectContext = {
  productName: "Lumina",
  productDescription: "A smart sleep mask that uses light therapy to improve sleep quality.",
  targetAudience: "Insomniacs and biohackers",
  targetCountry: "USA",
  marketAwareness: MarketAwareness.PROBLEM_AWARE,
  funnelStage: FunnelStage.TOF,
  languageRegister: LanguageRegister.CASUAL,
  imageModel: 'standard', // Default
  strategyMode: StrategyMode.VISUAL_IMPULSE // Changed default to Visual Impulse for safer start
};

const initialNodes: NodeData[] = [
  {
    id: 'root-1',
    type: NodeType.ROOT,
    title: 'Campaign Root',
    description: 'Start here. Define your product strategy.',
    x: 100,
    y: 300
  }
];

const FORMAT_GROUPS: Record<string, CreativeFormat[]> = {
  "🔵 TOF (Unaware/Viral)": [
    CreativeFormat.UGLY_VISUAL,
    CreativeFormat.BIG_FONT,
    CreativeFormat.MEME,
    CreativeFormat.REDDIT_THREAD,
    CreativeFormat.MS_PAINT,
    CreativeFormat.CARTOON,
    CreativeFormat.STICKY_NOTE_REALISM,
    CreativeFormat.TWITTER_REPOST,
    CreativeFormat.HANDHELD_TWEET,
    CreativeFormat.REMINDER_NOTIF
  ],
  "🟠 MOF (Education/Trust)": [
    CreativeFormat.GMAIL_UX,
    CreativeFormat.LONG_TEXT,
    CreativeFormat.WHITEBOARD,
    CreativeFormat.IG_STORY_TEXT,
    CreativeFormat.STORY_QNA,
    CreativeFormat.STORY_POLL,
    CreativeFormat.CAROUSEL_EDUCATIONAL,
    CreativeFormat.CAROUSEL_REAL_STORY,
    CreativeFormat.BEFORE_AFTER,
    CreativeFormat.MECHANISM_XRAY,
    CreativeFormat.EDUCATIONAL_RANT
  ],
  "🔴 BOF (Conversion/Offer)": [
    CreativeFormat.TESTIMONIAL_HIGHLIGHT,
    CreativeFormat.PRESS_FEATURE,
    CreativeFormat.US_VS_THEM,
    CreativeFormat.BENEFIT_POINTERS,
    CreativeFormat.CAROUSEL_TESTIMONIAL,
    CreativeFormat.LEAD_MAGNET_3D,
    CreativeFormat.UGC_MIRROR,
    CreativeFormat.DM_NOTIFICATION,
    CreativeFormat.CHAT_CONVERSATION
  ]
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [project, setProject] = useState<ProjectContext>(initialProject);
  const [activeView, setActiveView] = useState<ViewMode>('LAB');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorNodeId, setInspectorNodeId] = useState<string | null>(null);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFormatSelectorOpen, setIsFormatSelectorOpen] = useState(false);
  const [pendingFormatParentId, setPendingFormatParentId] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<CreativeFormat>>(new Set());

  const [simulating, setSimulating] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);

  const addNode = (node: NodeData, parentId?: string) => {
      setNodes(prev => [...prev, node]);
      if (parentId) {
          const edge: Edge = {
              id: uuidv4(),
              source: parentId,
              target: node.id
          };
          setEdges(prev => [...prev, edge]);
      }
      return node;
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeData>) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleNodeAction = async (action: string, nodeId: string, optionId?: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // --- MASS DESIRE DISCOVERY (NEW) ---
      if (action === 'generate_desires') {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateMassDesires(project);
          handleUpdateNode(nodeId, { isLoading: false, outputTokens: (node.outputTokens || 0) + result.outputTokens });
          
          if (result.data) {
              result.data.forEach((d: MassDesireOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.MASS_DESIRE_NODE,
                      title: d.headline,
                      description: d.description,
                      massDesireData: d,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId,
                      inputTokens: result.inputTokens
                  }, nodeId);
              });
          }
      }

      // Handle Basic Expansion
      if (action === 'expand_personas') {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generatePersonas(project);
          handleUpdateNode(nodeId, { isLoading: false, outputTokens: (node.outputTokens || 0) + result.outputTokens });
          
          if (result.data) {
              result.data.forEach((p: any, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.PERSONA,
                      title: p.name,
                      description: p.profile,
                      meta: p, // contains visceralSymptoms, etc.
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId,
                      inputTokens: result.inputTokens
                  }, nodeId);
              });
          }
      }

      // Handle Story Flow (Megaprompt)
      if (action === 'start_story_flow') {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateStoryResearch(project);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((story: StoryOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.STORY_NODE,
                      title: story.title,
                      description: story.narrative,
                      storyData: story,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }
      
      // Handle EXPRESS PROMO FLOW (NEW)
      if (action === 'start_express_flow') {
          handleUpdateNode(nodeId, { isLoading: true });
          // Temporarily force strategy mode to HARD_SELL for this action context if not already
          const expressProject = { ...project, strategyMode: StrategyMode.HARD_SELL };
          const result = await GeminiService.generateExpressAngles(expressProject);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((promo: any, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.ANGLE, // Reuse Angle node but it is a "Promo Angle"
                       title: promo.headline,
                       description: `${promo.testingTier}: ${promo.hook}`,
                       meta: { angle: promo.hook, ...promo },
                       testingTier: promo.testingTier,
                       x: node.x + 400,
                       y: node.y + (i - 1) * 200,
                       parentId: nodeId
                   }, nodeId);
              });
          }
      }

      if (action === 'generate_big_ideas' && node.storyData) {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateBigIdeas(project, node.storyData);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((idea: BigIdeaOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.BIG_IDEA_NODE,
                      title: idea.headline,
                      description: idea.concept,
                      bigIdeaData: idea,
                      storyData: node.storyData, // Pass down
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_mechanisms' && node.bigIdeaData) {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateMechanisms(project, node.bigIdeaData);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((mech: MechanismOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.MECHANISM_NODE,
                      title: mech.scientificPseudo,
                      description: `UMP: ${mech.ump} | UMS: ${mech.ums}`,
                      mechanismData: mech,
                      bigIdeaData: node.bigIdeaData, // Pass down
                      storyData: node.storyData, // Pass down
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_hooks' && node.mechanismData && node.bigIdeaData && node.storyData) {
           handleUpdateNode(nodeId, { isLoading: true });
           const result = await GeminiService.generateHooks(project, node.bigIdeaData, node.mechanismData, node.storyData);
           handleUpdateNode(nodeId, { isLoading: false });

           if (result.data) {
               result.data.forEach((hook: string, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.HOOK_NODE,
                       title: "Viral Hook",
                       description: hook,
                       hookData: hook,
                       mechanismData: node.mechanismData,
                       bigIdeaData: node.bigIdeaData,
                       storyData: node.storyData,
                       x: node.x + 400,
                       y: node.y + (i - 2) * 150, // tighter packing
                       parentId: nodeId
                   }, nodeId);
               });
           }
      }

      // Handle Angles Expansion (Supports both Persona and Mass Desire inputs)
      if (action === 'expand_angles') {
          handleUpdateNode(nodeId, { isLoading: true });
          
          // Determine Context (Persona vs Mass Desire)
          const personaName = node.title;
          const personaMotivation = node.meta?.motivation || "General Public";
          const massDesire = node.massDesireData;
          
          const result = await GeminiService.generateAngles(project, personaName, personaMotivation, massDesire);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((a: any, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.ANGLE,
                      title: a.headline,
                      description: `${a.testingTier}: ${a.hook}`,
                      meta: { ...node.meta, angle: a.hook, ...a }, // Inherit metadata
                      testingTier: a.testingTier,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }
      
      // Handle HVCO
      if (action === 'generate_hvco' && node.meta) {
           handleUpdateNode(nodeId, { isLoading: true });
           const pain = node.meta.visceralSymptoms?.[0] || "General Pain";
           const result = await GeminiService.generateHVCOIdeas(project, pain);
           handleUpdateNode(nodeId, { isLoading: false });
           
           if (result.data) {
               result.data.forEach((hvco: HVCOOption, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.HVCO_NODE,
                       title: hvco.title,
                       description: hvco.hook,
                       hvcoData: hvco,
                       meta: node.meta, // Inherit Persona
                       x: node.x + 400,
                       y: node.y + (i - 1) * 200,
                       parentId: nodeId
                   }, nodeId);
               });
           }
      }

      // Handle Creative Generation (Opening Selector)
      if (action === 'generate_creatives' || action === 'open_format_selector') {
          setPendingFormatParentId(nodeId);
          setIsFormatSelectorOpen(true);
      }
      
      // Handle Promotion
      if (action === 'promote_creative') {
          handleUpdateNode(nodeId, { stage: CampaignStage.SCALING, isWinning: true });
      }
  };

  const handleGenerateCreatives = async () => {
      if (!pendingFormatParentId) return;
      const parentNode = nodes.find(n => n.id === pendingFormatParentId);
      if (!parentNode) return;

      setIsFormatSelectorOpen(false);
      handleUpdateNode(pendingFormatParentId, { isLoading: true });
      
      // FIX 1: CURE CONTEXT AMNESIA (Full Object Passing)
      const fullStrategyContext = {
          ...(parentNode.meta || {}), // Contains persona, symptoms, etc.
          storyData: parentNode.storyData,
          bigIdeaData: parentNode.bigIdeaData,
          mechanismData: parentNode.mechanismData,
          hookData: parentNode.hookData,
          hvcoData: parentNode.hvcoData,
          massDesireData: parentNode.massDesireData // Include Mass Desire
      };

      const formatsToGen = Array.from(selectedFormats) as CreativeFormat[];
      let verticalOffset = 0;

      // --- LOGIC FOR CONTEXT EXTRACTION (Simpler, Object-Based) ---
      let angleToUse = parentNode.title;
      
      if (parentNode.type === NodeType.ANGLE && parentNode.meta?.hook) {
          angleToUse = parentNode.meta.hook;
      } else if (parentNode.type === NodeType.HOOK_NODE && parentNode.hookData) {
          angleToUse = parentNode.hookData;
      } else if (parentNode.type === NodeType.BIG_IDEA_NODE && parentNode.bigIdeaData) {
          angleToUse = `Show concept: ${parentNode.bigIdeaData.concept}`;
      } else if (parentNode.type === NodeType.MECHANISM_NODE && parentNode.mechanismData) {
          angleToUse = `Show the action of: ${parentNode.mechanismData.ums}`; 
      } else if (parentNode.type === NodeType.HVCO_NODE && parentNode.hvcoData) {
          angleToUse = parentNode.hvcoData.title;
      } else if (parentNode.type === NodeType.STORY_NODE && parentNode.storyData) {
          angleToUse = parentNode.storyData.title;
      }

      for (const fmt of formatsToGen) {
          const isHVCO = parentNode.type === NodeType.HVCO_NODE;

          // 1. Unified Strategy Generation (Concept + Copy + Overlay Text in ONE shot)
          const strategyRes = await GeminiService.generateCreativeStrategy(
              project, fullStrategyContext, angleToUse, fmt, isHVCO
          );
          
          if (strategyRes.data) {
              const strategy = strategyRes.data;
              
              // 2. Visual Generation (Pass Full Context + EMBEDDED TEXT from Strategy)
              let imageUrl: string | null = null;
              let carouselImages: string[] = [];
              let imageTokens = 0;
              let finalGenerationPrompt = "";
              
              if (fmt.includes('Carousel')) {
                   const slidesRes = await GeminiService.generateCarouselSlides(
                       project, fmt, angleToUse, strategy.visualScene, strategy.visualStyle, fullStrategyContext,
                       strategy.congruenceRationale // Pass rationale
                   );
                   if (slidesRes.data && slidesRes.data.imageUrls.length > 0) {
                       imageUrl = slidesRes.data.imageUrls[0];
                       carouselImages = slidesRes.data.imageUrls;
                       finalGenerationPrompt = slidesRes.data.prompts[0]; // Take first slide prompt as main
                       imageTokens = slidesRes.inputTokens + slidesRes.outputTokens;
                   }
              } else {
                   const imgRes = await GeminiService.generateCreativeImage(
                       project, 
                       fullStrategyContext, 
                       angleToUse, 
                       fmt, 
                       strategy.visualScene, 
                       strategy.visualStyle, 
                       "1:1", 
                       strategy.embeddedText, // NEW: Using the Strategy-Defined Text
                       undefined,
                       strategy.congruenceRationale // Pass rationale
                   );
                   imageUrl = imgRes.data.imageUrl;
                   finalGenerationPrompt = imgRes.data.finalPrompt;
                   imageTokens = imgRes.inputTokens + imgRes.outputTokens;
              }

              addNode({
                   id: uuidv4(),
                   type: NodeType.CREATIVE,
                   title: strategy.headline,
                   description: strategy.visualScene,
                   format: fmt,
                   imageUrl: imageUrl || undefined,
                   carouselImages: carouselImages.length > 1 ? carouselImages : undefined,
                   adCopy: {
                       headline: strategy.headline,
                       primaryText: strategy.primaryText,
                       cta: strategy.cta
                   },
                   // Store Strategy & Prompt data for Inspector
                   meta: { 
                       ...parentNode.meta, 
                       angle: angleToUse, 
                       concept: {
                           visualScene: strategy.visualScene,
                           visualStyle: strategy.visualStyle,
                           copyAngle: strategy.headline,
                           rationale: strategy.rationale,
                           congruenceRationale: strategy.congruenceRationale
                       }, 
                       finalGenerationPrompt 
                   },
                   // Inherit megaprompt data if exists
                   storyData: parentNode.storyData,
                   bigIdeaData: parentNode.bigIdeaData,
                   mechanismData: parentNode.mechanismData,
                   massDesireData: parentNode.massDesireData,
                   
                   x: parentNode.x + 450,
                   y: parentNode.y + verticalOffset,
                   parentId: parentNode.id,
                   
                   inputTokens: strategyRes.inputTokens + imageTokens,
                   outputTokens: strategyRes.outputTokens
               }, parentNode.id);
               verticalOffset += 400;
          }
      }
      
      handleUpdateNode(pendingFormatParentId, { isLoading: false });
      setSelectedFormats(new Set());
      setPendingFormatParentId(null);
  };

  const handleRunSimulation = async () => {
      setSimulating(true);
      // Simulate by predicting all leaf creatives in LAB
      const creatives = nodes.filter(n => n.type === NodeType.CREATIVE && n.stage !== CampaignStage.SCALING);
      
      for (const node of creatives) {
           handleUpdateNode(node.id, { isLoading: true });
           const pred = await GeminiService.predictCreativePerformance(project, node);
           handleUpdateNode(node.id, { isLoading: false, prediction: pred.data });
      }
      setSimulating(false);
  };
  
  const handleNodeMove = (id: string, x: number, y: number) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleRegenerateCreative = async (id: string, aspectRatio: string) => {
      const node = nodes.find(n => n.id === id);
      if (!node || !node.meta?.concept) return;
      
      handleUpdateNode(id, { isLoading: true });
      
      const concept = node.meta.concept;
      
      const fullStrategyContext = {
          ...(node.meta || {}),
          storyData: node.storyData,
          bigIdeaData: node.bigIdeaData,
          mechanismData: node.mechanismData
      };
      
      const imgRes = await GeminiService.generateCreativeImage(
           project, fullStrategyContext, node.meta.angle, node.format!, 
           concept.visualScene, concept.visualStyle, aspectRatio,
           node.title, // Fallback: Use Headline as Embedded Text for regeneration
           undefined, concept.congruenceRationale 
      );
      
      handleUpdateNode(id, { 
          isLoading: false, 
          imageUrl: imgRes.data.imageUrl || node.imageUrl,
          meta: { ...node.meta, finalGenerationPrompt: imgRes.data.finalPrompt } 
      });
  };

  const vaultNodes = nodes.filter(n => n.stage === CampaignStage.SCALING);
  const labNodes = activeView === 'LAB' ? nodes : [];

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onOpenConfig={() => setIsConfigOpen(true)} />
      
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <Header 
            activeView={activeView} 
            labNodesCount={nodes.length} 
            vaultNodesCount={vaultNodes.length}
            simulating={simulating}
            onRunSimulation={handleRunSimulation}
        />
        
        <div className="flex-1 relative">
           {activeView === 'LAB' ? (
               <Canvas 
                   ref={canvasRef}
                   nodes={nodes}
                   edges={edges}
                   onNodeAction={(action, id) => handleNodeAction(action, id)}
                   selectedNodeId={selectedNodeId}
                   onSelectNode={(id) => { setSelectedNodeId(id); if (id) setInspectorNodeId(id); else setInspectorNodeId(null); }}
                   onNodeMove={handleNodeMove}
               />
           ) : (
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto h-full">
                   {vaultNodes.map(node => (
                       <div key={node.id} className="relative h-[400px]">
                           <Node 
                               data={node} 
                               selected={selectedNodeId === node.id} 
                               onClick={() => { setSelectedNodeId(node.id); setInspectorNodeId(node.id); }} 
                               onAction={handleNodeAction}
                               isGridView={true}
                           />
                       </div>
                   ))}
                   {vaultNodes.length === 0 && (
                       <div className="col-span-full flex flex-col items-center justify-center text-slate-400 mt-20">
                           <p>No winning assets in the vault yet.</p>
                           <button onClick={() => setActiveView('LAB')} className="text-blue-600 font-bold mt-2">Go to Lab</button>
                       </div>
                   )}
               </div>
           )}
           
           {/* Inspector Panel */}
           {inspectorNodeId && (
               <div className="absolute top-0 right-0 bottom-0 w-[450px] z-20">
                   <Inspector 
                       node={nodes.find(n => n.id === inspectorNodeId)!} 
                       onClose={() => setInspectorNodeId(null)}
                       onUpdate={(id, data) => handleUpdateNode(id, data)}
                       onRegenerate={handleRegenerateCreative}
                       onPromote={(id) => handleNodeAction('promote_creative', id)}
                       onAnalyze={async (id) => {
                            const node = nodes.find(n => n.id === id);
                            if(node) {
                                handleUpdateNode(id, { isLoading: true });
                                const pred = await GeminiService.predictCreativePerformance(project, node);
                                handleUpdateNode(node.id, { isLoading: false, prediction: pred.data });
                            }
                       }}
                       project={project}
                   />
               </div>
           )}
        </div>
      </div>

      <ConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
          project={project}
          onUpdateProject={(updates) => setProject(prev => ({ ...prev, ...updates }))}
          onContextAnalyzed={(context) => setProject(prev => ({ ...prev, ...context }))}
      />

      <FormatSelector 
          isOpen={isFormatSelectorOpen}
          onClose={() => setIsFormatSelectorOpen(false)}
          selectedFormats={selectedFormats}
          onSelectFormat={(fmt) => {
              const next = new Set(selectedFormats);
              if (next.has(fmt)) next.delete(fmt);
              else next.add(fmt);
              setSelectedFormats(next);
          }}
          onConfirm={handleGenerateCreatives}
          formatGroups={FORMAT_GROUPS}
      />
    </div>
  );
};

export default App;
