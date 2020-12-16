// pages/draw/draw_1.js
//import {Light} from './data.js';
//import {Block} from './data.js';

// 硬件上的灯对象
class HardwareLight {
  constructor(light_index) {
    this.light_index = light_index;
    this.light_color = 'white'; // 初始化灯的颜色
    this.light_switch = false;        // 初始化的灯是否是打开的
  }

  getColor(){
    return this.light_color;
  }

  setColor(color){
    this.light_color = color;
  }

  getSwitchState(){
    return this.light_switch;
  }

  setSwitchState(light_switch){
    this.light_switch = light_switch;
  }
}

// 灯的对象
class Light {
  constructor(page, index, x, y, color) {
    this.page = page;
    this.index = index;
    this.x = x;
    this.y = y;
    this.r = 3;
    this.color = color;
  }

  draw(color) {
    // 画圆
    this.page.data.ctx.arc(this.x, this.y + this.r*2, this.r, 0, 2*Math.PI,false)
    this.page.data.ctx.setStrokeStyle(color)
    this.page.data.ctx.stroke()
    this.page.data.ctx.draw(true)

    // 画圆的时候顺便更新一下数据
    // 将图像中的圆的位置映射到硬件的灯中
    var hardware_light_index_array = this.page.light_circle_to_hardware(this.index);
    // 处理每一个应该更新的硬件
    hardware_light_index_array.forEach(light_index => {
      if(light_index >= 0 && light_index < this.page.data.hardware_lights_array.length){
        // 设置硬件上的灯的颜色
        this.page.data.hardware_lights_array[light_index].setColor(color);
        // 设置硬件上的灯为点亮状态
        this.page.data.hardware_lights_array[light_index].setSwitchState(true);
      }
    });
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
    if(this.used == false){
      return;
    }
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

    hardware_light_nums:100,  // 硬件上灯的数目
    hardware_lights_array: null, // 硬件上的灯对应的数据数组，发送数据可以从这里拿
    block_array : null,
    Rmin: 1, Rmax:6,
    start_x : 50, start_y : 20, // 树顶的位置
    tree_x : 200, tree_y : 550, // 树显示x 和 y
    block_x : 25, block_y : 25, // 分块x 和y
    Q : 10, // 绕线的圈数
    circle_num:0
  },

  // 自定义获取坐标函数
  getBlockIndex: function(screen_x, screen_y){
    var x = Math.floor(screen_x), y = Math.floor(screen_y);
    var cols = Math.floor((x - this.data.start_x)/this.data.block_x);
    var rows = Math.floor((y - this.data.start_y)/this.data.block_y);
    var one_row_cols = Math.floor(this.data.tree_x/this.data.block_x);
    return Math.floor(cols + rows * one_row_cols);
  },

  touchProc: function(screen_x, screen_y) {
    //console.log("touch x:%d y:%d", screen_x, screen_y);
    var block_index = this.getBlockIndex(screen_x, screen_y);
    var block_nums = (this.data.tree_x/this.data.block_x) * (this.data.tree_y/this.data.block_y);
    if(block_index >= 0 && block_index < block_nums){
      this.data.block_array[block_index].draw_lights('yellow'); // 重绘圆图像
    }else{
      console.log("ERROR: touch block_index %d out of range", block_index);
    }
  },

  light_circle_to_hardware: function(light_index){
    // 由于图中的圆可能比灯少，先将图中的圆个数映射到1000以上
    var K = Math.ceil(1000/this.data.circle_num);
    var circle_num = K * this.data.circle_num;
    var ret = new Array();
    for(var i = light_index * K; i < light_index * K + K; ++i){
      ret.push(Math.floor(i * this.data.hardware_light_nums / circle_num));
    }
    // 返回哪些灯状态改变了
    return ret;
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
            drawHeight: res.windowHeight-50,
            start_x: res.windowWidth / 2
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

    // 硬件上灯的个数
    this.data.hardware_lights_array = new Array();
    for(var i = 0; i < this.data.hardware_light_nums; ++i){
      this.data.hardware_lights_array[i] = new HardwareLight(i);
    }

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
    for(var r = 0, light_index = 0; r < tree_y; light_index++){
      // 计算圆的x坐标和y坐标
      // + tree_x/2 
      var light_x = start_x + tree_x/(2*tree_y) * r * Math.sin(2* Math.PI *Q*r/tree_y)
      var light_y = start_y + 0.5*r;

      // r+= r_step; // 优化
      r = r + this.data.Rmax - ((this.data.Rmax-this.data.Rmin) * r)/this.data.tree_y;
      //console.log("index:%d x:%d y:%d", light_index, light_x, light_y);
      //var block_index = Math.floor((light_x - start_x)/block_x + (light_y - start_y) * (tree_x/block_x)/block_y);
      // 获取坐标(x,y)的 block index
      var block_index = this.getBlockIndex(light_x, light_y);
      //console.log("block index:%d", block_index);
      if(block_index >= 0 && block_index < block_nums){
        block_array[block_index].push_light(new Light(this, light_index, light_x, light_y, 'white'));
      }else{
        console.log("ERROR: block_index %d out of range", block_index);
      }
      // 记录图中一共画了多少圆
      this.data.circle_num = light_index;
      //console.log("light index : %d", light_index);
    }
    console.log("light num : %d", this.data.circle_num);
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

  handletouchmove_demo: function(event) {
    this.setData ({
      x_pos: event.touches[0].pageX,
      y_pos: event.touches[0].pageY,
    });
  },

  beginStroke(event) {
    //console.log(event)
    var touch = event.touches[0];
    var curLoc = { x: touch.x, y: touch.y };
    this.setData ({
      x_pos: curLoc.x,
      y_pos: curLoc.y,
    });

    this.isMouseDown = true
    this.lastLoc = { x: event.touches[0].x, y: event.touches[0].y }
    this.setData({ isTap: true })

    this.touchProc(touch.x, touch.y); // 处理触摸点上的圆

    // 测试：单击的时候，输出一下应该发往硬件的数据，看是否正确
    console.log(this.data.hardware_lights_array);
  },

  endStroke(event) {
    //console.log(event)
    this.isMouseDown= false
  },

  moveStroke(event) {
    if (this.isMouseDown && event.touches.length == 1) {
      //console.log(event)
      var touch = event.touches[0];
      var curLoc = { x: touch.x, y: touch.y };
      this.setData ({
        x_pos: curLoc.x,
        y_pos: curLoc.y,
      });

      this.touchProc(touch.x, touch.y); // 处理触摸轨迹上的圆

      this.lastLoc=curLoc;
    } else if (event.touches.length > 1){
      //console.log(event)
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

  bindCanvasTap: function (event) {
    if(event.type != "tap"){
      return;
    }
    console.log(event)
    var touch = event.touches[0];
    // 在这里touches数组里应该是返回CanvasTouch对象，但是实际上返回了Touch对象，可以根据log判断
    //this.touchProc(touch.x, touch.y); // 处理触摸点上的圆
    console.log("tap");
  },
})

