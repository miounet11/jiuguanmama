/**
 * 向量嵌入服务（简化实现）
 * 未来可以集成真正的向量数据库如 Pinecone, Weaviate, ChromaDB 等
 */
export interface EmbeddingResult {
    text: string;
    vector: number[];
    metadata?: any;
}
export interface VectorSearchRequest {
    query: string;
    collection?: string;
    topK?: number;
    threshold?: number;
    includeMetadata?: boolean;
}
export interface VectorSearchResult {
    id: string;
    text: string;
    score: number;
    metadata?: any;
}
/**
 * 将文本转换为向量嵌入（模拟实现）
 * 实际应用中应该使用 OpenAI Embeddings API 或其他嵌入模型
 */
export declare function embedText(text: string): Promise<number[]>;
/**
 * 查找相似的文本（模拟实现）
 * 实际应用中应该使用向量数据库进行相似度搜索
 */
export declare function findSimilar(query: string | number[], candidates: EmbeddingResult[], topK?: number, threshold?: number): Promise<EmbeddingResult[]>;
/**
 * 向量数据库服务（未来可以替换为真实实现）
 */
export declare class VectorDatabase {
    private storage;
    /**
     * 添加文档
     */
    add(id: string, text: string, metadata?: any): Promise<void>;
    /**
     * 批量添加文档
     */
    addBatch(documents: Array<{
        id: string;
        text: string;
        metadata?: any;
    }>): Promise<void>;
    /**
     * 搜索相似文档
     */
    search(query: string, topK?: number): Promise<EmbeddingResult[]>;
    /**
     * 删除文档
     */
    delete(id: string): boolean;
    /**
     * 清空数据库
     */
    clear(): void;
    /**
     * 获取文档数量
     */
    size(): number;
}
export declare const vectorDB: VectorDatabase;
//# sourceMappingURL=embedding.d.ts.map