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
    isFirst : 1,
    LightDataToSend: null,
    LightDataLen: 100 // 硬件上灯的个数
  },

  // 收集缓存中的数据并放到LightDataToSend中
  updateLightDataToSend: function(){
    // 从缓存中拿出来所有的数据
    for(var i = 0; i < this.data.LightDataLen; ++i){
      var key = 'light_' + i.toString();
      try {
        var light_data = wx.getStorageSync(key)
        if (light_data) {
          // Do something with return value
          this.data.LightDataToSend[i].light_color = light_data.light_color;
          this.data.LightDataToSend[i].light_switch = light_data.light_switch;
        } else {
          console.log("key %s not found", key);
        }
      } catch (e) {
        // Do something when catch error
        console.log(e);
      }
    }
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.LightDataToSend = new Array();
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
    console.log("btn init is clicked")
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
    else{
      console.log("already init")
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
    console.log("btn send is clicked")
    this.setData({text:"udp connect start"})

    console.log("isFirst: %d", this.data.isFirst)

    //send_data = (struct.pack('>BB', 1, 255))
    //send_data =  send_data + (struct.pack('>BBBB', i, 255, 0, 0))
    var send_data = new Uint8Array(6);
    send_data[0] = 1;
    send_data[1] = 255;
    send_data[2] = 0;
    send_data[3] = 255;
    send_data[4] = 255;
    send_data[5] = 255;

    this.data.udp.send({
      address: '192.168.31.66', 
      port: 21324,
      message: send_data
    });

    this.setData({text:"udp send"})
    console.log("send finish")
  },

  btnClose : function(){
    console.log("btn close is clicked")
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