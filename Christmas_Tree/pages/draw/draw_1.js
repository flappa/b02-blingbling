// pages/draw/draw_1.js
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
    y_pos:500
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
  // const ctx = wx.createCanvasContext('canvas')

  var right = 390;
  var down = 670;
  this.data.ctx.moveTo(10, 10)
  // ctx.lineTo(this.data.drawWidth, 10)
  // ctx.lineTo(this.data.drawHeight, this.data.drawHeight)
  this.data.ctx.lineTo(right, 10)
  this.data.ctx.lineTo(right, down)
  this.data.ctx.closePath()
  this.data.ctx.setStrokeStyle('white')
  this.data.ctx.stroke()
  this.data.ctx.draw()



  var r = this.data.bulbR;
  var startX = 207 , startY = 5;
  for(var num = 1;num<25;num++){
    // console.log(num);//1,2,3,4,5,6,7,8,9
    console.log("x0:%d, y0:%d", startX, startY + num*r*2);//1,2,3,4,5,6,7,8,9
    this.data.ctx.arc(startX, startY + num*r*2, r, 0, 2*Math.PI,false)
    this.data.ctx.setStrokeStyle('white')
    this.data.ctx.stroke()
    this.data.ctx.draw(true)
   }
  //  ctx.draw(true)

  // ctx.arc(100, 75, 10, 0, 2*Math.PI,false)
  // ctx.setStrokeStyle('white')
  // ctx.stroke()
  // ctx.draw()

  // ctx.arc(250, 75, r, 0, 2 * Math.PI, true)
  // ctx.setFillStyle('#0000ff')
  // ctx.fill()
  // ctx.draw(true)//true表示保留之前绘制内容

    console.log("here")
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
    // this.lastTimestamp = event.timeStamp;
    this.setData({ isTap: true })
    // //draw
    // this.context.arc(this.lastLoc.x, this.lastLoc.y, this.data.boldVal / 2, 0, 2 * Math.PI)
    // this.context.setFillStyle(this.data.curColor);
    // this.context.fill();
    // wx.drawCanvas({
    //   canvasId: 'canvas',
    //   reserve: true,
    //   actions: this.context.getActions() // 获取绘图动作数组
    // })

},

endStroke(event) {
  console.log(event)
  // console.log(event.touches[0].x)
  // console.log(event.touches[0].y)
  this.isMouseDown= false
},

moveStroke(event) {
  if (this.isMouseDown && event.touches.length == 1) {
    console.log(event)
    console.log(event.touches[0].x)
    console.log(event.touches[0].y)
    var touch = event.touches[0];
    var curLoc = { x: touch.x, y: touch.y };
    this.setData ({
      x_pos: curLoc.x,
      y_pos: curLoc.y,
    });

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
    // var context = this.context;
    // var curTimestamp = event.timeStamp;
    // var s = this.calcDistance(curLoc, this.lastLoc)
    // var t = curTimestamp - this.lastTimestamp;
    // var lineWidth = this.calcLineWidth(t, s)
    //draw
 
    // context.setStrokeStyle(this.data.curColor);
    // context.setLineWidth(lineWidth);
    // context.beginPath()
    // context.moveTo(this.lastLoc.x, this.lastLoc.y)
    // context.lineTo(curLoc.x, curLoc.y)




    // context.setLineCap("round")
    // context.setLineJoin("round")
    // context.stroke();

    this.lastLoc=curLoc;
    // this.setData({ lastTimestamp: curTimestamp })
    // this.setData({ lastLineWidth: lineWidth })

    // wx.drawCanvas({
    //   canvasId: 'canvas',
    //   reserve: true,
    //   actions: this.context.getActions() // 获取绘图动作数组
    // })
  
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
    // console.log("length:%d", event.touches.length)
    // var xMove = event.touches[1].x - event.touches[0].x;
    // var yMove = event.touches[1].y - event.touches[0].y;
    // var newdistance = Math.sqrt(xMove*xMove + yMove*yMove);


  }
},







})

