/**
 * Gamification Store Integration Tests
 * Tests gamification data management and state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGamificationStore } from '@/stores/gamification';
import { gamificationApi } from '@/services/gamificationApi';

// Mock the API
vi.mock('@/services/gamificationApi', () => ({
  gamificationApi: {
    getOverview: vi.fn(),
    getAffinityList: vi.fn(),
    getProficiencyList: vi.fn(),
    getAchievements: vi.fn(),
    getDailyQuests: vi.fn(),
  },
}));

describe('Gamification Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('fetchOverview', () => {
    it('should fetch and store overview data', async () => {
      const mockOverview = {
        level: 12,
        experience: 2500,
        nextLevelExp: 3000,
        totalAchievements: 25,
        unlockedAchievements: 18,
        totalQuests: 10,
        completedQuests: 7,
        averageAffinity: 6.5,
        highestProficiency: 35,
      };

      vi.mocked(gamificationApi.getOverview).mockResolvedValue({
        success: true,
        data: mockOverview,
      });

      const store = useGamificationStore();
      await store.fetchOverview();

      expect(store.overview).toEqual(mockOverview);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      vi.mocked(gamificationApi.getOverview).mockRejectedValue(
        new Error('Failed to fetch')
      );

      const store = useGamificationStore();
      await store.fetchOverview();

      expect(store.overview).toBeNull();
      expect(store.error).toBe('Failed to fetch');
    });
  });

  describe('fetchAffinityList', () => {
    it('should fetch and store affinity relationships', async () => {
      const mockAffinity = [
        {
          characterId: 'char-1',
          characterName: 'Alice',
          level: 8,
          experience: 1200,
          nextLevelExp: 1500,
          lastInteraction: new Date(),
        },
        {
          characterId: 'char-2',
          characterName: 'Bob',
          level: 5,
          experience: 600,
          nextLevelExp: 800,
          lastInteraction: new Date(),
        },
      ];

      vi.mocked(gamificationApi.getAffinityList).mockResolvedValue({
        success: true,
        data: mockAffinity,
      });

      const store = useGamificationStore();
      await store.fetchAffinityList({ limit: 10 });

      expect(store.affinityList).toEqual(mockAffinity);
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchProficiencyList', () => {
    it('should fetch and store proficiency skills', async () => {
      const mockProficiency = [
        {
          skillId: 'skill-1',
          skillName: 'Eloquence',
          level: 25,
          category: 'social',
        },
        {
          skillId: 'skill-2',
          skillName: 'Combat',
          level: 15,
          category: 'action',
        },
      ];

      vi.mocked(gamificationApi.getProficiencyList).mockResolvedValue({
        success: true,
        data: mockProficiency,
      });

      const store = useGamificationStore();
      await store.fetchProficiencyList();

      expect(store.proficiencyList).toEqual(mockProficiency);
    });
  });

  describe('fetchAchievements', () => {
    it('should fetch all achievements', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          name: 'First Contact',
          description: 'Talk to 5 characters',
          icon: 'chat',
          unlocked: true,
          unlockedAt: new Date(),
          progress: 5,
          maxProgress: 5,
        },
        {
          id: 'ach-2',
          name: 'Social Butterfly',
          description: 'Talk to 20 characters',
          icon: 'users',
          unlocked: false,
          progress: 12,
          maxProgress: 20,
        },
      ];

      vi.mocked(gamificationApi.getAchievements).mockResolvedValue({
        success: true,
        data: mockAchievements,
      });

      const store = useGamificationStore();
      await store.fetchAchievements();

      expect(store.achievements).toEqual(mockAchievements);
    });

    it('should filter unlocked achievements', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          name: 'Achievement 1',
          unlocked: true,
          progress: 10,
          maxProgress: 10,
        },
        {
          id: 'ach-2',
          name: 'Achievement 2',
          unlocked: false,
          progress: 5,
          maxProgress: 10,
        },
      ];

      vi.mocked(gamificationApi.getAchievements).mockResolvedValue({
        success: true,
        data: mockAchievements,
      });

      const store = useGamificationStore();
      await store.fetchAchievements({ unlocked: true });

      // Verify API was called with correct filter
      expect(gamificationApi.getAchievements).toHaveBeenCalledWith({ unlocked: true });
    });
  });

  describe('fetchDailyQuests', () => {
    it('should fetch daily quests', async () => {
      const mockQuests = [
        {
          id: 'quest-1',
          title: 'Daily Chat',
          description: 'Have 3 conversations',
          reward: 100,
          progress: 2,
          maxProgress: 3,
          completed: false,
          expiresAt: new Date(),
        },
        {
          id: 'quest-2',
          title: 'Explorer',
          description: 'Visit 2 scenarios',
          reward: 150,
          progress: 2,
          maxProgress: 2,
          completed: true,
          completedAt: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(gamificationApi.getDailyQuests).mockResolvedValue({
        success: true,
        data: mockQuests,
      });

      const store = useGamificationStore();
      await store.fetchDailyQuests();

      expect(store.dailyQuests).toEqual(mockQuests);
    });
  });

  describe('computed properties', () => {
    it('should calculate unlockedAchievements correctly', async () => {
      vi.mocked(gamificationApi.getAchievements).mockResolvedValue({
        success: true,
        data: [
          { id: 'a1', unlocked: true, progress: 10, maxProgress: 10 },
          { id: 'a2', unlocked: true, progress: 5, maxProgress: 5 },
          { id: 'a3', unlocked: false, progress: 3, maxProgress: 10 },
        ],
      });

      const store = useGamificationStore();
      await store.fetchAchievements();

      expect(store.unlockedAchievements).toHaveLength(2);
    });

    it('should calculate lockedAchievements correctly', async () => {
      vi.mocked(gamificationApi.getAchievements).mockResolvedValue({
        success: true,
        data: [
          { id: 'a1', unlocked: true, progress: 10, maxProgress: 10 },
          { id: 'a2', unlocked: false, progress: 3, maxProgress: 10 },
          { id: 'a3', unlocked: false, progress: 7, maxProgress: 15 },
        ],
      });

      const store = useGamificationStore();
      await store.fetchAchievements();

      expect(store.lockedAchievements).toHaveLength(2);
    });

    it('should calculate activeQuests correctly', async () => {
      vi.mocked(gamificationApi.getDailyQuests).mockResolvedValue({
        success: true,
        data: [
          { id: 'q1', completed: false, progress: 1, maxProgress: 3, expiresAt: new Date() },
          { id: 'q2', completed: true, progress: 5, maxProgress: 5, expiresAt: new Date() },
          { id: 'q3', completed: false, progress: 2, maxProgress: 4, expiresAt: new Date() },
        ],
      });

      const store = useGamificationStore();
      await store.fetchDailyQuests();

      expect(store.activeQuests).toHaveLength(2);
    });

    it('should calculate completedQuests correctly', async () => {
      vi.mocked(gamificationApi.getDailyQuests).mockResolvedValue({
        success: true,
        data: [
          { id: 'q1', completed: true, progress: 3, maxProgress: 3, expiresAt: new Date() },
          { id: 'q2', completed: true, progress: 5, maxProgress: 5, expiresAt: new Date() },
          { id: 'q3', completed: false, progress: 2, maxProgress: 4, expiresAt: new Date() },
        ],
      });

      const store = useGamificationStore();
      await store.fetchDailyQuests();

      expect(store.completedQuests).toHaveLength(2);
    });
  });

  describe('resetState', () => {
    it('should reset all state to initial values', async () => {
      vi.mocked(gamificationApi.getOverview).mockResolvedValue({
        success: true,
        data: { level: 10, experience: 1000, totalAchievements: 20 },
      });

      const store = useGamificationStore();
      await store.fetchOverview();

      expect(store.overview).not.toBeNull();

      store.resetState();

      expect(store.overview).toBeNull();
      expect(store.affinityList).toEqual([]);
      expect(store.proficiencyList).toEqual([]);
      expect(store.achievements).toEqual([]);
      expect(store.dailyQuests).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
