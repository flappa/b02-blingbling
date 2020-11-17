// pages/udp_1.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    text : "wait to act...",
    port : null,
    udp : null
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
  btnClick : function(){
    console.log("btn 1 is clicked")
    wx.getSystemInfo({
      success (res) {
        console.log(res.model)
        console.log(res.pixelRatio)
        console.log(res.windowWidth)
        console.log(res.windowHeight)
        console.log(res.language)
        console.log(res.version)
        console.log(res.platform)
      }
    })

    var cnt = 0;
    this.setData({text:"udp connect start"})



    const udp = wx.createUDPSocket()
    console.log("here")
    if(udp === null){
      console.log('暂不支持')
      return ;
    }
    udp.bind()
    console.log( udp)
    udp.send({
      // address: '222.20.119.177', 
      address: '192.168.1.100', 
      // address: '255.255.255.255', 
      port: 8848,
      message: 'hello bling bling'
    });
    console.log( udp)
    this.setData({text:"udp send"})
 
    udp.onMessage(function (res){ 
      //字符串转换，很重要
        let unit8Arr = new Uint8Array(res.message);
        let encodedString = String.fromCharCode.apply(null, unit8Arr);
        let message = decodeURIComponent(escape((encodedString)));
      console.log(message)
      console.log(res.remoteInfo.address)
        // that.setData({
        //   receiveMessage: message,
        //   fromIp: res.remoteInfo.address
        // })
    })
 
  }



  

})