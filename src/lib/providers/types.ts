import { z } from "zod";

export type ProviderCapabilityStatus = "VERIFIED" | "UNVERIFIED" | "DISABLED" | "MANUAL_HANDOFF";
export interface ModelDescriptor     { id: string; displayName: string; }
export interface TextCapabilities    { structuredOutput: boolean; contextLimit: number | null; }
export interface ImageCapabilities   { maxWidth: number | null; maxHeight: number | null; formats: string[]; supportsImageInput: boolean; }
export interface VideoCapabilities   { durationsSeconds: number[]; aspectRatios: string[]; resolutions: string[]; supportsAudio: boolean; asyncJob: boolean; }
export interface CostEstimate        { providerId: string; modelId: string; amountMinor: number | null; currency: string; basis: string; isEstimate: boolean; pricingSource: string | null; pricingVerifiedAt: string | null; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StructuredTextInput<S extends z.ZodType<any, any, any>> {
  modelId: string;
  systemPrompt: string;
  userPrompt: string;
  schema: S;
}

export interface GenerationResult<T> {
  data: T;
  providerJobId: string | null;
  usage: Record<string, unknown> | null;
}

export interface ImageInput  { modelId: string; prompt: string; negativePrompt?: string; width?: number; height?: number; }
export interface VideoInput  { modelId: string; prompt: string; durationSeconds?: number; aspectRatio?: string; referenceImageStorageKeys?: string[]; }
export interface ProviderJobReference { providerJobId: string; }
export interface ProviderJobStatus    { state: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"; progressPercent: number | null; errorCode: string | null; }
export interface ProviderMediaResult  { storageKey: string; mimeType: string; width: number | null; height: number | null; durationSeconds: number | null; }

export interface TextGenerationProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  getCapabilities(modelId: string): Promise<TextCapabilities>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateStructured<S extends z.ZodType<any, any, any>>(input: StructuredTextInput<S>): Promise<GenerationResult<z.infer<S>>>;
}

export interface ImageGenerationProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  getCapabilities(modelId: string): Promise<ImageCapabilities>;
  estimateCost(input: ImageInput): Promise<CostEstimate>;
  generate(input: ImageInput): Promise<ProviderJobReference>;
  getJob(jobId: string): Promise<ProviderJobStatus>;
  fetchResults(jobId: string): Promise<ProviderMediaResult[]>;
}

export interface VideoGenerationProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  getCapabilities(modelId: string): Promise<VideoCapabilities>;
  estimateCost(input: VideoInput): Promise<CostEstimate>;
  submit(input: VideoInput): Promise<ProviderJobReference>;
  getJob(jobId: string): Promise<ProviderJobStatus>;
  fetchResults(jobId: string): Promise<ProviderMediaResult[]>;
  cancel?(jobId: string): Promise<{ cancelled: boolean }>;
}

export type ProviderErrorCode =
  | "AUTHENTICATION_FAILED" | "PERMISSION_DENIED" | "QUOTA_EXCEEDED"
  | "CREDIT_EXHAUSTED"      | "RATE_LIMITED"       | "INVALID_REQUEST"
  | "UNSUPPORTED_CAPABILITY"| "CONTENT_POLICY_REJECTED" | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"      | "OUTPUT_UNAVAILABLE"  | "OUTPUT_VALIDATION_FAILED"
  | "UNKNOWN_PROVIDER_ERROR";
