/**
 * 首页功能测试脚本
 * 测试新重构的首页组件和功能
 */

const { chromium, firefox, webkit } = require('playwright');

async function testHomePage() {
  console.log('🧪 开始首页测试...\n');

  const browsers = [
    { name: 'Chromium', browser: chromium },
    { name: 'Firefox', browser: firefox },
    { name: 'WebKit', browser: webkit }
  ];

  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const { name, browser } of browsers) {
    console.log(`🌐 测试浏览器: ${name}`);

    try {
      const browserInstance = await browser.launch({ headless: false });
      const context = await browserInstance.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const page = await context.newPage();

      // 监听控制台错误
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // 监听网络错误
      const networkErrors = [];
      page.on('requestfailed', request => {
        networkErrors.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
      });

      // 导航到首页
      console.log('  📍 导航到首页...');
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

      // 测试1: 页面基本加载
      console.log('  🔍 检查页面基本结构...');
      await page.waitForSelector('.home-page', { timeout: 10000 });

      const heroSection = await page.$('.hero-section, [class*="HeroSection"]');
      const featuredSection = await page.$('.featured-characters, [class*="FeaturedCharacters"]');
      const featuresSection = await page.$('.feature-highlights, [class*="FeatureHighlights"]');
      const statsSection = await page.$('.stats-section, [class*="StatsSection"]');
      const ctaSection = await page.$('.cta-section, [class*="CTASection"]');

      if (heroSection && featuredSection && featuresSection && statsSection && ctaSection) {
        console.log('  ✅ 所有主要区块已加载');
        results.passed++;
      } else {
        console.log('  ❌ 某些主要区块未加载');
        results.failed++;
        results.details.push(`${name}: 主要区块加载失败`);
      }

      // 测试2: 响应式设计
      console.log('  📱 测试响应式设计...');

      // 测试移动端视图
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      const mobileView = await page.screenshot({ path: `homepage-mobile-${name.toLowerCase()}.png` });
      console.log('  📸 移动端截图已保存');

      // 测试平板视图
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);

      const tabletView = await page.screenshot({ path: `homepage-tablet-${name.toLowerCase()}.png` });
      console.log('  📸 平板端截图已保存');

      // 恢复桌面视图
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);

      // 测试3: 交互功能
      console.log('  🖱️ 测试交互功能...');

      // 测试快速开始按钮
      const quickStartButton = await page.$('button[class*="quick-start"], .quick-start-fab button');
      if (quickStartButton) {
        await quickStartButton.click();
        await page.waitForTimeout(500);

        const dialog = await page.$('.quick-start-dialog, [class*="QuickStartDialog"]');
        if (dialog) {
          console.log('  ✅ 快速开始对话框正常工作');

          // 关闭对话框
          const closeButton = await page.$('.quick-start-dialog .close, .el-dialog__close');
          if (closeButton) {
            await closeButton.click();
          } else {
            await page.keyboard.press('Escape');
          }

          results.passed++;
        } else {
          console.log('  ❌ 快速开始对话框未打开');
          results.failed++;
          results.details.push(`${name}: 快速开始对话框功能异常`);
        }
      }

      // 测试4: 性能指标
      console.log('  ⚡ 检查性能指标...');

      const performanceMetrics = await page.evaluate(() => {
        return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
      });

      const loadTime = performanceMetrics.loadEventEnd - performanceMetrics.fetchStart;
      const domContentLoaded = performanceMetrics.domContentLoadedEventEnd - performanceMetrics.fetchStart;

      console.log(`    ⏱️ 页面加载时间: ${loadTime.toFixed(2)}ms`);
      console.log(`    ⏱️ DOM内容加载: ${domContentLoaded.toFixed(2)}ms`);

      if (loadTime < 3000) {
        console.log('  ✅ 页面加载性能良好');
        results.passed++;
      } else {
        console.log('  ⚠️ 页面加载较慢');
        results.details.push(`${name}: 页面加载时间 ${loadTime.toFixed(2)}ms`);
      }

      // 测试5: 可访问性
      console.log('  ♿ 检查可访问性...');

      // 检查图片alt属性
      const imagesWithoutAlt = await page.$$eval('img', imgs =>
        imgs.filter(img => !img.alt || img.alt.trim() === '').length
      );

      if (imagesWithoutAlt === 0) {
        console.log('  ✅ 所有图片都有alt属性');
        results.passed++;
      } else {
        console.log(`  ⚠️ 发现 ${imagesWithoutAlt} 张图片缺少alt属性`);
        results.details.push(`${name}: ${imagesWithoutAlt} 张图片缺少alt属性`);
      }

      // 检查按钮可访问性
      const buttonsWithoutLabel = await page.$$eval('button', buttons =>
        buttons.filter(btn => {
          const hasText = btn.textContent && btn.textContent.trim() !== '';
          const hasAriaLabel = btn.getAttribute('aria-label');
          const hasTitle = btn.getAttribute('title');
          return !hasText && !hasAriaLabel && !hasTitle;
        }).length
      );

      if (buttonsWithoutLabel === 0) {
        console.log('  ✅ 所有按钮都有可访问的标签');
        results.passed++;
      } else {
        console.log(`  ⚠️ 发现 ${buttonsWithoutLabel} 个按钮缺少可访问标签`);
        results.details.push(`${name}: ${buttonsWithoutLabel} 个按钮缺少可访问标签`);
      }

      // 测试6: 错误检查
      if (consoleErrors.length > 0) {
        console.log('  ❌ 控制台错误:');
        consoleErrors.forEach(error => {
          console.log(`    - ${error}`);
        });
        results.failed++;
        results.details.push(`${name}: ${consoleErrors.length} 个控制台错误`);
      } else {
        console.log('  ✅ 无控制台错误');
        results.passed++;
      }

      if (networkErrors.length > 0) {
        console.log('  ❌ 网络错误:');
        networkErrors.forEach(error => {
          console.log(`    - ${error}`);
        });
        results.failed++;
        results.details.push(`${name}: ${networkErrors.length} 个网络错误`);
      } else {
        console.log('  ✅ 无网络错误');
        results.passed++;
      }

      // 保存完整页面截图
      await page.screenshot({
        path: `homepage-full-${name.toLowerCase()}.png`,
        fullPage: true
      });
      console.log('  📸 完整页面截图已保存');

      await browserInstance.close();
      console.log(`  🎉 ${name} 测试完成\n`);

    } catch (error) {
      console.error(`  ❌ ${name} 测试失败:`, error.message);
      results.failed++;
      results.details.push(`${name}: 测试执行失败 - ${error.message}`);
    }
  }

  // 输出测试结果
  console.log('📊 测试结果汇总:');
  console.log(`  ✅ 通过: ${results.passed}`);
  console.log(`  ❌ 失败: ${results.failed}`);
  console.log(`  📈 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.details.length > 0) {
    console.log('\n⚠️ 需要关注的问题:');
    results.details.forEach(detail => {
      console.log(`  - ${detail}`);
    });
  }

  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    },
    details: results.details,
    recommendations: [
      '确保所有图片都有描述性的alt属性',
      '为所有交互元素提供清晰的标签',
      '持续监控页面加载性能',
      '定期进行跨浏览器测试',
      '使用自动化工具进行可访问性检查'
    ]
  };

  require('fs').writeFileSync(
    'homepage-test-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 详细测试报告已保存到 homepage-test-report.json');
  console.log('🏁 首页测试完成！');
}

// 辅助函数：延迟执行
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 如果直接运行此脚本
if (require.main === module) {
  testHomePage().catch(console.error);
}

module.exports = { testHomePage };