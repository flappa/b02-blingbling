// pages/udp_1.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    text : "wait to act...",
    Rxtext : "wait to Rec...",
    fromIp : null,
    udp : null,
    UdpSendPort : null,
    isFirst : 1
    
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
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

  // udp 按键
  btnInit : function(){
    console.log("btn 0 is clicked")
    console.log("udp init")
    if(this.data.isFirst)
    {
      this.setData({udp: wx.createUDPSocket()});
      if(this.data.udp === null){
        console.log('暂不支持')
        return ;
      }
      this.setData({UdpSendPort: this.data.udp.bind()});
      console.log(this.data.udp)
      console.log("The udpPort is %d", this.data.UdpSendPort)

      this.data.udp.onListening(this.data.udp.onMessage)
      this.setData({isFirst: 0});
    }



    var that = this;
    this.data.udp.onMessage(function (res){ 
        //字符串转换，很重要
        let unit8Arr = new Uint8Array(res.message);
        let encodedString = String.fromCharCode.apply(null, unit8Arr);
        let message = decodeURIComponent(escape((encodedString)));
      console.log(message);
      console.log(res.remoteInfo.address);
      that.setData({Rxtext: message,   fromIp: res.remoteInfo.address});
    })

  },

  btnSend : function(){
    console.log("btn 1 is clicked")
    // wx.getSystemInfo({
    //   success (res) {
    //     console.log(res.model)
    //     console.log(res.pixelRatio)
    //     console.log(res.windowWidth)
    //     console.log(res.windowHeight)
    //     console.log(res.language)
    //     console.log(res.version)
    //     console.log(res.platform)
    //   }
    // })
    
    this.setData({text:"udp connect start"})

    console.log("isFirst: %d", this.data.isFirst)
    console.log("here")

    this.data.udp.send({
      address: '192.168.1.100', 
      port: 8848,
      message: 'hello bling bling'
    });

    this.setData({text:"udp send"})

  },

  btnClose : function(){
    this.data.udp.close()
    this.setData({isFirst: 1});







    // const ctx = wx.createCanvasContext('myCanvas')

    // // Draw coordinates
    // ctx.arc(100, 75, 50, 0, 2 * Math.PI)
    // ctx.setFillStyle('#EEEEEE')
    // ctx.fill()
    
    // ctx.beginPath()
    // ctx.moveTo(40, 75)
    // ctx.lineTo(160, 75)
    // ctx.moveTo(100, 15)
    // ctx.lineTo(100, 135)
    // ctx.setStrokeStyle('#AAAAAA')
    // ctx.stroke()
    
    // ctx.setFontSize(12)
    // ctx.setFillStyle('black')
    // ctx.fillText('0', 165, 78)
    // ctx.fillText('0.5*PI', 83, 145)
    // ctx.fillText('1*PI', 15, 78)
    // ctx.fillText('1.5*PI', 83, 10)
    
    // // Draw points
    // ctx.beginPath()
    // ctx.arc(100, 75, 2, 0, 2 * Math.PI)
    // ctx.setFillStyle('lightgreen')
    // ctx.fill()
    
    // ctx.beginPath()
    // ctx.arc(100, 25, 2, 0, 2 * Math.PI)
    // ctx.setFillStyle('blue')
    // ctx.fill()
    
    // ctx.beginPath()
    // ctx.arc(150, 75, 2, 0, 2 * Math.PI)
    // ctx.setFillStyle('red')
    // ctx.fill()
    
    // // Draw arc
    // ctx.beginPath()
    // ctx.arc(100, 75, 50, 0, 1.5 * Math.PI)
    // ctx.setStrokeStyle('#333333')
    // ctx.stroke()
    
    // ctx.draw()

  },

  btnDraw: function(){
          wx.navigateTo({
              url: '../draw/draw_1'
          })
  }

  

})