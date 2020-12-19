// pages/draw/draw_1.js
//import {Light} from './data.js';
//import {Block} from './data.js';

class LightStringControl {
  constructor(light_num, udp_addr, udp_port) {
    this.light_num = light_num;
    this.data_buf = new Uint8Array(2 + 4*light_num);
    this.protocol_header_len = 2;
    this.udp_addr = udp_addr;
    this.udp_port = udp_port;
    this.udp = null;
    this.timer = null;
    this.reset();
  }
  
  reset() {
    this.last_update_timestamp = (new Date()).valueOf();
    this.change_cnt = 0;
    this.setHeader(1, 255);
    for(var i = 0; i < this.light_num; i++)
    {
      var data_index = 2 + i*4;
      this.data_buf[data_index] = i;
      this.setColor(i, {R:255, G:255, B:255});
    }
    if(null != this.udp)
    {
      console.log("udp already init")
      this.udp.close();
    }

    this.udp = wx.createUDPSocket()
    if(null == this.udp){
      console.log('暂不支持')
      return ;
    }
    this.host_udp_port = this.udp.bind()
    console.log(this.udp)
    console.log("host_udp_port is %d", this.host_udp_port)

    if(null != this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(this.sync, 20, this); //20ms = 50Hz

    console.log("creat timer %d", this.timer)
  }

  setHeader(version, timeout) {
    this.data_buf[0] = version; //Byte 0: version
    this.data_buf[1] = timeout; //Byte 1: timeout
  }

  setColor(index, color) {
    if(index <0 || index > this.light_num) {
      return;
    }
    var data_index = 2 + index*4;
    this.data_buf[data_index + 1] = color.R; //R
    this.data_buf[data_index + 2] = color.G; //G
    this.data_buf[data_index + 3] = color.B; //B

    this.change_cnt ++;
  }

  sync(who) {
    //update in loop
    
    if(0 == who.change_cnt || null == who.udp) {
      return;
    }

    who.change_cnt = 0;
    who.udp.send({
      address: who.udp_addr, 
      port: who.udp_port,
      message: who.data_buf
    });
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

    // 初始化灯的时候，如果在缓存中存在，则使用缓存中的对象
    var key = 'light_circle_' + this.index.toString();
    try {
      var light_data = wx.getStorageSync(key)
      if (light_data) {
        console.log(light_data);
        this.color = light_data.light_circle_color;
      }
    } catch (e) {
      console.log(e);
    }
  }

  setColor(color){
    this.color = color;
  }

  // 画圆圈，颜色
  draw() {
    // 画圆
    // console.log(this.color)
    this.page.data.ctx.arc(this.x, this.y + this.r*2, this.r, 0, 2*Math.PI,false)
    this.page.data.ctx.setStrokeStyle(this.color.Hex)
    this.page.data.ctx.stroke()
    this.page.data.ctx.draw(true)

    // 画圆的时候更新一下缓存中对应圆的数据
    var key = 'light_circle_' + this.index.toString();
    wx.setStorageSync(key, {light_circle_color: this.color});

    // 更新一下硬件的数据
    // 将图像中的圆的位置映射到硬件的灯中
    var hardware_light_index_array = this.page.light_circle_to_hardware(this.index);
    // 处理每一个应该更新的硬件
    hardware_light_index_array.forEach(light_index => {
        this.page.data.light_string_control.setColor(light_index, this.color);
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
    light.draw();
    if(this.used == false){
      this.used = true;
    }
  }

  draw_lights_with_color(color){
    if(this.used == false){
      return;
    }
    this.lights.forEach(light => {
      light.setColor(color);
      light.draw();
    });
  }
}

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    version: 1,
    ctx: null,
    screenHeight: 0,
    screenWidth: 0,

    // 硬件灯的相关数据
    hardware_light_nums:100,      // 硬件上灯的数目
    light_string_control: null,   //硬件灯串
    
    // 画面上树的位置和数据
    block_array : null,
    block_x : 20, block_y : 30,   // 分块的宽x和高y；可以认为是触摸精度
    start_x : 50, start_y : 20,   // 树顶的位置
    tree_x : 200, tree_y : 300,   // 树显示x 和 y
    /* 灯曲线的密度 */
    Q : 6,                        // 灯线绕了几圈
    light_delta_l: 40,            // 两个灯之间的距离，可以认为是圆圈的密度
    circle_num:0,                 // 画圈的总个数,作为输出数据

    // 色条与画笔颜色
    pen_color : {R:255, G:255, B:255, Hex: '#ffffff'},    // 默认使用白色
    // 绘画选择板组件数据
    colorData: {
      //基础色相，即左侧色盘右上顶点的颜色，由右侧的色相条控制
      hueData: {
          colorStopRed: 255,
          colorStopGreen: 0,
          colorStopBlue: 0,
      },
      //选择点的信息（左侧色盘上的小圆点，即你选择的颜色）
      pickerData: {
          x: 0, //选择点x轴偏移量
          y: 480, //选择点y轴偏移量
          red: 0, 
          green: 0,
          blue: 0, 
          hex: '#000000'
      },
      //色相控制条的位置
      barY: 0
    },
    rpxRatio: 1 //此值为你的屏幕CSS像素宽度/750，单位rpx实际像素
  },

  //hex format: '#ffffff'
  RGBToHex(R, G, B){
    let hex = ((R << 16) | (G << 8) | B).toString(16)
      if (hex.length < 6) {
        hex = `${'0'.repeat(6-hex.length)}${hex}`
      }
      if (hex == '0') {
        hex = '000000'
      }
      return `#${hex}`
  },

  //选择改色时触发（在左侧色盘触摸或者切换右侧色相条）
  onChangeColor(e) {
    //返回的信息在e.detail.colorData中
    this.setData({
      colorData: e.detail.colorData
    })

    // 改变画笔的颜色
    this.data.pen_color.R = this.data.colorData.pickerData.red;
    this.data.pen_color.G = this.data.colorData.pickerData.green;
    this.data.pen_color.B = this.data.colorData.pickerData.blue;
    this.data.pen_color.Hex = this.RGBToHex(
      this.data.pen_color.R, 
      this.data.pen_color.G, 
      this.data.pen_color.B)

    // 这里需要保存画笔的位置和画笔的颜色
    var key = 'light_pen';
    wx.setStorageSync(key, {pen_color: this.data.pen_color});
  },

  getBlockNums: function(){
    return Math.ceil(this.data.tree_x/this.data.block_x) * Math.ceil(this.data.tree_y/this.data.block_y);
  },

  // 自定义获取坐标函数
  getBlockIndex: function(screen_x, screen_y){
    if(screen_x > (this.data.start_x + this.data.tree_x /2)
      || screen_y > this.data.start_y + this.data.tree_y
      || screen_x < (this.data.start_x - this.data.tree_x /2)
      || screen_y < this.data.start_y){
      //console.log("just return");
      return -1;
    }
    var x = Math.floor(screen_x), y = Math.floor(screen_y);
    var cols = Math.floor((x - this.data.start_x + this.data.tree_x /2)/this.data.block_x);
    var rows = Math.floor((y - this.data.start_y)/this.data.block_y);
    var one_row_cols = Math.floor(this.data.tree_x/this.data.block_x);
    var block_nums = this.getBlockNums();
    //console.log("cols : %d, rows : %d one_row:%d max:%d", cols, rows, one_row_cols, block_nums);
    var block_index = Math.floor(cols + rows * one_row_cols);

    if(block_index >= 0 && block_index < block_nums){
      return block_index;
    }else{
      console.log("ERROR: touch block_index %d out of range", block_index);
    }
    return -1;
  },

  touchProc: function(screen_x, screen_y) {
    //console.log("touch x:%d y:%d", screen_x, screen_y);
    var block_index = this.getBlockIndex(screen_x, screen_y);
    if(block_index != -1){
      this.data.block_array[block_index].draw_lights_with_color(this.data.pen_color); // 重绘圆图像
    }
  },

  // 为了让圆圈和硬件灯对应的更均匀
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

            start_x: res.windowWidth / 2,
            start_y: res.windowHeight / 15, // 初始位置的计算

            tree_x: res.windowWidth*2/3,
            tree_y: res.windowHeight*3/7,   // 树的大小计算

            rpxRatio: res.screenWidth / 750, // color picker 组件的数据
          });
        }
      });
      //console.log(this.data.screenWidth);
      //console.log(this.data.screenHeight);

      this.isMouseDown = false;
      this.lastLoc = { x: 0, y: 0 };

      this.data.block_x = this.data.tree_x / 10;          //横向分为10个区域
      this.data.Q = Math.floor(this.data.tree_y / 50);    // 计算灯绕几圈在手机屏上显示好看
      this.data.block_y = this.data.tree_y / this.data.Q; //纵向分为Q个区域,保证每一圈可以单独涂色
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {    
    this.setData({ctx: wx.createCanvasContext('canvas')});
    var Q = this.data.Q; // 绕线的圈数
    try {
      var version = wx.getStorageSync('version')
      if (!version || version != this.data.version) {
        wx.clearStorageSync();
      }

      var light_pen_data = wx.getStorageSync('light_pen')
      if (light_pen_data) {
        // Do something with return value
        console.log(light_pen_data)
        this.setData({
          pen_color : light_pen_data.pen_color,
        })
      }

    } catch (e) {
      // Do something when catch error
      console.log(e);
    }

    //硬件灯串
    this.data.light_string_control = new LightStringControl(
      this.data.hardware_light_nums,
      '192.168.31.66', 
      21324);

    // 将画树的区域定义为block，生成所有的block对象
    this.data.block_array = new Array();
    var block_nums = this.getBlockNums();
    for(var i = 0; i < block_nums; ++i){
      this.data.block_array[i] = new Block(i);
    }
    // console.log("block array size %d, block0:%d, block1:%d", block_array.length, block_array[0].index, block_array[1].index);
    
    // 计算灯的位置，生成对应灯对象，并填充到对应的block中
    // 当触摸到该block时，对该block中的所有的灯进行处理
    for(var r = 1, light_index = 0; r < this.data.tree_y;){
      // 计算圆的x坐标和y坐标
      var light_x = this.data.start_x + this.data.tree_x/(2*this.data.tree_y) * r * Math.sin(2* Math.PI *Q*r/this.data.tree_y)
      var light_y = this.data.start_y + r;
      r = r + Math.min(10, (this.data.light_delta_l * this.data.tree_y * this.data.tree_y) / (Math.PI * this.data.tree_x * Q * r));

      //console.log("index:%d x:%d y:%d", light_index, light_x, light_y);
      // 获取坐标(x,y)的 block index
      var block_index = this.getBlockIndex(light_x, light_y);
      //console.log("block index:%d", block_index);
      if(block_index != -1){
        this.data.block_array[block_index].push_light(new Light(this, light_index++, light_x, light_y, this.data.pen_color));
      }
      // 记录图中一共画了多少圆
      this.data.circle_num = light_index;
    }
    console.log("light num : %d", this.data.circle_num);
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
    // 可能需要找个地方把缓存清理掉
    /*
    try {
      wx.clearStorageSync();
    } catch(e) {
      // Do something when catch error
      console.log(e);
    }
    */
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
  },

  beginStroke(event) {
    //console.log(event)
    this.isMouseDown = true
    var touch = event.touches[0];
    this.touchProc(touch.x, touch.y); // 处理触摸点上的圆

    // 测试：单击的时候，输出一下应该发往硬件的数据，看是否正确
    // console.log(this.data.hardware_lights_array);
  },

  endStroke(event) {
    //console.log(event)
    this.isMouseDown= false
  },

  moveStroke(event) {
    //console.log(event)
    if (this.isMouseDown && event.touches.length == 1) {
      var touch = event.touches[0];
      this.touchProc(touch.x, touch.y); // 处理触摸轨迹上的圆
    }
  },

  bindCanvasTap: function (event) {
    //console.log(event)
    //var touch = event.touches[0];
    // 在这里touches数组里应该是返回CanvasTouch对象，但是实际上返回了Touch对象，可以根据log判断
    //this.touchProc(touch.x, touch.y); // 处理触摸点上的圆

    /* 硬件数据读测试
    for(var i = 0; i < this.data.hardware_light_nums; ++i){
      var key = 'light_' + i.toString();
      try {
        var light_data = wx.getStorageSync(key)
        if (light_data) {
          // Do something with return value
          //console.log(key);
          //console.log(light_data);
        } else {
          console.log("key %s not found", key);
        }
      } catch (e) {
        // Do something when catch error
        //console.log(e);
      }
    }
    */
    // console.log("tap");
  },
})

