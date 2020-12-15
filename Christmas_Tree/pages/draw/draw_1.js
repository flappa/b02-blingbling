// pages/draw/draw_1.js
//import {Light} from './data.js';
//import {Block} from './data.js';

// 灯的对象
class Light {
  constructor(page, x, y, color) {
    this.page = page;
    this.x = x;
    this.y = y;
    this.r = 3;
    this.color = color;
    this.draw = draw;

    function draw(color) {
      // 画圆
      page.data.ctx.arc(this.x, this.y + this.r*2, this.r, 0, 2*Math.PI,false)
      page.data.ctx.setStrokeStyle(color)
      page.data.ctx.stroke()
      page.data.ctx.draw(true)
    }
  }
}

// 定义block对象,block 里面可能有多个灯的位置
class Block {
  constructor(index) {
    this.index = index;
    this.lights = new Array();
    this.used = false;
  }

  push_light(light){
    this.lights.push(light);
    // 添加到数组中时，顺便把自己画出来
    light.draw('white');
    if(this.used == false){
      this.used = true;
    }
  }

  draw_lights(color){
    this.lights.forEach(light => {
      light.draw(color);
    });
  }
}

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    ctx: null,
    screenHeight: 0,
    screenWidth: 0,
    drawWidth:0,
    drawHeight:0,
    bulbR:10,
    isTap:true,
    touchLength:0,
    // isMouseDown:false,
    x_pos:100,
    y_pos:500,

    block_array : null,
    start_x : 50, start_y : 20, // 树顶的位置
    tree_x : 200, tree_y : 200, // 树显示x 和 y
    block_x : 5, block_y : 10, // 分块x 和y
    Q : 10 // 绕线的圈数
  },

  // 自定义获取坐标函数
  getBlockIndex: function(screen_x, screen_y){
    var start_x = this.data.start_x, start_y = this.data.start_y; // 树顶的位置
    var tree_x = this.data.tree_x, tree_y = this.data.tree_y; // 树显示x 和 y
    var block_x = this.data.block_x, block_y = this.data.block_y; // 分块x 和y
    return Math.floor((screen_x - start_x)/block_x + (screen_y - start_y) * (tree_x/block_x)/block_y);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      //获取屏幕宽高
      var _this = this;
      wx.getSystemInfo({
       success: function (res) {
          _this.setData({
            screenHeight: res.windowHeight,
            screenWidth: res.windowWidth,
            drawWidth: res.windowWidth ,
            drawHeight: res.windowHeight-50

          });
        }
      });
      console.log(this.data.screenWidth);
      console.log(this.data.screenHeight);
      console.log(this.data.drawWidth);
      console.log(this.data.drawHeight);

      this.isMouseDown=false
      this.lastLoc={ x: 0, y: 0 }
      this.lastLineWidth = -1;

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {    
    this.setData({ctx: wx.createCanvasContext('canvas')});

    var start_x = this.data.start_x, start_y = this.data.start_y; // 树顶的位置
    var tree_x = this.data.tree_x, tree_y = this.data.tree_y; // 树显示x 和 y
    var block_x = this.data.block_x, block_y = this.data.block_y; // 分块x 和y
    var Q = this.data.Q; // 绕线的圈数
    var r_step = 3; // 步长

    // 将画树的区域定义为block，生成所有的block对象
    this.data.block_array = new Array();
    var block_array = this.data.block_array;
    var block_nums = (tree_x/block_x) * (tree_y/block_y);
    for(var i = 0; i < block_nums; ++i){
      block_array[i] = new Block(i);
    }
    console.log("block array size %d, block0:%d, block1:%d", block_array.length, block_array[0].index, block_array[1].index);
    
    // 计算灯的位置并填充到对应的block中
    // 当触摸到该block时，对该block中的所有的灯进行处理
    for(var r = 1, light_index = 0; r < tree_y; r+= r_step, light_index++){
      // 计算圆的x坐标和y坐标
      var light_x = start_x + tree_x/2 + tree_x/(2*tree_y) * r * Math.cos(2* Math.PI *Q*r/tree_y)
      var light_y = start_y + r;
      //console.log("index:%d x:%d y:%d", light_index, light_x, light_y);
      //var block_index = Math.floor((light_x - start_x)/block_x + (light_y - start_y) * (tree_x/block_x)/block_y);
      var block_index = this.getBlockIndex(light_x, light_y);
      //console.log("block index:%d", block_index);
      if(block_index >= 0 && block_index < block_nums){
        block_array[block_index].push_light(new Light(this, light_x, light_y, 'white'));
      }else{
        console.log("ERROR: block_index %d out of range", block_index);
      }
    }
    console.log("INFO: init end");
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  // handletouchmove: function(event) {
  //   console.log(event)
  //   console.log(event.touches[0].x)
  //   console.log(event.touches[0].y)
  //   this.setData ({
  //     x_pos: event.touches[0].x,
  //     y_pos: event.touches[0].y,
  //   });
  // },

  
  handletouchmove_demo: function(event) {
    console.log(event)
    console.log(event.touches[0].pageX)
    console.log(event.touches[0].pageY)
    this.setData ({
      x_pos: event.touches[0].pageX,
      y_pos: event.touches[0].pageY,
    });
  },

  beginStroke(event) {
    console.log(event)
    console.log(event.touches[0].x)
    console.log(event.touches[0].y)
    var touch = event.touches[0];
    var curLoc = { x: touch.x, y: touch.y };
    this.setData ({
      x_pos: curLoc.x,
      y_pos: curLoc.y,
    });

    this.isMouseDown = true
    this.lastLoc = { x: event.touches[0].x, y: event.touches[0].y }
    this.setData({ isTap: true })
  },

  endStroke(event) {
    console.log(event)
    this.isMouseDown= false
  },

  moveStroke(event) {
    if (this.isMouseDown && event.touches.length == 1) {
      //console.log(event)
      //console.log(event.touches[0].x)
      //console.log(event.touches[0].y)
      var touch = event.touches[0];
      var curLoc = { x: touch.x, y: touch.y };
      this.setData ({
        x_pos: curLoc.x,
        y_pos: curLoc.y,
      });

      var block_index = this.getBlockIndex(curLoc.x, curLoc.y);
      var block_nums = (this.data.tree_x/this.data.block_x) * (this.data.tree_y/this.data.block_y);
      if(block_index >= 0 && block_index < block_nums){
        // 重绘圆图像
        this.data.block_array[block_index].draw_lights('yellow');
      }else{
        console.log("ERROR: while move block_index %d out of range", block_index);
      }

/*
      var distance = 0;
      var x0 = 207, y0 = 485;
      distance = Math.sqrt((this.data.x_pos - x0)*(this.data.x_pos - x0) + (this.data.y_pos - y0)*(this.data.y_pos - y0));
      if(distance <= this.data.bulbR)
      {
        this.data.ctx.arc(250, 75, 10, 0, 2 * Math.PI, true)
        this.data.ctx.setFillStyle('#0000ff')
        this.data.ctx.fill()
        this.data.ctx.draw(true)//true表示保留之前绘制内容

      }
      */
      this.lastLoc=curLoc;
    } else if (event.touches.length > 1){
      console.log(event)
      this.setData({isTap:false})
      var touch = event.touches[0];
      var curLoc = { x: touch.x, y: touch.y };
      this.setData ({
        x_pos: curLoc.x,
        y_pos: curLoc.y,
        // touchLength:  event.touches.length,
      });
    }
  },
})

