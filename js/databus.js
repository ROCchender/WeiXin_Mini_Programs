import Pool from './base/pool';

let instance;

/**
 * 全局状态管理器
 * 负责管理游戏的状态，包括帧数、分数、子弹、敌人和动画等
 */
export default class DataBus {
  // 直接在类中定义实例属性
  enemys = []; // 存储敌人
  bullets = []; // 存储子弹
  animations = []; // 存储动画
  frame = 0; // 当前帧数
  score = 0; // 当前分数
  isGameOver = false; // 游戏是否结束
  pool = new Pool(); // 初始化对象池

  // 简化难度设置
  difficulties = {
    easy: { speed: 2 },
    normal: { speed: 4 },
    hard: { speed: 6 }
  }

  // 默认难度
  currentDifficulty = 'normal'

  // 历史分数记录
  scoreHistory = []

  constructor() {
    // 确保单例模式
    if (instance) return instance;

    instance = this;
  }

  // 重置游戏状态
  reset() {
    this.frame = 0; // 当前帧数
    this.score = 0; // 当前分数
    this.bullets = []; // 存储子弹
    this.enemys = []; // 存储敌人
    this.animations = []; // 存储动画
    this.isGameOver = false; // 游戏是否结束
  }

  // 游戏结束
  gameOver() {
    this.isGameOver = true;
  }

  /**
   * 回收敌人，进入对象池
   * 此后不进入帧循环
   * @param {Object} enemy - 要回收的敌人对象
   */
  removeEnemy(enemy) {
    const temp = this.enemys.splice(this.enemys.indexOf(enemy), 1);
    if (temp) {
      this.pool.recover('enemy', enemy); // 回收敌人到对象池
    }
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   * @param {Object} bullet - 要回收的子弹对象
   */
  removeBullets(bullet) {
    const temp = this.bullets.splice(this.bullets.indexOf(bullet), 1);
    if (temp) {
      this.pool.recover('bullet', bullet); // 回收子弹到对象池
    }
  }

  // 从本地存储加载历史分数
  loadScoreHistory() {
    const scores = wx.getStorageSync('scoreHistory')
    if (scores) {
      this.scoreHistory = JSON.parse(scores)
    }
  }

  // 保存分数到历史记录
  saveScore(score) {
    const scoreRecord = {
      score: score,
      difficulty: this.currentDifficulty,
      date: new Date().toISOString()
    }
    
    this.scoreHistory.push(scoreRecord)
    
    // 只保留前5名而不是10名
    this.scoreHistory.sort((a, b) => b.score - a.score)
    if (this.scoreHistory.length > 5) {
      this.scoreHistory = this.scoreHistory.slice(0, 5)
    }
    
    // 保存到本地存储
    wx.setStorageSync('scoreHistory', JSON.stringify(this.scoreHistory))
  }

  // 根据当前难度获取速度
  getSpeed() {
    return this.difficulties[this.currentDifficulty].speed
  }
}
