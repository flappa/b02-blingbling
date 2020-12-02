// pages/draw/draw_1.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

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
  const ctx = wx.createCanvasContext('canvas')

  var r = 5;
  var startX = 207 , startY = 5;
  for(var num = 1;num<50;num++){
    console.log(num);//1,2,3,4,5,6,7,8,9
    ctx.arc(startX, startY + num*r*2, r, 0, 2*Math.PI,false)
    ctx.setStrokeStyle('white')
    ctx.stroke()
    ctx.draw(true)
   }
  //  ctx.draw(true)

  // ctx.arc(100, 75, 10, 0, 2*Math.PI,false)
  // ctx.setStrokeStyle('white')
  // ctx.stroke()
  // ctx.draw()

  ctx.arc(250, 75, r, 0, 2 * Math.PI, true)
  ctx.setFillStyle('#0000ff')
  ctx.fill()
  ctx.draw(true)//true表示保留之前绘制内容

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

  }
})