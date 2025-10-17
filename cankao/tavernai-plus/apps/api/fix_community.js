const fs = require('fs');
let content = fs.readFileSync('CommunityView.vue', 'utf8');

// 1. 修复quickPost函数 - 添加输入验证
content = content.replace(
  /const quickPost = async \(\) => \{\s*if \(!quickPostContent\.value\.trim\(\)\) return/,
  'const quickPost = async () => {\n  if (!quickPostContent.value.trim()) {\n    ElMessage.warning(\'请输入动态内容\')\n    return\n  }'
);

// 2. 修复quickPost函数 - 添加错误处理
content = content.replace(
  /  } catch \(error\) \{\s*console\.error\('发布动态失败:'\', error\)\s*console\.error\('发布动态失败'\)/s,
  '  } catch (error) {\n    console.error(\'发布动态失败:\', error)\n    ElMessage.error(\'发布动态失败，请稍后重试\')'
);

// 3. 修复handlePostCreated函数
content = content.replace(
  /const handlePostCreated = \(post: Post\) => \{\s*posts\.value\.unshift\(post\)\s*console\.log\('动态发布成功!'\)/s,
  'const handlePostCreated = (post: Post) => {\n  posts.value.unshift(post)\n  ElMessage.success(\'动态发布成功!\')'
);

// 4. 修复handleLikePost函数
content = content.replace(
  /  } catch \(error\) \{\s*console\.error\('点赞失败:'\', error\)\s*console\.error\('操作失败'\)/s,
  '  } catch (error) {\n    console.error(\'点赞失败:\', error)\n    ElMessage.error(\'操作失败\')'
);

// 5. 修复handleSharePost函数
content = content.replace(
  /      console\.log\('分享成功!'\)/s,
  '      ElMessage.success(\'分享成功!\')'
);

content = content.replace(
  /  } catch \(error\) \{\s*console\.error\('分享失败:'\', error\)\s*console\.error\('分享失败'\)/s,
  '  } catch (error) {\n    console.error(\'分享失败:\', error)\n    ElMessage.error(\'分享失败\')'
);

// 6. 修复handleDeletePost函数
content = content.replace(
  /      console\.log\('删除成功!'\)/s,
  '      ElMessage.success(\'删除成功!\')'
);

content = content.replace(
  /  } catch \(error\) \{\s*console\.error\('删除失败:'\', error\)\s*console\.error\('删除失败'\)/s,
  '  } catch (error) {\n    console.error(\'删除失败:\', error)\n    ElMessage.error(\'删除失败\')'
);

// 7. 修复followUser函数
content = content.replace(
  /      console\.log\('关注成功!'\)/s,
  '      ElMessage.success(\'关注成功!\')'
);

content = content.replace(
  /  } catch \(error\) \{\s*console\.error\('关注失败:'\', error\)\s*console\.error\('关注失败'\)/s,
  '  } catch (error) {\n    console.error(\'关注失败:\', error)\n    ElMessage.error(\'关注失败\')'
);

// 8. 修复loadPosts函数
content = content.replace(
  /  } catch \(error\) \{\s*console\.error\('加载动态失败:'\', error\)\s*console\.error\('加载动态失败'\)/s,
  '  } catch (error) {\n    console.error(\'加载动态失败:\', error)\n    ElMessage.error(\'加载动态失败，请稍后重试\')'
);

// 9. 修复模板中的数据绑定
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

fs.writeFileSync('CommunityView.vue', content);
console.log('社区页面修复完成！');
