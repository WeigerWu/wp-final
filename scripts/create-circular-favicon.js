const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createCircularFavicon() {
  const inputPath = path.join(__dirname, '../imcook_icon.png');
  const outputPath = path.join(__dirname, '../public/favicon.png');
  const outputIcoPath = path.join(__dirname, '../public/favicon.ico');

  try {
    // 讀取原始圖片並獲取尺寸
    const metadata = await sharp(inputPath).metadata();
    const size = Math.min(metadata.width, metadata.height);
    
    // 創建圓形遮罩
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`
    );

    // 處理圖片：調整大小、應用圓形遮罩
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .composite([
        {
          input: mask,
          blend: 'dest-in'
        }
      ])
      .png()
      .toFile(outputPath);

    // 同時創建 ICO 格式（32x32）
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .composite([
        {
          input: Buffer.from(
            `<svg width="32" height="32">
              <circle cx="16" cy="16" r="16" fill="white"/>
            </svg>`
          ),
          blend: 'dest-in'
        }
      ])
      .png()
      .toFile(outputIcoPath);

    console.log('✅ 圓形 favicon 已成功創建！');
    console.log(`   - ${outputPath}`);
    console.log(`   - ${outputIcoPath}`);
  } catch (error) {
    console.error('❌ 創建 favicon 時發生錯誤:', error);
    process.exit(1);
  }
}

createCircularFavicon();

