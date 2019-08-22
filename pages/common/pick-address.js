// pages/common/pick-address.js
var util = require("../../utils/util.js");
const app=getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        selectedid: 0,
        callback: "",
        addresses: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.initShare(null)
        if (options.id) {
            this.setData({
                selectedid: options.id
            })
        }
        if (options.callback) {
            this.setData({
                callback: options.callback
            })
        }
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
        var self = this
        app.checkLogin(() => {
            app.httpPost('member.address/index', {}, (json) => {
                if (json.code == 1) {
                    self.setData({
                        addresses: json.data
                    })
                }
            })
        })
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
    manageAddress: function () {
        wx.navigateTo({
            url: '/pages/member/address',
        })
    },
    pickAddress: function (e) {
        var id = e.currentTarget.dataset.id
        this.setData({
            selectedid: id
        })
        var self = this
        util.confirm('使用此地址作为您的服务地址？', () => {

            self.onComplete(null)
        })
    },
    onComplete: function (e) {
        if (this.data.callback) {
            var pages = getCurrentPages()
            var selectedid = this.data.selectedid
            var address = null
            var addresses = this.data.addresses
            for (var i = 0; i < addresses.length; i++) {
                if (selectedid == addresses[i].address_id) {
                    address = addresses[i]
                    break
                }
            }
            if (!address) {
                util.error('请选择服务地址')
                return
            }
            pages[pages.length - 2][this.data.callback](address)
        }
        wx.navigateBack({

        })
    }
})