"use strict";
/**
 * 向量嵌入服务（简化实现）
 * 未来可以集成真正的向量数据库如 Pinecone, Weaviate, ChromaDB 等
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorDB = exports.VectorDatabase = void 0;
exports.embedText = embedText;
exports.findSimilar = findSimilar;
/**
 * 将文本转换为向量嵌入（模拟实现）
 * 实际应用中应该使用 OpenAI Embeddings API 或其他嵌入模型
 */
async function embedText(text) {
    // 模拟向量嵌入
    // 实际实现应该调用：
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-ada-002",
    //   input: text,
    // })
    // return response.data[0].embedding
    // 这里返回一个模拟的向量
    const hash = simpleHash(text);
    const vector = new Array(128).fill(0).map((_, i) => {
        return Math.sin(hash + i) * 0.5 + 0.5;
    });
    return vector;
}
/**
 * 查找相似的文本（模拟实现）
 * 实际应用中应该使用向量数据库进行相似度搜索
 */
async function findSimilar(query, candidates, topK = 5, threshold = 0.7) {
    // 获取查询向量
    const queryVector = typeof query === 'string'
        ? await embedText(query)
        : query;
    // 计算余弦相似度
    const similarities = candidates.map(candidate => ({
        ...candidate,
        similarity: cosineSimilarity(queryVector, candidate.vector)
    }));
    // 过滤和排序
    return similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}
/**
 * 计算余弦相似度
 */
function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('向量维度不匹配');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (normA * normB);
}
/**
 * 简单的哈希函数（用于模拟）
 */
function simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
/**
 * 向量数据库服务（未来可以替换为真实实现）
 */
class VectorDatabase {
    storage = new Map();
    /**
     * 添加文档
     */
    async add(id, text, metadata) {
        const vector = await embedText(text);
        this.storage.set(id, {
            text,
            vector,
            metadata
        });
    }
    /**
     * 批量添加文档
     */
    async addBatch(documents) {
        for (const doc of documents) {
            await this.add(doc.id, doc.text, doc.metadata);
        }
    }
    /**
     * 搜索相似文档
     */
    async search(query, topK = 5) {
        const candidates = Array.from(this.storage.values());
        return findSimilar(query, candidates, topK);
    }
    /**
     * 删除文档
     */
    delete(id) {
        return this.storage.delete(id);
    }
    /**
     * 清空数据库
     */
    clear() {
        this.storage.clear();
    }
    /**
     * 获取文档数量
     */
    size() {
        return this.storage.size;
    }
}
exports.VectorDatabase = VectorDatabase;
// 导出默认实例
exports.vectorDB = new VectorDatabase();
//# sourceMappingURL=embedding.js.map