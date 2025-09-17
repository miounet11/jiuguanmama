/**
 * 向量嵌入服务（简化实现）
 * 未来可以集成真正的向量数据库如 Pinecone, Weaviate, ChromaDB 等
 */

export interface EmbeddingResult {
  text: string
  vector: number[]
  metadata?: any
}

export interface VectorSearchRequest {
  query: string
  collection?: string
  topK?: number
  threshold?: number
  includeMetadata?: boolean
}

export interface VectorSearchResult {
  id: string
  text: string
  score: number
  metadata?: any
}

/**
 * 将文本转换为向量嵌入（模拟实现）
 * 实际应用中应该使用 OpenAI Embeddings API 或其他嵌入模型
 */
export async function embedText(text: string): Promise<number[]> {
  // 模拟向量嵌入
  // 实际实现应该调用：
  // const response = await openai.embeddings.create({
  //   model: "text-embedding-ada-002",
  //   input: text,
  // })
  // return response.data[0].embedding

  // 这里返回一个模拟的向量
  const hash = simpleHash(text)
  const vector = new Array(128).fill(0).map((_, i) => {
    return Math.sin(hash + i) * 0.5 + 0.5
  })

  return vector
}

/**
 * 查找相似的文本（模拟实现）
 * 实际应用中应该使用向量数据库进行相似度搜索
 */
export async function findSimilar(
  query: string | number[],
  candidates: EmbeddingResult[],
  topK: number = 5,
  threshold: number = 0.7
): Promise<EmbeddingResult[]> {
  // 获取查询向量
  const queryVector = typeof query === 'string'
    ? await embedText(query)
    : query

  // 计算余弦相似度
  const similarities = candidates.map(candidate => ({
    ...candidate,
    similarity: cosineSimilarity(queryVector, candidate.vector)
  }))

  // 过滤和排序
  return similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('向量维度不匹配')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

/**
 * 简单的哈希函数（用于模拟）
 */
function simpleHash(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 向量数据库服务（未来可以替换为真实实现）
 */
export class VectorDatabase {
  private storage: Map<string, EmbeddingResult> = new Map()

  /**
   * 添加文档
   */
  async add(id: string, text: string, metadata?: any): Promise<void> {
    const vector = await embedText(text)
    this.storage.set(id, {
      text,
      vector,
      metadata
    })
  }

  /**
   * 批量添加文档
   */
  async addBatch(documents: Array<{ id: string; text: string; metadata?: any }>): Promise<void> {
    for (const doc of documents) {
      await this.add(doc.id, doc.text, doc.metadata)
    }
  }

  /**
   * 搜索相似文档
   */
  async search(query: string, topK: number = 5): Promise<EmbeddingResult[]> {
    const candidates = Array.from(this.storage.values())
    return findSimilar(query, candidates, topK)
  }

  /**
   * 删除文档
   */
  delete(id: string): boolean {
    return this.storage.delete(id)
  }

  /**
   * 清空数据库
   */
  clear(): void {
    this.storage.clear()
  }

  /**
   * 获取文档数量
   */
  size(): number {
    return this.storage.size
  }
}

// 导出默认实例
export const vectorDB = new VectorDatabase()
