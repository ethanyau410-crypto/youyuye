import { GoogleGenAI, Type } from "@google/genai";
import { ViewType, StyleAnalysis, PoseConfig, BackgroundType, BackgroundConfig, ImageResolution } from "../types";

// Helper to get a fresh AI instance (crucial for Veo key selection)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string (raw data, no prefix).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const getViewPrompt = (
  viewType: ViewType, 
  poseConfig?: PoseConfig, 
  backgroundConfig?: BackgroundConfig,
  resolution: ImageResolution = '1K',
  customPrompt?: string,
  fidelity: number = 90
): string => {
  let backgroundInstruction = "Background must be solid white.";
  
  // Define approximate pixel dimensions for the prompt text
  const dimMap = { '1K': '1024x1024', '2K': '2048x2048', '4K': '4096x4096' };
  const dim = dimMap[resolution];
  
  let formatInstruction = `Output format: standard ${dim} square image.`;
  
  if (backgroundConfig) {
    switch (backgroundConfig.type) {
      case BackgroundType.WHITE:
        backgroundInstruction = "Background must be solid white.";
        break;
      case BackgroundType.TRANSPARENT:
        backgroundInstruction = "Background must be transparent. Isolate the subject completely with no background. Return a PNG image with alpha channel.";
        formatInstruction = `Output format: standard ${dim} square PNG image with transparency.`;
        break;
      case BackgroundType.CUSTOM_COLOR:
        backgroundInstruction = `Background must be a solid flat color with hex code ${backgroundConfig.color}.`;
        break;
    }
  }

  const modificationInstruction = customPrompt ? `Modifications: ${customPrompt}.` : "";

  // ---------------------------------------------------------
  // CHARACTER PROMPTS
  // ---------------------------------------------------------
  
  // Fidelity logic for characters
  let fidelityInstruction = "";
  if (fidelity >= 90) {
    fidelityInstruction = "EXTREME FIDELITY REQUIRED: Duplicate the original character's facial features, exact body proportions, costume patterns, and painting style precisely. Do not alter the anatomy style (e.g., if chibi, keep chibi; if realistic, keep realistic).";
  } else if (fidelity >= 70) {
    fidelityInstruction = "High Fidelity: Maintain the character's core design, proportions, and style closely. Small adjustments for 3D readiness are allowed but keep the look recognizable.";
  } else if (fidelity >= 40) {
    fidelityInstruction = "Balanced Fidelity: Preserve the character's identity and key features (hair, costume), but standardize the body proportions to be more suitable for a generic 3D model (e.g., straighten posture, normalize limb lengths).";
  } else {
    fidelityInstruction = "Creative Freedom: Use the input image as a loose reference. Reinterpret the character with idealized 3D modeling proportions and clean lines. You may significantly alter the style to make it production-ready.";
  }

  const common = `The output should be a high-quality orthographic projection for 3D modeling. ${backgroundInstruction} ${modificationInstruction}
  
  ${fidelityInstruction}
  
  CRITICAL REQUIREMENT: Pay EXTREME attention to hand and finger anatomy. Ensure fingers are distinct, well-separated, and anatomically correct (5 distinct fingers per hand). Avoid fused, blurry, or distorted digits. Hands must be high-definition and clearly readable.

  ${formatInstruction}`;
  
  let poseInstructions = "";
  if (poseConfig) {
    poseInstructions = `Pose Requirements: Arms should be extended at exactly ${poseConfig.armAngle} degrees from the body (0° is down at sides, 90° is horizontal T-Pose). Legs should have a spread of approximately ${poseConfig.legSpread} degrees.`;
  }

  // Helper to append pose instructions if relevant
  const withPose = (text: string) => `${text} ${poseInstructions} ${common}`;
  
  switch (viewType) {
    case ViewType.SHEET:
      return withPose(`Generate a **Character Sheet** containing 4 views: **Front View**, **Side View**, **Back View**, and **Top View**. Arrange them clearly. The character must follow the specified pose angles for front and back views.`);
    case ViewType.FRONT:
      return withPose(`Generate a standard **Front View**. The character should face forward.`);
    case ViewType.SIDE:
      // Special handling for Side View based on user reference image (arms down)
      const sideLegInstruction = poseConfig ? `Legs should be straight or slightly spread (${poseConfig.legSpread} degrees).` : "Legs straight.";

      return `Generate a standard **Side View** (Profile). The character must face strictly left or right.
      
      **CRITICAL ARM POSE**: 
      The arm must be positioned **VERTICALLY along the side of the body** (neutral position), regardless of the Front View pose. 
      - The arm should hang naturally at the side.
      - The hand should be near the hip or thigh.
      - This is to ensure the profile silhouette of the torso is visible and to avoid "zombie arms".
      - **ABSOLUTELY NO** arms reaching forward. The angle between the arm and the vertical body axis should be near 0-15 degrees (relaxed).
      - Do not obscure the chest or stomach profile if possible.
      
      ${sideLegInstruction}
      
      ${common}`;
    case ViewType.BACK:
      return withPose(`Generate a standard **Back View**. The character should face away.`);
    case ViewType.TOP:
      return `Generate a standard **Top View** (Bird's eye view) of the character. Arms and legs position should match the requested pose. ${common}`;
    default:
      return withPose(`Generate a standard Front View.`);
  }
};

/**
 * Generates a specific view of the subject provided in the image.
 */
export const generateView = async (
  file: File, 
  viewType: ViewType, 
  poseConfig?: PoseConfig,
  backgroundConfig?: BackgroundConfig,
  resolution: ImageResolution = '1K',
  customPrompt?: string,
  fidelity: number = 90
): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;
    
    const prompt = getViewPrompt(viewType, poseConfig, backgroundConfig, resolution, customPrompt, fidelity);

    // Select model based on resolution
    const model = resolution === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';

    // Configure image options
    const imageConfig: any = {
      aspectRatio: "1:1"
    };

    // Only set imageSize for pro model
    if (model === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = resolution;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt
          },
        ],
      },
      config: {
        imageConfig: imageConfig
      }
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedBase64 = part.inlineData.data;
          const generatedMimeType = part.inlineData.mimeType || 'image/png';
          return `data:${generatedMimeType};base64,${generatedBase64}`;
        }
      }
    }
    
    throw new Error("No image generated in the response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};

/**
 * Analyzes the generated image against the original for style consistency.
 */
export const analyzeStyleConsistency = async (originalFile: File, generatedImageDataUrl: string): Promise<StyleAnalysis> => {
  try {
    const ai = getAI();
    const originalBase64 = await fileToBase64(originalFile);
    
    const parts = generatedImageDataUrl.split(',');
    const generatedBase64 = parts[1];
    const generatedMimeType = parts[0].split(':')[1].split(';')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: originalFile.type, 
              data: originalBase64 
            } 
          },
          { 
            inlineData: { 
              mimeType: generatedMimeType, 
              data: generatedBase64 
            } 
          },
          { 
            text: "Analyze the second image (generated orthographic view) against the first image (original character design). Evaluate how well the style, color palette, costume details, and facial features match the original. Provide a consistency score (1-10) and a breakdown of strengths and improvements needed." 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.NUMBER, 
              description: "A score from 1 to 10 indicating how well the style matches." 
            },
            summary: { 
              type: Type.STRING, 
              description: "A concise summary of the visual consistency analysis." 
            },
            strengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "List of key visual elements that were successfully preserved." 
            },
            improvements: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "List of discrepancies or details that differ from the original style." 
            }
          },
          required: ["score", "summary", "strengths", "improvements"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as StyleAnalysis;
    }
    throw new Error("No analysis generated");

  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze style consistency.");
  }
};

/**
 * Generates a 360 turnaround video based on the generated image using Veo.
 */
export const generateTurnaroundVideo = async (imageDataUrl: string): Promise<string> => {
  try {
    const ai = getAI();
    
    const parts = imageDataUrl.split(',');
    const base64Data = parts[1];
    const mimeType = parts[0].split(':')[1].split(';')[0];

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: "A 360 degree rotating turntable animation of this character in T-Pose. Solid white background. The character stays in the center and rotates smoothly. High quality 3D model reference.",
      image: {
        imageBytes: base64Data,
        mimeType: mimeType
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("No video URI in response");
    }

    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!response.ok) {
       throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw new Error(error.message || "Failed to generate video.");
  }
};