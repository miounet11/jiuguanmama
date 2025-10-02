/**
 * MBTI Quiz Component Integration Tests
 * Tests personality assessment flow and calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MBTIQuiz from '@/components/onboarding/MBTIQuiz.vue';

describe('MBTIQuiz Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render quiz with first question', () => {
    const wrapper = mount(MBTIQuiz);

    expect(wrapper.find('.mbti-quiz').exists()).toBe(true);
    expect(wrapper.find('.question-text').text()).toContain('在社交场合中');
  });

  it('should display progress indicator', () => {
    const wrapper = mount(MBTIQuiz);

    const progress = wrapper.find('.progress-text');
    expect(progress.text()).toContain('1 / 8');
  });

  it('should navigate to next question when answer is selected', async () => {
    const wrapper = mount(MBTIQuiz);

    // Answer first question
    const firstAnswer = wrapper.findAll('.answer-button')[0];
    await firstAnswer.trigger('click');

    // Should move to next question
    const progress = wrapper.find('.progress-text');
    expect(progress.text()).toContain('2 / 8');
  });

  it('should navigate backwards through questions', async () => {
    const wrapper = mount(MBTIQuiz);

    // Answer first question
    await wrapper.findAll('.answer-button')[0].trigger('click');

    // Click back button
    const backButton = wrapper.find('.btn-back');
    await backButton.trigger('click');

    // Should be back to first question
    const progress = wrapper.find('.progress-text');
    expect(progress.text()).toContain('1 / 8');
  });

  it('should calculate MBTI type correctly - INTJ', async () => {
    const wrapper = mount(MBTIQuiz);

    // Answer all questions to produce INTJ
    // E/I questions: I (answer B)
    await wrapper.findAll('.answer-button')[1].trigger('click');
    await wrapper.findAll('.answer-button')[1].trigger('click');

    // S/N questions: N (answer B)
    await wrapper.findAll('.answer-button')[1].trigger('click');
    await wrapper.findAll('.answer-button')[1].trigger('click');

    // T/F questions: T (answer A)
    await wrapper.findAll('.answer-button')[0].trigger('click');
    await wrapper.findAll('.answer-button')[0].trigger('click');

    // J/P questions: J (answer A)
    await wrapper.findAll('.answer-button')[0].trigger('click');
    await wrapper.findAll('.answer-button')[0].trigger('click');

    // Check result
    expect(wrapper.vm.showResult).toBe(true);
    expect(wrapper.vm.mbtiType).toBe('INTJ');
  });

  it('should calculate MBTI type correctly - ENFP', async () => {
    const wrapper = mount(MBTIQuiz);

    // E/I: E (answer A)
    await wrapper.findAll('.answer-button')[0].trigger('click');
    await wrapper.findAll('.answer-button')[0].trigger('click');

    // S/N: N (answer B)
    await wrapper.findAll('.answer-button')[1].trigger('click');
    await wrapper.findAll('.answer-button')[1].trigger('click');

    // T/F: F (answer B)
    await wrapper.findAll('.answer-button')[1].trigger('click');
    await wrapper.findAll('.answer-button')[1].trigger('click');

    // J/P: P (answer B)
    await wrapper.findAll('.answer-button')[1].trigger('click');
    await wrapper.findAll('.answer-button')[1].trigger('click');

    // Check result
    expect(wrapper.vm.mbtiType).toBe('ENFP');
  });

  it('should emit complete event with MBTI type', async () => {
    const wrapper = mount(MBTIQuiz);

    // Complete quiz
    for (let i = 0; i < 8; i++) {
      await wrapper.findAll('.answer-button')[0].trigger('click');
    }

    // Click complete button
    const completeButton = wrapper.find('.btn-complete');
    await completeButton.trigger('click');

    // Check emitted event
    expect(wrapper.emitted('complete')).toBeTruthy();
    expect(wrapper.emitted('complete')![0]).toEqual(['ESTJ']);
  });

  it('should display correct personality description', async () => {
    const wrapper = mount(MBTIQuiz);

    // Answer to get INTJ
    for (let i = 0; i < 8; i++) {
      const answerIndex = i < 2 ? 1 : i < 4 ? 1 : i < 6 ? 0 : 0;
      await wrapper.findAll('.answer-button')[answerIndex].trigger('click');
    }

    // Check description
    const description = wrapper.find('.personality-description');
    expect(description.text()).toContain('建筑师');
    expect(description.text()).toContain('策略家');
  });

  it('should allow retaking the quiz', async () => {
    const wrapper = mount(MBTIQuiz);

    // Complete quiz
    for (let i = 0; i < 8; i++) {
      await wrapper.findAll('.answer-button')[0].trigger('click');
    }

    // Click retake button
    const retakeButton = wrapper.find('.btn-retake');
    await retakeButton.trigger('click');

    // Should reset to first question
    expect(wrapper.vm.currentQuestion).toBe(0);
    expect(wrapper.vm.answers).toEqual({});
    expect(wrapper.vm.showResult).toBe(false);
  });

  it('should handle edge case: exactly 50/50 split defaults to first option', async () => {
    const wrapper = mount(MBTIQuiz);

    // E/I: 1 E, 1 I -> should default to E
    await wrapper.findAll('.answer-button')[0].trigger('click'); // E
    await wrapper.findAll('.answer-button')[1].trigger('click'); // I

    // S/N: 1 S, 1 N -> should default to S
    await wrapper.findAll('.answer-button')[0].trigger('click'); // S
    await wrapper.findAll('.answer-button')[1].trigger('click'); // N

    // T/F: 1 T, 1 F -> should default to T
    await wrapper.findAll('.answer-button')[0].trigger('click'); // T
    await wrapper.findAll('.answer-button')[1].trigger('click'); // F

    // J/P: 1 J, 1 P -> should default to J
    await wrapper.findAll('.answer-button')[0].trigger('click'); // J
    await wrapper.findAll('.answer-button')[1].trigger('click'); // P

    // With 50/50 split, should default to first letter of each dimension
    expect(wrapper.vm.mbtiType).toBe('ESTJ');
  });

  it('should disable back button on first question', () => {
    const wrapper = mount(MBTIQuiz);

    const backButton = wrapper.find('.btn-back');
    expect(backButton.attributes('disabled')).toBeDefined();
  });

  it('should track selected answers correctly', async () => {
    const wrapper = mount(MBTIQuiz);

    // Answer first question with option A
    await wrapper.findAll('.answer-button')[0].trigger('click');

    expect(wrapper.vm.answers[0]).toBe('A');

    // Answer second question with option B
    await wrapper.findAll('.answer-button')[1].trigger('click');

    expect(wrapper.vm.answers[1]).toBe('B');
  });

  it('should allow changing previous answers', async () => {
    const wrapper = mount(MBTIQuiz);

    // Answer first question
    await wrapper.findAll('.answer-button')[0].trigger('click');
    expect(wrapper.vm.answers[0]).toBe('A');

    // Go back
    await wrapper.find('.btn-back').trigger('click');

    // Change answer
    await wrapper.findAll('.answer-button')[1].trigger('click');
    expect(wrapper.vm.answers[0]).toBe('B');
  });
});
