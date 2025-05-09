import './render'; // 初始化Canvas
import Player from './player/index'; // 导入玩家类
import Enemy from './npc/enemy'; // 导入敌机类
import BackGround from './runtime/background'; // 导入背景类
import GameInfo from './runtime/gameinfo'; // 导入游戏UI类
import Music from './runtime/music'; // 导入音乐类
import DataBus from './databus'; // 导入数据类，用于管理游戏状态和数据

const ENEMY_GENERATE_INTERVAL = 30;
const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文;

GameGlobal.databus = new DataBus(); // 全局数据管理，用于管理游戏状态和数据
GameGlobal.musicManager = new Music(); // 全局音乐管理实例

/**
 * 游戏主函数
 */
export default class Main {
  aniId = 0; // 用于存储动画帧的ID
  bg = new BackGround(); // 创建背景
  player = new Player(); // 创建玩家
  gameInfo = new GameInfo(); // 创建游戏UI显示
  
  // 添加游戏状态
  gameState = 'menu'; // 'menu', 'playing', 'gameOver', 'history'
  
  constructor() {
    // 当开始游戏被点击时，重新开始游戏
    this.gameInfo.on('restart', this.start.bind(this));

    // 加载历史分数
    GameGlobal.databus.loadScoreHistory();

    // 设置事件回调
    this.gameInfo.onStartGame = this.restart.bind(this);
    this.gameInfo.onSelectDifficulty = this.selectDifficulty.bind(this);
    this.gameInfo.onViewHistory = this.viewHistory.bind(this);
    this.gameInfo.onBack = this.backToMenu.bind(this);

    // 显示开始菜单
    this.showMenu();

    // 开始游戏
    this.start();
  }

  /**
   * 开始或重启游戏
   */
  start() {
    GameGlobal.databus.reset(); // 重置数据
    this.player.init(); // 重置玩家状态
    cancelAnimationFrame(this.aniId); // 清除上一局的动画
    this.aniId = requestAnimationFrame(this.loop.bind(this)); // 开始新的动画循环

    // 根据难度设置游戏参数
    const difficulty = GameGlobal.databus.difficulties[GameGlobal.databus.currentDifficulty]
    this.enemySpeed = difficulty.enemySpeed
    this.enemyGenerateSpeed = difficulty.enemyGenerateSpeed
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    // 确保只在游戏进行中状态生成敌人
    if (this.gameState !== 'playing') return
    
    // 根据难度获取敌人生成间隔
    const enemyGenerateSpeed = this.getEnemyGenerateSpeed()
    
    // 每隔一定帧数生成一个敌人
    if (GameGlobal.databus.frame % enemyGenerateSpeed === 0) {
      console.log('尝试生成敌人') // 添加调试日志
      const enemy = GameGlobal.databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6) // 初始化敌人，传入速度参数
      GameGlobal.databus.enemys.push(enemy)
    }
  }

  // 根据难度获取敌人生成速度
  getEnemyGenerateSpeed() {
    const difficulty = GameGlobal.databus.currentDifficulty
    
    // 根据难度返回不同的生成间隔
    switch (difficulty) {
      case 'easy':
        return 70 // 间隔更长，敌人更少
      case 'normal':
        return 40
      case 'hard':
        return 20 // 间隔更短，敌人更多
      default:
        return 60
    }
  }

  /**
   * 全局碰撞检测
   */
  collisionDetection() {
    // 检测子弹与敌机的碰撞
    GameGlobal.databus.bullets.forEach((bullet) => {
      for (let i = 0, il = GameGlobal.databus.enemys.length; i < il; i++) {
        const enemy = GameGlobal.databus.enemys[i];

        // 如果敌机存活并且发生了发生碰撞
        if (enemy.isCollideWith(bullet)) {
          enemy.destroy(); // 销毁敌机
          bullet.destroy(); // 销毁子弹
          GameGlobal.databus.score += 1; // 增加分数
          break; // 退出循环
        }
      }
    });

    // 检测玩家与敌机的碰撞
    for (let i = 0, il = GameGlobal.databus.enemys.length; i < il; i++) {
      const enemy = GameGlobal.databus.enemys[i];

      // 如果玩家与敌机发生碰撞
      if (this.player.isCollideWith(enemy)) {
        this.player.destroy(); // 销毁玩家飞机
        GameGlobal.databus.gameOver(); // 游戏结束

        break; // 退出循环
      }
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布

    if (this.gameState === 'menu') {
      // 如果在菜单状态，绘制菜单
      this.bg.render(ctx);
      this.gameInfo.renderDifficultySelector(
        ctx, 
        canvas.width, 
        canvas.height, 
        GameGlobal.databus
      );
    } else if (this.gameState === 'playing') {
      // 如果在游戏中状态，绘制游戏元素
      this.bg.render(ctx);
      this.player.render(ctx);
      GameGlobal.databus.bullets.forEach((item) => item.render(ctx));
      GameGlobal.databus.enemys.forEach((item) => item.render(ctx));
      this.gameInfo.renderGameScore(ctx, GameGlobal.databus.score);
    } else if (this.gameState === 'gameOver') {
      console.log('渲染游戏结束界面'); // 添加日志确认函数被调用
      
      // 如果游戏结束状态，绘制结束界面
      this.bg.render(ctx);
      this.player.render(ctx);
      GameGlobal.databus.bullets.forEach((item) => item.render(ctx));
      GameGlobal.databus.enemys.forEach((item) => item.render(ctx));
      this.gameInfo.renderGameOver(
        ctx, 
        canvas.width, 
        canvas.height, 
        GameGlobal.databus.score,
        GameGlobal.databus
      );
    } else if (this.gameState === 'history') {
      // 如果在历史记录状态，绘制历史界面
      this.gameInfo.renderHistoryScreen(
        ctx, 
        canvas.width, 
        canvas.height, 
        GameGlobal.databus
      );
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if (this.gameState !== 'playing') {
      // 非游戏中状态，只更新背景动画
      this.bg.update(Date.now())
      return
    }
    
    // 更新背景
    this.bg.update(Date.now())
    
    if (GameGlobal.databus.isGameOver) {
      // 如果游戏已经结束但状态还不是gameOver，则调用gameOver方法
      if (this.gameState !== 'gameOver') {
        this.gameOver();
      }
      return;
    }

    GameGlobal.databus.frame++; // 增加帧数

    this.player.update(); // 更新玩家
    // 更新所有子弹
    GameGlobal.databus.bullets.forEach((item) => item.update());
    // 更新所有敌机
    GameGlobal.databus.enemys.forEach((item) => item.update());

    this.enemyGenerate(); // 生成敌机
    this.collisionDetection(); // 检测碰撞
  }

  // 实现游戏帧循环
  loop() {
    // 每60帧输出一次调试信息
    if (GameGlobal.databus.frame % 60 === 0 && this.gameState === 'playing') {
      console.log('当前敌人数量:', GameGlobal.databus.enemys.length)
      console.log('当前游戏状态:', this.gameState)
      console.log('当前难度:', GameGlobal.databus.currentDifficulty)
    }
    
    // 更新逻辑
    this.update()
    
    // 渲染画面
    this.render()
    
    // 安排下一帧
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  // 显示开始菜单
  showMenu() {
    this.gameState = 'menu';
    
    // 绘制背景
    this.bg.render(ctx);
    
    // 绘制难度选择界面
    this.gameInfo.renderDifficultySelector(
      ctx, 
      canvas.width, 
      canvas.height, 
      GameGlobal.databus
    );
  }

  // 设置难度
  selectDifficulty(difficulty) {
    GameGlobal.databus.currentDifficulty = difficulty;
    
    // 重新渲染菜单以反映难度选择
    this.showMenu();
  }

  // 查看历史记录
  viewHistory() {
    this.gameState = 'history';
    
    // 绘制历史记录界面
    this.gameInfo.renderHistoryScreen(
      ctx, 
      canvas.width, 
      canvas.height, 
      GameGlobal.databus
    );
  }

  // 返回到菜单
  backToMenu() {
    console.log('回到选择难度菜单');
    this.showMenu();
  }

  // 重置游戏
  restart() {
    GameGlobal.databus.reset();
    
    // 确保游戏状态设置为playing
    this.gameState = 'playing';
    
    // 清空残留的敌人和子弹
    GameGlobal.databus.enemys = [];
    GameGlobal.databus.bullets = [];
    
    // 重新初始化玩家
    this.player.init();
    
    // 确保帧计数器从0开始
    GameGlobal.databus.frame = 0;
    
    // 输出调试信息
    console.log('游戏重新开始，当前难度:', GameGlobal.databus.currentDifficulty);
  }

  // 修改gameOver方法
  gameOver() {
    // 确保游戏状态被设置为结束
    GameGlobal.databus.gameOver();
    this.gameState = 'gameOver';
    
    console.log('游戏结束，得分：', GameGlobal.databus.score); // 添加日志确认函数被调用
    
    // 确保在渲染循环中绘制游戏结束界面
    // 为保证绘制的及时性，可以在这里主动调用一次render
    this.render();
  }

  // 碰撞检测
  // checkCollision() {
  //   let that = this
  //   
  //   // 子弹和敌机的碰撞检测
  //   for (let i = 0, il = GameGlobal.databus.bullets.length; i < il; i++) {
  //     let bullet = GameGlobal.databus.bullets[i]
  //     
  //     for (let j = 0, jl = GameGlobal.databus.enemys.length; j < jl; j++) {
  //       let enemy = GameGlobal.databus.enemys[j]
  //       
  //       if (!enemy.isPlaying && !bullet.isPlaying)
  //         continue
  //         
  //       if (bullet.isCollideWith(enemy)) {
  //         enemy.playAnimation()
  //         bullet.visible = false
  //         
  //         GameGlobal.databus.score += 1
  //         
  //         break
  //       }
  //     }
  //   }
  //   
  //   // 玩家和敌机的碰撞检测
  //   for (let i = 0, il = GameGlobal.databus.enemys.length; i < il; i++) {
  //     let enemy = GameGlobal.databus.enemys[i]
  //     
  //     if (this.player.isCollideWith(enemy)) {
  //       console.log('检测到碰撞，游戏结束')
  //       GameGlobal.databus.gameOver()
  //       this.gameState = 'gameOver' // 确保状态正确设置
  //       
  //       return
  //     }
  //   }
  // }

  // 添加碰撞检测方法
  isPlayerCollidingWithEnemy() {
    // 实现您游戏中的碰撞检测逻辑
    // 例如：
    for (let i = 0, il = GameGlobal.databus.enemys.length; i < il; i++) {
      const enemy = GameGlobal.databus.enemys[i]
      if (this.player.isCollideWith(enemy)) {
        return true
      }
    }
    return false
  }
}
