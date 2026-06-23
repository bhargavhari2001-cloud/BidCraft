declare module "@/lib/voyageai" {
  export function generateEmbedding(text: string, inputType?: string): Promise<number[]>;
  export function generateEmbeddings(texts: string[], inputType?: string): Promise<number[][]>;
}
