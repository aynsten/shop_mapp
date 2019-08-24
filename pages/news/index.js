// pages/news/index.js
var util = require("../../utils/util.js");
var trail = require("../../utils/trail.js");
const app = getApp()

Component({
    options: {
        addGlobalClass: true,
    },
    properties: {
        ispulldown: {
            type: Boolean,
            observer: function (newVal, oldVal) {
                console.log('ispulldown:', newVal)
                if (newVal) {
                    this.reload()
                }
            }
        },
        isreachbottom: {
            type: Boolean,
            observer: function (newVal, oldVal) {
                console.log('isreachbottom:', newVal)
                if (newVal) {
                    this.loadData()
                }
            }
        }
    },
    /**
     * 页面的初始数据
     */
    data: {
        lists: [],
        page: 1,
        has_more: true,
        isloading: true,
        isattached: false
    },
    lifetimes: {
        /**
         * 生命周期函数--监听页面加载
         */
        attached: function (options) {
            this.data.isattached = true
            this.triggerEvent('request', { pulldown: true, reachbottom: true })
            app.getSiteInfo((siteinfo) => {
                if (this.data.isattached) {
                    this.triggerEvent('sharedata', {
                        title: siteinfo.webname + '-新闻中心',
                        img: siteinfo.weblogo
                    })
                }
            })
        },
        moved: function () { },
        detached: function () {
            this.data.isattached = false
        },
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    ready: function () {
        app.httpPost('article/get_cates?pid=news', json => {
            if (json.code == 1) {
                if (json.data && json.data.length > 0) {
                    this.setData({
                        cates: json.data,
                        cate_id: json.data[0].id
                    })
                }
                this.loadData()
            }
        })
    },
    methods: {
        reload() {
            if (this.data.isloading) {
                return;
            }
            this.data.page = 1;
            this.setData({
                lists: [],
                has_more: true,
                isloading: true
            })
            this.loadData()
        },
        loadData: function () {
            if (!this.data.has_more) {
                this.isreachbottom = false
                return;
            }
            var cid = this.data.cate_id
            var page = this.data.page
            app.httpPost('article/get_list?cate=' + cid, json => {
                if (json.code == 1 && cid == this.data.cate_id) {
                    json.data.lists = trail.fixListImage(json.data.lists, 'cover')
                    json.data.lists = trail.fixListDate(json.data.lists, 'Y-m-d', 'create_time')
                    this.setData({
                        lists: this.data.lists.concat(json.data.lists),
                        page: page + 1,
                        has_more: json.data.total_page >= page ? true : false,
                        isloading: false
                    })

                    this.ispulldown = false
                    this.isreachbottom = false
                }
                wx.stopPullDownRefresh()
            })
        },


        /**
         * 页面相关事件处理函数--监听用户下拉动作
         */
        onPullDownRefresh: function () {
            this.setData({
                page: 1,
                lists: [],
                has_more: true,
                isloading: true
            })
            this.loadData()
        },

        gotoList: function (e) {
            var id = e.currentTarget.dataset.id
            wx.navigateTo({
                url: 'list?cate_id=' + id,
            })
        },
        changeCategory: function (e) {
            var id = e.currentTarget.dataset.id
            this.setData({
                cate_id: id,
                page: 1,
                has_more: true,
                lists: [],
                isloading: true
            })
            this.loadData()
        },
        gotoDetail: function (e) {
            var id = e.currentTarget.dataset.id
            wx.navigateTo({
                url: 'detail?id=' + id,
            })
        }
    }
})