const fs = require('fs');
let content = fs.readFileSync('CommunityView.vue', 'utf8');

// 修复各种console.log为ElMessage
content = content.replace(
  /console\.log\('动态发布成功!'\)/g,
  'ElMessage.success(\'动态发布成功!\')'
);

content = content.replace(
  /console\.error\('发布动态失败'\)/g,
  'ElMessage.error(\'发布动态失败，请稍后重试\')'
);

content = content.replace(
  /console\.error\('操作失败'\)/g,
  'ElMessage.error(\'操作失败\')'
);

content = content.replace(
  /console\.log\('分享成功!'\)/g,
  'ElMessage.success(\'分享成功!\')'
);

content = content.replace(
  /console\.error\('分享失败'\)/g,
  'ElMessage.error(\'分享失败\')'
);

content = content.replace(
  /console\.log\('删除成功!'\)/g,
  'ElMessage.success(\'删除成功!\')'
);

content = content.replace(
  /console\.error\('删除失败'\)/g,
  'ElMessage.error(\'删除失败\')'
);

content = content.replace(
  /console\.log\('关注成功!'\)/g,
  'ElMessage.success(\'关注成功!\')'
);

content = content.replace(
  /console\.error\('关注失败'\)/g,
  'ElMessage.error(\'关注失败\')'
);

content = content.replace(
  /console\.error\('加载动态失败'\)/g,
  'ElMessage.error(\'加载动态失败，请稍后重试\')'
);

// 添加输入验证
content = content.replace(
  /const quickPost = async \(\) => \{\s*if \(!quickPostContent\.value\.trim\(\)\) return/,
  `const quickPost = async () => {
  if (!quickPostContent.value.trim()) {
    ElMessage.warning('请输入动态内容')
    return
  }`
);

// 处理API响应格式
content = content.replace(
  /:key="tag\.tag"/g,
  ':key="tag.tag || tag.name"'
);
content = content.replace(
  /#\{\{ tag\.tag \}\}/g,
  '#{{ tag.tag || tag.name }}'
);
content = content.replace(
  /@click="toggleTagFilter\(tag\.tag\)"/g,
  '@click="toggleTagFilter(tag.tag || tag.name)"'
);
content = content.replace(
  /:variant="selectedTags\.includes\(tag\.tag\)"/g,
  ':variant="selectedTags.includes(tag.tag || tag.name)"'
);

content = content.replace(
  /\{\{ user\.followerCount \}\}/g,
  '{{ user.followerCount || user._count?.followers || 0 }}'
);

content = content.replace(
  /\{\{ post\.likeCount \}\}/g,
  '{{ post.likeCount || post._count?.likes || 0 }}'
);

content = content.replace(
  /\{\{ post\.commentCount \}\}/g,
  '{{ post.commentCount || post._count?.comments || 0 }}'
);

fs.writeFileSync('CommunityView.vue', content);
console.log('社区页面修复完成！');
