import Sprite from '../base/sprite';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const BACKGROUND_IMAGE_SRC = 'images/bg.jpg';
const BACKGROUND_WIDTH = 240;
const BACKGROUND_HEIGHT = 240;
const BACKGROUND_SPEED = 2;

/**
 * 背景类，使用帧动画模拟GIF效果
 */
export default class BackGround {
  constructor(ctx) {
    // 背景帧序列
    this.frames = []
    this.framesCount = 0
    this.currentFrame = 0
    this.frameInterval = 3 // 调整帧率，数字越小动画越快
    this.isAllFramesLoaded = false
    this.loadedFramesCount = 0
    
    // 加载所有帧图片
    this.loadFrames()
  }
  
  loadFrames() {
    // 总共有57张图片
    const framesCount = 57
    
    // 创建图片加载状态检查
    for (let i = 1; i <= framesCount; i++) {
      const img = wx.createImage()
      
      // 添加加载完成回调
      img.onload = () => {
        this.loadedFramesCount++
        if (this.loadedFramesCount === framesCount) {
          console.log('所有背景帧加载完成')
          this.isAllFramesLoaded = true
        }
      }
      
      img.onerror = (e) => {
        console.error(`无法加载背景帧图片 ${i}.png:`, e)
      }
      
      // 设置图片路径
      img.src = `images/${i}.png`
      this.frames.push(img)
    }
    
    this.framesCount = framesCount
  }
  
  update() {
    if (!this.isAllFramesLoaded) return
    
    // 更新当前帧
    if (++this.currentFrame >= this.framesCount * this.frameInterval) {
      this.currentFrame = 0
    }
  }
  
  render(ctx) {
    // 如果所有帧都没有加载完成，显示加载中的文字
    if (!this.isAllFramesLoaded) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `加载背景中... ${this.loadedFramesCount}/${this.framesCount}`, 
        canvas.width / 2, 
        canvas.height / 2
      )
      return
    }
    
    // 绘制当前帧
    const frameIndex = Math.floor(this.currentFrame / this.frameInterval)
    
    if (this.frames[frameIndex] && this.frames[frameIndex].complete) {
      try {
        ctx.drawImage(
          this.frames[frameIndex],
          0,
          0,
          canvas.width,
          canvas.height
        )
      } catch (e) {
        console.error('绘制背景帧时出错:', e)
      }
    }
  }
}
