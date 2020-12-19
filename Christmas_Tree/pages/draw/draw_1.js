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
    this.sync();
  }

  sync() {
    //update in loop
    var now = (new Date()).valueOf();
    if(0 == this.change_cnt || Math.abs(now - this.last_update_timestamp) < 50){ // 50 ms
      return;
    }
    this.last_update_timestamp = now;
    this.change_cnt = 0;

    var send_data = this.data_buf;
    this.udp.send({
      address: this.udp_addr, 
      port: this.udp_port,
      message: send_data
    });
  }
}

// 硬件上的灯对象
class HardwareLight {
  constructor(light_index) {
    this.light_index = light_index;
    this.light_color = 'white'; // 初始化灯的颜色
    this.light_switch = false;        // 初始化的灯是否是打开的
    this.last_update_timestamp = (new Date()).valueOf();
  }

  getColor(){
    return this.light_color;
  }

  setColor(color){
    this.light_color = color;
    this.updateBuffer();
  }

  getSwitchState(){
    return this.light_switch;
  }

  setSwitchState(light_switch){
    this.light_switch = light_switch;
    this.updateBuffer();
  }

  updateBuffer(){
    // TODO：这里要防止更新的太频繁
    var now = (new Date()).valueOf();
    if(Math.abs(now - this.last_update_timestamp) < 300){ // 300 ms
      return;
    }
    this.last_update_timestamp = now;
    //console.log(this.last_update_timestamp);
    var key = 'light_' + this.light_index.toString();
    wx.setStorageSync(key, {light_switch: this.light_switch, light_color: this.light_color});
    //console.log(key);
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
    /*
    var key = 'light_' + this.index.toString();
    try {
      var light_data = wx.getStorageSync(key)
      if (light_data) {
        // Do something with return value
        console.log(light_data);
      }
    } catch (e) {
      // Do something when catch error
      console.log(e);
    }
    */
  }

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
  }

  draw(color) {
    // 画圆
    var color_hex = this.RGBToHex(color.R, color.G, color.B)
    this.page.data.ctx.arc(this.x, this.y + this.r*2, this.r, 0, 2*Math.PI,false)
    this.page.data.ctx.setStrokeStyle(color_hex)
    this.page.data.ctx.stroke()
    this.page.data.ctx.draw(true)

    // 画圆的时候顺便更新一下数据
    // 将图像中的圆的位置映射到硬件的灯中
    var hardware_light_index_array = this.page.light_circle_to_hardware(this.index);

    // 处理每一个应该更新的硬件
    hardware_light_index_array.forEach(light_index => {
      this.page.data.light_string_control.setColor(this.index, color);

      // if(light_index >= 0 && light_index < this.page.data.hardware_lights_array.length){
      //   // 设置硬件上的灯的颜色
      //   this.page.data.hardware_lights_array[light_index].setColor(color);
      //   // 设置硬件上的灯为点亮状态
      //   this.page.data.hardware_lights_array[light_index].setSwitchState(true);
      // }
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
    light.draw({R:255, G:255, B:255}); //white
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

    isTap:true,
    x_pos:100,
    y_pos:500,
    
    hardware_light_nums:100,  // 硬件上灯的数目
    hardware_lights_array: null, // 硬件上的灯对应的数据数组，发送数据可以从这里拿
    light_string_control: null, //硬件灯串， todo:替换掉 hardware_lights_array
    block_array : null,
    // Rmin: 1, Rmax:7, // delete
    start_x : 50, start_y : 20, // 树顶的位置
    tree_x : 200, tree_y : 300, // 树显示x 和 y
    block_x : 20, block_y : 30, // 分块x 和y // 可以认为是触摸精度
    Q : 13, // 绕线的圈数
    circle_num:0, // 画圈的总个数
    light_delta_l: 13, // 两个灯之间的距离，可以认为是圆圈的密度

    // 颜色
    pen_color : {R:255, G:255, B:255},     // 颜色的格式是怎样的
    picker_position:0,   // 初始色条的位置
    picker_left:1,
    picker_right:1,
  },

  standerColorValue(p, q, tC) {
    if (tC < 0) {
      tC += 1;
    } else if (tC > 1) {
      tC -= 1;
    }

    if(tC < 1/6){
      tC = p + ((q-p)*6*tC);
    }else if(tC >=1/6 && tC < 1/2){
      tC = q;
    }else if(tC >= 1/2 && tC < 2/3){
      tC = p + ((q-p)*6*(2/3-tC));
    }else{
      tC = p;
    }
    return tC;
  },

  HSLToRGB(H, S, L){
    var q;
    if(L < 1/2){
      q = L * (1+S);
    } else {
      q = L + S - (L*S);
    }
    var p = 2 * L - q;
    var Hk = H/360;
    var tR = Hk + 1/3;
    var tG = Hk;
    var tB = Hk - 1/3;

    tR = this.standerColorValue(p, q, tR);
    tG = this.standerColorValue(p, q, tG);
    tB = this.standerColorValue(p, q, tB);
    return {R:Math.floor(tR*255), G:Math.floor(tG*255), B:Math.floor(tB*255)};
  },

  color_pick(e) {
    var picker_width = this.data.picker_right - this.data.picker_left;
    let picker_x = Math.floor(e.changedTouches[0].pageX - this.data.picker_left);
    picker_x = Math.min(picker_x, picker_width-3);
    picker_x = Math.max(picker_x, -3);
    //console.log("pick index : %d", picker_x);
    this.setData({
      picker_position: picker_x // 图像上设置值
    })
    var color = this.HSLToRGB(Math.floor((picker_x+3)*360/picker_width), 1, 0.5);
    //console.log(color);
    this.data.pen_color = color;

    // 这里需要保存画笔的位置和画笔的颜色
    var key = 'light_pen';
    wx.setStorageSync(key, {light_pen_index: picker_x, light_pen_color: this.data.pen_color});
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
    var block_nums = (this.data.tree_x/this.data.block_x) * (this.data.tree_y/this.data.block_y);
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
      this.data.block_array[block_index].draw_lights(this.data.pen_color); // 重绘圆图像
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

            start_x: res.windowWidth / 2,
            start_y: res.windowHeight / 15, // 初始位置的计算

            tree_x: res.windowWidth*2/3,
            tree_y: res.windowHeight*3/7,   // 树的大小计算
          });
        }
      });
      //console.log(this.data.screenWidth);
      //console.log(this.data.screenHeight);

      this.isMouseDown = false;
      this.lastLoc = { x: 0, y: 0 };

      this.data.block_x = this.data.tree_x / 10;          //横向分为10个区域
      this.data.Q = Math.floor(this.data.tree_y / 20);    // 计算灯绕几圈在手机屏上显示好看
      this.data.block_y = this.data.tree_y / this.data.Q; //纵向分为Q个区域,保证每一圈可以单独涂色

      var query = wx.createSelectorQuery();
      //选择id
      query.select('#color-picker-bar').boundingClientRect();
      query.exec(function(rect){
        _this.setData({
          picker_left: rect[0].left,
          picker_right: rect[0].right,
        });
        //_this.data.picker_left = rect[0].left;
        //_this.data.picker_right = rect[0].right;
      });
      //console.log(this.data.picker_left);
      //console.log(this.data.picker_right);
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

    try {
      var light_pen_data = wx.getStorageSync('light_pen')
      if (light_pen_data) {
        // Do something with return value
        console.log(light_pen_data)
        this.setData({
          picker_position: light_pen_data.light_pen_index, // 图像上设置值
          pen_color: light_pen_data.light_pen_color,
        })
        //this.data.picker_position = ;
        //this.data.pen_color = ;
      }
    } catch (e) {
      // Do something when catch error
      console.log(e);
    }

    // 硬件上灯的个数
    this.data.hardware_lights_array = new Array();
    for(var i = 0; i < this.data.hardware_light_nums; ++i){
      this.data.hardware_lights_array[i] = new HardwareLight(i);
    }

    //硬件灯串
    this.data.light_string_control = new LightStringControl(
      this.data.hardware_light_nums,
      '192.168.31.66', 
      21324);

    // 将画树的区域定义为block，生成所有的block对象
    this.data.block_array = new Array();
    var block_array = this.data.block_array;
    var block_nums = Math.ceil(tree_x/block_x) * Math.ceil(tree_y/block_y);
    for(var i = 0; i < block_nums; ++i){
      block_array[i] = new Block(i);
    }
    //console.log("block array size %d, block0:%d, block1:%d", block_array.length, block_array[0].index, block_array[1].index);
    
    // 计算灯的位置并填充到对应的block中
    // 当触摸到该block时，对该block中的所有的灯进行处理
    for(var r = 1, light_index = 0; r < tree_y;){
      // 计算圆的x坐标和y坐标
      // + tree_x/2 
      var light_x = start_x + tree_x/(2*tree_y) * r * Math.sin(2* Math.PI *Q*r/tree_y)
      var light_y = start_y + r;
      // r+= r_step; // 优化
      //r = r + (this.data.Rmax - ((this.data.Rmax-this.data.Rmin) * r)/this.data.tree_y)/2;
      r = r + Math.min(10, (this.data.light_delta_l * this.data.tree_y * this.data.tree_y) / (Math.PI * this.data.tree_x * Q * r));
      //(this.data.Rmax - ((this.data.Rmax-this.data.Rmin) * r)/this.data.tree_y)/2;

      //console.log("index:%d x:%d y:%d", light_index, light_x, light_y);
      // 获取坐标(x,y)的 block index
      var block_index = this.getBlockIndex(light_x, light_y);
      //console.log("block index:%d", block_index);
      if(block_index != -1){
        block_array[block_index].push_light(new Light(this, light_index++, light_x, light_y, 'white'));
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
    // console.log(this.data.hardware_lights_array);
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

    for(var i = 0; i < this.data.hardware_light_nums; ++i){
      var key = 'light_' + i.toString();
      try {
        var light_data = wx.getStorageSync(key)
        if (light_data) {
          // Do something with return value
          //console.log(key);
          //console.log(light_data);
        } else {
          //console.log("key %s not found", key);
        }
      } catch (e) {
        // Do something when catch error
        //console.log(e);
      }
    }
    console.log("tap");
  },
})

