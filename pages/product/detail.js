// pages/product/detail.js
const util = require("../../utils/util.js");
const trail = require("../../utils/trail.js");
const Product = require("../../utils/product.js");
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        indicatorDots: false,
        autoplay: false,
        interval: 4000,
        duration: 500,
        currentIndex: 1,
        screenWidth: 500,

        member:{},
        //product:null,
        id: 0,
        model: null,
        postage:'免运费',
        hasProp:false,
        is_favourite:0,
        albums: null,
        skus: null,
        price: '',
        market_price: '',
        allstorage:0,
        good_count:1,
        options:{},

        cart_count:0,

        maskfor:''
    },

    //组件数据
    product:null,
    params:{},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if (options.id) {
            this.setData({
                id: parseInt(options.id)
            })
            this.params.id=this.data.id
        }
        if (app.globalData.systemInfo){
            this.setData({
                screenWidth: app.globalData.systemInfo.windowWidth
            })
        }
        this.updateCartCount()
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        app.getProfile(profile=>{
            this.setData({member:profile})
            this.loadData()
        })
    },
    loadData(){
        app.httpPost('product/view', { id: this.data.id }, json => {
            if (json.code == 1) {
                let model = json.data.product
                let albums = trail.fixListImage(json.data.images, 'image')
                
                let productModel = new Product(model, json.data.skus, this.data.member?this.data.member.level:null)
                
                this.product = productModel
                let product = productModel.getProduct()
                let skus = productModel.getSkus()
                this.setData({
                    model: product,
                    postage: json.data.postage,
                    //product:product,
                    is_favourite:json.data.is_favourite,
                    albums: albums,
                    skus: skus,
                    allstorage: productModel.getAllStorage(),
                    sku:skus && skus.length==1?skus[0]:null,
                    specstext: productModel.getSpecText(),
                    proptext: productModel.getPropText(),
                    hasProp: model.prop_data && util.countObject(model.prop_data)>0
                })
                this.setPrice()
                app.initShare(this, product.title, product.image)
            }
        })
    },
    bannerChange: function (e) {
        this.setData({
            currentIndex: e.detail.current+1
        })
    },
    setPrice: function () {
        let product=this.product
        this.setData({
            price: product.getPriceText(),
            price_desc: product.getPriceDescText(),
            market_price: product.getMarketPriceText()
        })
    },
    openModal: function (e, frm = '') {
        var data = {
            ismask: true,
            opt_from: frm,
            modal_title: e.currentTarget.dataset.title,
            maskfor: e.currentTarget.dataset.for
        }
        if (data.maskfor == 'spec') {
            if (!this.data.sku && this.data.skus instanceof Array && this.data.skus.length > 0) {
                data.selected = this.product.getSelectedText( this.data.options)
                data.sku = this.product.searchSku()
                data.optsku = this.product.getSpecStatus(this.data.options)
            }
        }
        this.setData(data)
    },
    hideModal: function (e) {
        this.setData({
            ismask: false,
            modal_title:'',
            maskfor: ''
        })
    },
    confirmModal: function (e) {
        if(this.maskfor=='spec'){
            if(this.opt_from=='buy'){
                this.sureAddCart(e)
            }else{
                this.sureBuy(e)
            }
        }else{
            this.hideModal();
        }
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

    updateCartCount:function(){
        trail.getCartCount(count => {
            this.setData({
                cart_count: count
            })
        })
    },
    selectOption: function (e) {
        var d = e.currentTarget.dataset
        var options = this.data.options
        if (!this.data.optsku[d.spec_id]
            || !this.data.optsku[d.spec_id][d.value]) {
            return
        }
        if (options[d.spec_id] == d.value) {
            delete options[d.spec_id]
        } else {
            options[d.spec_id] = d.value
        }
        var sku = this.product.searchSku(options)
        this.setData({
            sku: sku,
            options: options,
            optsku: this.product.getSpecStatus( options),
            selected: this.product.getSelectedText( options)
        })
    },
    countGrow(e) {
        if (this.data.sku == null) {
            console.log('countGrow')
            app.error("请选择商品规格")
            return
        }
        var d = e.currentTarget.dataset
        var grow = parseInt(e.target.dataset.grow)
        grow = grow + this.data.good_count
        if (grow < 1) {
            grow = 1
        }
        if (this.data.model.max_buy != null && grow > this.data.model.max_buy) {
            app.error("超出商品的限制购物数量")
            return
        }
        if (grow > this.data.sku.storage) {
            app.error("库存不足")
            return
        }
        this.setData({
            good_count: grow
        })
    },
    setCount(e) {
        if (this.data.sku == null) {
            console.log('setCount')
            app.error("请选择商品规格")
            return
        }
        var value = parseInt(e.detail.value)
        if (value > this.data.sku.storage) {
            app.error("库存不足")
            return
        }
        if (value < 1) {
            value = 1
        }
        this.setData({
            good_count: value
        })
    },
    gotocart:function(e){
        app.switchIndex('cart')
    },
    checkLogin(){
        if(!this.data.member.id){
            wx.showModal({
                title: '未登录',
                content: '请登录后购买',
                cancelText:'暂不登录',
                confirmText:'现在登录',
                success(res) {
                    if (res.confirm) {
                        app.switchIndex('member')
                    } 
                }
            })
            return false
        }
        return true
    },
    /**
     * 添加到购物车
     */
    addtocart:function(e=null){
        this.openModal(e, 'cart')
    },
    sureAddCart: function (e) {
        if(!this.checkLogin())return
        if (!this.data.sku) {
            app.error('请选择规格')
        } else {
            if (this.data.sku.storage < 1) {
                app.error('该商品暂时缺货')
                return
            }
            var data = {
                sku_id: this.data.sku.sku_id,
                count: this.data.good_count
            }
            app.httpPost('cart/add', data, json => {
                if (json.code == 1) {
                    app.success('成功添加到购物车')
                    this.updateCartCount()
                } else {
                    app.error(json.msg)
                }
                this.hideModal()
            })
        }
    },
    buynow: function (e=null) {
        if (this.data.sku) {
            this.sureBuy(e)
        } else {
            this.openModal(e, 'buy')
        }
    },
    sureBuy: function (e) {
        if (!this.checkLogin()) return
        if (!this.data.sku) {
            app.error('请选择规格')
        } else {
            if (this.data.sku.storage < 1) {
                app.error('该商品暂时缺货')
                return
            }
            this.hideModal()
            wx.navigateTo({
                url: '../order/confirm?from=buy&storage=' + this.data.sku.storage + '&data=cartdata',
                success:  (res) =>{
                    if (res.eventChannel) {
                        res.eventChannel.emit('acceptDataFromOpenerPage', this.getOrderData())
                    } else {
                        app.globalData['cartdata'] = this.getOrderData()
                    }
                 }
            })
        }
    },
    getOrderData: function () {
        var product = this.data.model
        var cart = {}
        cart.sku_id = this.data.sku.sku_id
        cart.product_price = this.data.sku.price
        cart.product_image = product.image
        cart.count = this.data.good_count > 1 ? this.data.good_count : 1
        cart.product_id = product.id
        cart.product_title = product.title
        //cart.promotion = this.data.promotions,
        //cart.max_buy = product.max_buy

        return [cart]
    },
    setFavourite: function (e) {
        wx.showLoading({
            title: '正在处理',
        })
        if (this.data.is_favourite) {
            app.httpPost('member/del_favourite',
                { type: 'product',ids: [this.data.model.id] },
                (json) => {
                    wx.hideLoading()
                    if (json.code == 1) {
                        this.setData({
                            is_favourite: false
                        })
                        app.success('已移除收藏')
                    }
                })
        } else {
            app.httpPost('member/add_favourite',
                { type:'product',id: this.data.model.id },
                (json) => {
                    wx.hideLoading()
                    if (json.code == 1) {
                        this.setData({
                            is_favourite: true
                        })
                        app.success('已加入收藏')
                    }
                })
        }
    },
    emptyEvent:function(e=null){
        if(e){
            
        }
    }
})