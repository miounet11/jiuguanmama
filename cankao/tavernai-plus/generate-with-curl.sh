#!/bin/bash

# 使用curl批量生成头像的脚本
# 避开Node.js网络问题

API_KEY="sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY"
API_URL="https://ttkk.inping.com/v1/images/generations"
OUTPUT_DIR="./apps/web/public/uploads/characters/avatars"

# 确保输出目录存在
mkdir -p "$OUTPUT_DIR"

echo "🎨 开始使用curl批量生成头像..."

# 定义一些测试提示词
prompts=(
    "高质量动漫风格头像，精灵女性，银白色长发，绿宝石眼眸，月亮魔法师，温柔表情，4K分辨率，头像构图"
    "高质量动漫风格头像，兽人战士，深褐色皮肤，黑色发辫，琥珀色眼眸，勇敢表情，4K分辨率，头像构图"
    "高质量动漫风格头像，科幻AI角色，全息投影效果，蓝色光芒，科技元素，神秘表情，4K分辨率，头像构图"
    "高质量动漫风格头像，星际舰长，未来军装，坚毅表情，自信气质，4K分辨率，头像构图"
    "高质量动漫风格头像，心理咨询师，温暖笑容，现代职业装，治愈系气质，4K分辨率，头像构图"
)

counter=1
for prompt in "${prompts[@]}"; do
    echo ""
    echo "[$counter/${#prompts[@]}] 生成头像: ${prompt:0:50}..."

    # 发送请求并保存响应
    response=$(curl -s -X POST "$API_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"nano-banana\",
            \"prompt\": \"$prompt\",
            \"n\": 1,
            \"size\": \"512x512\",
            \"quality\": \"standard\"
        }" \
        --connect-timeout 30 \
        --max-time 300)

    if [ $? -eq 0 ]; then
        # 提取图像URL
        image_url=$(echo "$response" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

        if [ ! -z "$image_url" ]; then
            echo "✅ 生成成功: $image_url"

            # 下载图像
            filename="curl-gen-$counter-$(date +%s).png"
            echo "📥 下载图像: $filename"

            curl -s -o "$OUTPUT_DIR/$filename" "$image_url" --connect-timeout 30 --max-time 60

            if [ $? -eq 0 ]; then
                echo "💾 保存成功: $OUTPUT_DIR/$filename"
                echo "🌐 公共URL: /uploads/characters/avatars/$filename"
            else
                echo "❌ 下载失败"
            fi
        else
            echo "❌ 响应中未找到图像URL"
            echo "📄 响应: ${response:0:200}..."
        fi
    else
        echo "❌ API请求失败"
    fi

    # 延迟避免请求过频
    if [ $counter -lt ${#prompts[@]} ]; then
        echo "⏱️ 等待5秒..."
        sleep 5
    fi

    ((counter++))
done

echo ""
echo "🎉 批量生成完成!"
echo "📁 检查生成的文件:"
ls -la "$OUTPUT_DIR"/curl-gen-* 2>/dev/null || echo "   没有新生成的文件"

echo ""
echo "💡 接下来:"
echo "   1. 检查生成的头像文件"
echo "   2. 运行: node update-database-avatars.js"
echo "   3. 验证前端显示效果"
