Page({
  data: {
    backgroundImage: '/images/game-bg.jpg', // 背景图路径
    grid: [],         // 网格数据
    cellSize: 17.5,   // 每个格子大小
    rows: 20,         // 行数
    cols: 20,         // 列数
    score: 0,         // 当前分数
    highScore: 0,     // 最高分
    gameStarted: false, // 游戏是否开始
    gameOver: false,   // 游戏是否结束
    isPaused: false    // 游戏是否暂停
  },

  onLoad() {
    // 从缓存获取最高分
    const highScore = wx.getStorageSync('highScore') || 0;
    this.setData({ highScore });
    
    // 初始化游戏
    this.initGame();
  },

  initGame() {
    // 初始化蛇
    this.snake = [
      {x: 10, y: 10, type: 'head', direction: 'right'}, // 蛇头
      {x: 9, y: 10, type: 'body'},
      {x: 8, y: 10, type: 'body'}
    ];
    
    this.direction = 'right'; // 当前方向
    this.nextDirection = 'right'; // 下一个方向
    
    // 生成食物
    this.generateFood();
    
    // 更新网格数据
    this.updateGrid();
  },

  startGame() {
    this.initGame();
    this.setData({
      score: 0,
      gameStarted: true,
      gameOver: false,
      isPaused: false
    });
    
    // 开始游戏循环
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.gameInterval = setInterval(this.gameLoop.bind(this), 150);
  },

  restartGame() {
    this.startGame();
  },

  togglePause() {
    if (this.data.gameOver) return;
    
    const isPaused = !this.data.isPaused;
    this.setData({ isPaused });
    
    if (isPaused) {
      clearInterval(this.gameInterval);
    } else {
      this.gameInterval = setInterval(this.gameLoop.bind(this), 150);
    }
  },

  gameLoop() {
    if (this.data.isPaused || this.data.gameOver) return;
    
    this.moveSnake();
    this.checkCollision();
    this.updateGrid();
  },

  moveSnake() {
    // 更新方向
    this.direction = this.nextDirection;
    
    // 获取蛇头
    const head = {
      x: this.snake[0].x,
      y: this.snake[0].y,
      type: 'head',
      direction: this.direction
    };
    
    // 根据方向移动蛇头
    switch (this.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }
    
    // 将新头部添加到蛇身
    this.snake.unshift(head);
    
    // 更新原蛇头为身体
    if (this.snake.length > 1) {
      this.snake[1].type = 'body';
      delete this.snake[1].direction;
    }
    
    // 检查是否吃到食物
    if (head.x === this.food.x && head.y === this.food.y) {
      this.setData({ score: this.data.score + 1 });
      this.generateFood();
    } else {
      // 如果没有吃到食物，移除尾部
      this.snake.pop();
    }
  },

  generateFood() {
    // 随机生成食物位置
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * this.data.cols),
        y: Math.floor(Math.random() * this.data.rows),
        type: 'food'
      };
    } while (this.isSnakeAt(food.x, food.y));
    
    this.food = food;
  },

  isSnakeAt(x, y) {
    return this.snake.some(segment => segment.x === x && segment.y === y);
  },

  checkCollision() {
    const head = this.snake[0];
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= this.data.cols || head.y < 0 || head.y >= this.data.rows) {
      this.endGame();
      return;
    }
    
    // 检查是否撞到自己
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.endGame();
        return;
      }
    }
  },

  endGame() {
    clearInterval(this.gameInterval);
    this.setData({ 
      gameOver: true,
      isPaused: false
    });
    
    // 更新最高分
    if (this.data.score > this.data.highScore) {
      this.setData({ highScore: this.data.score });
      wx.setStorageSync('highScore', this.data.score);
    }
  },

  changeDirection(e) {
    if (this.data.isPaused) return;
    
    const newDirection = e.currentTarget.dataset.direction;
    const oppositeDirections = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    
    // 防止直接反向移动
    if (this.direction !== oppositeDirections[newDirection]) {
      this.nextDirection = newDirection;
    }
  },

  updateGrid() {
    // 创建网格数据
    const grid = [...this.snake, this.food];
    this.setData({ grid });
  },

  onUnload() {
    // 清除游戏循环
    if (this.gameInterval) clearInterval(this.gameInterval);
  }
});