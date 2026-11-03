export interface LipSyncInput {
  imagePath: string;
  audioPath: string;
  outputPath: string;
  durationSeconds?: number;
  text?: string;
  prompt?: string;
}

export interface LipSyncResult {
  outputPath: string;
  providerId: string;
  modelId: string;
  durationSeconds: number;
}

export interface LipSyncProvider {
  id: string;
  name: string;
  generateLipSync(input: LipSyncInput): Promise<LipSyncResult>;
}

