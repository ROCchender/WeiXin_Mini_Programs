import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const atlas = wx.createImage();
atlas.src = 'images/Common.png';

export default class GameInfo extends Emitter {
  constructor() {
    super();

    this.btnArea = {
      startX: SCREEN_WIDTH / 2 - 40,
      startY: SCREEN_HEIGHT / 2 - 100 + 180,
      endX: SCREEN_WIDTH / 2 + 50,
      endY: SCREEN_HEIGHT / 2 - 100 + 255,
    };

    // 初始化按钮区域数组
    this.btnAreas = []

    // 绑定触摸事件
    wx.onTouchStart(this.touchEventHandler.bind(this))
  }

  setFont(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
  }

  render(ctx) {
    this.renderGameScore(ctx, GameGlobal.databus.score); // 绘制当前分数

    // 游戏结束时停止帧循环并显示游戏结束画面
    if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx, GameGlobal.databus.score); // 绘制游戏结束画面
    }
  }

  renderGameScore(ctx, score) {
    this.setFont(ctx);
    ctx.fillText(score, 10, 30);
  }

  renderButton(ctx, text, x, y, width, height, color) {
    // 绘制按钮
    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)
    
    // 绘制文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + width / 2, y + height / 2)
    
    return {
      startX: x,
      startY: y,
      endX: x + width,
      endY: y + height
    }
  }

  renderGameOver(ctx, screenWidth, screenHeight, score, databus) {
    console.log('渲染游戏结束画面，分数：', score) // 添加日志确认函数被调用
    
    // 保存当前分数到历史记录
    databus.saveScore(score)
    
    // 绘制半透明覆盖层，使结束界面更加明显
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    
    // 设置文字对齐方式为居中
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 绘制游戏结束标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '36px Arial'
    ctx.fillText(
      '游戏结束', 
      screenWidth / 2, 
      screenHeight / 2 - 100
    )
    
    // 绘制得分
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.fillText(
      `本次得分: ${score}`,
      screenWidth / 2, 
      screenHeight / 2 - 40
    )
    
    // 清空按钮区域数组
    this.btnAreas = []
    
    // 使用通用函数绘制按钮
    const restartBtn = this.renderButton(
      ctx, 
      '重新开始',
      screenWidth / 2 - 60,
      screenHeight / 2 + 30,
      120,
      40,
      '#4e4'
    )
    
    const menuBtn = this.renderButton(
      ctx, 
      '选择难度',
      screenWidth / 2 - 60,
      screenHeight / 2 + 90,
      120,
      40,
      '#45e'
    )
    
    // 添加按钮点击区域
    this.btnAreas.push(
      {
        ...restartBtn,
        type: 'restart'
      },
      {
        ...menuBtn,
        type: 'back'
      }
    )
  }

  touchEventHandler(e) {
    // 获取触摸坐标
    const x = e.touches[0].clientX
    const y = e.touches[0].clientY
    
    for (let i = 0; i < this.btnAreas.length; i++) {
      const btn = this.btnAreas[i]
      
      if (x >= btn.startX && x <= btn.endX && 
          y >= btn.startY && y <= btn.endY) {
        if (btn.type === 'restart' || btn.type === 'startGame') {
          // 开始游戏回调
          this.onStartGame && this.onStartGame()
          return
        } else if (btn.type === 'difficulty' && btn.difficulty) {
          // 设置难度回调
          this.onSelectDifficulty && this.onSelectDifficulty(btn.difficulty)
          return
        } else if (btn.type === 'history') {
          // 查看历史回调
          this.onViewHistory && this.onViewHistory()
          return
        } else if (btn.type === 'back') {
          // 返回回调
          this.onBack && this.onBack()
          return
        }
      }
    }
  }

  /**
   * 绘制难度选择界面
   */
  renderDifficultySelector(ctx, screenWidth, screenHeight, databus) {
    // 绘制标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center' // 设置文本水平居中对齐
    ctx.textBaseline = 'middle' // 设置文本垂直居中对齐
    ctx.fillText('选择难度:', screenWidth / 2, screenHeight / 2 - 80)
    
    const difficulties = Object.keys(databus.difficulties)
    const buttonWidth = 100
    const buttonHeight = 40
    const padding = 20
    const startX = (screenWidth - (buttonWidth + padding) * difficulties.length) / 2
    
    // 清空之前的按钮区域
    this.btnAreas = []
    
    // 绘制难度选择按钮
    difficulties.forEach((diff, index) => {
      const x = startX + (buttonWidth + padding) * index
      const y = screenHeight / 2 - 40
      const buttonCenterX = x + buttonWidth / 2
      const buttonCenterY = y + buttonHeight / 2
      
      // 绘制按钮
      ctx.fillStyle = databus.currentDifficulty === diff ? '#8ae' : '#345'
      ctx.fillRect(x, y, buttonWidth, buttonHeight)
      
      // 按钮文字 - 使用文本居中对齐
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        diff === 'easy' ? '简单' : diff === 'normal' ? '普通' : '困难',
        buttonCenterX,  // 使用按钮中心的X坐标
        buttonCenterY   // 使用按钮中心的Y坐标
      )
      
      // 添加按钮点击区域
      this.btnAreas.push({
        startX: x,
        startY: y,
        endX: x + buttonWidth,
        endY: y + buttonHeight,
        type: 'difficulty',
        difficulty: diff
      })
    })
    
    // 添加开始游戏按钮
    const startGameBtnY = screenHeight / 2 + 20
    const startGameBtnWidth = 120
    const startGameBtnHeight = 40
    const startGameBtnX = screenWidth / 2 - startGameBtnWidth / 2
    
    ctx.fillStyle = '#4e4'
    ctx.fillRect(startGameBtnX, startGameBtnY, startGameBtnWidth, startGameBtnHeight)
    
    // 开始游戏文字 - 使用文本居中对齐
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      '开始游戏', 
      screenWidth / 2, 
      startGameBtnY + startGameBtnHeight / 2
    )
    
    // 添加开始游戏按钮点击区域
    this.btnAreas.push({
      startX: startGameBtnX,
      startY: startGameBtnY,
      endX: startGameBtnX + startGameBtnWidth,
      endY: startGameBtnY + startGameBtnHeight,
      type: 'startGame'
    })
  }

  // 添加历史分数显示
  renderScoreHistory(ctx, screenWidth, screenHeight, databus) {
    const startY = screenHeight / 2 - 80
    const lineHeight = 30
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.fillText('历史最佳成绩:', screenWidth / 2 - 60, startY)
    
    if (databus.scoreHistory.length === 0) {
      ctx.fillText('暂无记录', screenWidth / 2 - 40, startY + lineHeight)
      return
    }
    
    databus.scoreHistory.slice(0, 5).forEach((record, index) => {
      const diffText = record.difficulty === 'easy' ? '简单' : 
                       record.difficulty === 'normal' ? '普通' : '困难'
      
      ctx.fillText(
        `${index + 1}. ${record.score}分 (${diffText})`, 
        screenWidth / 2 - 80, 
        startY + (index + 1) * lineHeight
      )
    })
  }
}
