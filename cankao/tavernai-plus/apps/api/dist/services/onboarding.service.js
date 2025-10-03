"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingService = exports.OnboardingService = void 0;
const client_1 = require("../../node_modules/.prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * OnboardingService
 *
 * Manages user onboarding flow, role selection, and personalized recommendations.
 * Implements F3 (Intelligent Onboarding) feature.
 */
class OnboardingService {
    ONBOARDING_TUTORIAL_ID = 'initial-onboarding';
    TOTAL_STEPS = 5;
    // MBTI personality mappings to character traits
    mbtiCharacterMappings = {
        // Analysts
        'INTJ': ['strategic', 'independent', 'analytical', 'visionary'],
        'INTP': ['logical', 'curious', 'innovative', 'abstract'],
        'ENTJ': ['commanding', 'strategic', 'efficient', 'decisive'],
        'ENTP': ['inventive', 'clever', 'outspoken', 'quick-witted'],
        // Diplomats
        'INFJ': ['insightful', 'idealistic', 'compassionate', 'creative'],
        'INFP': ['idealistic', 'empathetic', 'creative', 'adaptable'],
        'ENFJ': ['charismatic', 'altruistic', 'natural-leader', 'diplomatic'],
        'ENFP': ['enthusiastic', 'creative', 'sociable', 'energetic'],
        // Sentinels
        'ISTJ': ['reliable', 'practical', 'fact-minded', 'responsible'],
        'ISFJ': ['caring', 'protective', 'practical', 'warm'],
        'ESTJ': ['organized', 'traditional', 'administrator', 'dedicated'],
        'ESFJ': ['caring', 'social', 'popular', 'conscientious'],
        // Explorers
        'ISTP': ['bold', 'practical', 'experimental', 'flexible'],
        'ISFP': ['charming', 'sensitive', 'artistic', 'curious'],
        'ESTP': ['energetic', 'perceptive', 'direct', 'sociable'],
        'ESFP': ['spontaneous', 'enthusiastic', 'entertaining', 'friendly'],
    };
    /**
     * Start onboarding for a user
     */
    async startOnboarding(userId) {
        try {
            // Check if onboarding already exists
            let progress = await prisma.tutorialProgress.findUnique({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId: this.ONBOARDING_TUTORIAL_ID,
                    },
                },
            });
            if (!progress) {
                // Create new onboarding progress
                progress = await prisma.tutorialProgress.create({
                    data: {
                        userId,
                        tutorialId: this.ONBOARDING_TUTORIAL_ID,
                        currentStep: 0,
                        totalSteps: this.TOTAL_STEPS,
                        completed: false,
                        skipped: false,
                    },
                });
            }
            return {
                completed: progress.completed,
                currentStep: progress.currentStep,
                totalSteps: progress.totalSteps,
            };
        }
        catch (error) {
            console.error('Error starting onboarding:', error);
            throw error;
        }
    }
    /**
     * Complete an onboarding step
     */
    async completeStep(userId, stepData) {
        try {
            // Get current progress
            const progress = await prisma.tutorialProgress.findUnique({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId: this.ONBOARDING_TUTORIAL_ID,
                    },
                },
            });
            if (!progress) {
                throw new Error('Onboarding not started');
            }
            if (progress.completed) {
                throw new Error('Onboarding already completed');
            }
            // Update progress
            const nextStep = progress.currentStep + 1;
            const isComplete = nextStep >= progress.totalSteps;
            await prisma.tutorialProgress.update({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId: this.ONBOARDING_TUTORIAL_ID,
                    },
                },
                data: {
                    currentStep: nextStep,
                    completed: isComplete,
                    completedAt: isComplete ? new Date() : null,
                },
            });
            // Store step data in user preferences
            await this.storeStepData(userId, stepData);
            // If completed, unlock achievement and send notification
            if (isComplete) {
                await this.completeOnboarding(userId);
            }
            return {
                completed: isComplete,
                currentStep: nextStep,
                totalSteps: progress.totalSteps,
            };
        }
        catch (error) {
            console.error('Error completing onboarding step:', error);
            throw error;
        }
    }
    /**
     * Get personalized recommendations based on interests and MBTI
     */
    async getRecommendations(userId, interests, mbtiType) {
        try {
            const recommendations = [];
            // Get character traits based on MBTI
            const preferredTraits = mbtiType ? this.mbtiCharacterMappings[mbtiType] || [] : [];
            // Build search conditions
            const searchConditions = [];
            // Match by interests (in tags)
            if (interests.length > 0) {
                searchConditions.push({
                    OR: interests.map(interest => ({
                        tags: {
                            contains: interest,
                        },
                    })),
                });
            }
            // Match by MBTI traits (in personality or description)
            if (preferredTraits.length > 0) {
                searchConditions.push({
                    OR: preferredTraits.map(trait => ({
                        OR: [
                            { personality: { contains: trait, mode: 'insensitive' } },
                            { description: { contains: trait, mode: 'insensitive' } },
                        ],
                    })),
                });
            }
            // Get matching characters
            const characters = await prisma.character.findMany({
                where: searchConditions.length > 0 ? { AND: searchConditions } : {},
                take: 10,
                orderBy: {
                    rating: 'desc',
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    personality: true,
                    tags: true,
                    rating: true,
                },
            });
            // Calculate match scores
            for (const char of characters) {
                let matchScore = 0;
                const matchReasons = [];
                // Score based on interest matches
                const charTags = JSON.parse(char.tags || '[]');
                const interestMatches = interests.filter(interest => charTags.some((tag) => tag.toLowerCase().includes(interest.toLowerCase())));
                if (interestMatches.length > 0) {
                    matchScore += interestMatches.length * 20;
                    matchReasons.push(`兴趣匹配: ${interestMatches.join(', ')}`);
                }
                // Score based on MBTI trait matches
                if (mbtiType && preferredTraits.length > 0) {
                    const personality = char.personality?.toLowerCase() || '';
                    const description = char.description?.toLowerCase() || '';
                    const traitMatches = preferredTraits.filter(trait => personality.includes(trait) || description.includes(trait));
                    if (traitMatches.length > 0) {
                        matchScore += traitMatches.length * 15;
                        matchReasons.push(`性格匹配: ${mbtiType}`);
                    }
                }
                // Boost based on rating
                matchScore += (char.rating || 0) * 2;
                recommendations.push({
                    characterId: char.id,
                    name: char.name,
                    description: char.description,
                    matchScore,
                    matchReason: matchReasons.join('; ') || '推荐角色',
                });
            }
            // Sort by match score and return top 5
            return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
        }
        catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }
    /**
     * Skip onboarding
     */
    async skipOnboarding(userId) {
        try {
            await prisma.tutorialProgress.upsert({
                where: {
                    userId_tutorialId: {
                        userId,
                        tutorialId: this.ONBOARDING_TUTORIAL_ID,
                    },
                },
                update: {
                    skipped: true,
                    completed: true,
                    completedAt: new Date(),
                },
                create: {
                    userId,
                    tutorialId: this.ONBOARDING_TUTORIAL_ID,
                    currentStep: this.TOTAL_STEPS,
                    totalSteps: this.TOTAL_STEPS,
                    completed: true,
                    skipped: true,
                    completedAt: new Date(),
                },
            });
            return true;
        }
        catch (error) {
            console.error('Error skipping onboarding:', error);
            return false;
        }
    }
    /**
     * Store step data in user preferences
     */
    async storeStepData(userId, stepData) {
        // Handle role selection
        if (stepData.stepId === 'role-selection' && stepData.data.role) {
            await prisma.userPreferenceExtended.upsert({
                where: { userId },
                update: {
                    primaryRole: stepData.data.role,
                },
                create: {
                    userId,
                    primaryRole: stepData.data.role,
                },
            });
        }
        // Handle interests and MBTI
        if (stepData.stepId === 'interests' || stepData.stepId === 'mbti-quiz') {
            // Store in UserProfile if it exists
            await prisma.userProfile.upsert({
                where: { userId },
                update: {
                    interests: stepData.data.interests
                        ? JSON.stringify(stepData.data.interests)
                        : undefined,
                    mbtiType: stepData.data.mbtiType || undefined,
                },
                create: {
                    userId,
                    interests: stepData.data.interests
                        ? JSON.stringify(stepData.data.interests)
                        : '[]',
                    mbtiType: stepData.data.mbtiType || null,
                },
            });
        }
    }
    /**
     * Complete onboarding and unlock achievement
     */
    async completeOnboarding(userId) {
        try {
            // Create achievement unlock (if achievements system exists)
            try {
                await prisma.userAchievement.create({
                    data: {
                        userId,
                        achievementId: 'onboarding-complete',
                        progress: 100,
                        isUnlocked: true,
                        unlockedAt: new Date(),
                    },
                });
            }
            catch (e) {
                // Achievement might already exist or achievement system not available
            }
            // Send completion notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'achievement',
                    title: '欢迎来到时空酒馆！',
                    description: '您已完成新手引导，开始您的冒险之旅吧！',
                    icon: 'CheckCircle',
                    priority: 'normal',
                },
            });
        }
        catch (error) {
            console.error('Error completing onboarding:', error);
        }
    }
}
exports.OnboardingService = OnboardingService;
// Export singleton instance
exports.onboardingService = new OnboardingService();
//# sourceMappingURL=onboarding.service.js.map