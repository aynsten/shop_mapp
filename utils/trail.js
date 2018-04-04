var util = require("util.js");
const app = getApp()

const makeOrder = (api, data, success, error) => {
    wx.showLoading({
        title: '正在提交',
    })
    app.httpPost(api,
        data,
        (json) => {
            wx.hideLoading()
            if (json.status == 1) {
                if (json.data && json.data.payment && json.data.payment.timeStamp) {

                    json.data.payment.timeStamp = json.data.payment.timeStamp.toString()
                    var payment = json.data != null ? json.data.payment : {}
                    //todo 转到支付
                    wx.requestPayment({
                        ...json.data.payment,
                        'success': function (res) {
                            if (res.errMsg == 'requestPayment:ok') {
                                success(json.data)
                            }
                        },
                        'fail': function (res) {
                            error(json.data)
                        },
                        'complete': function (res) {
                            //6.5.2 及之前版本中，用户取消支付不会触发 fail 回调，只会触发 complete 回调
                            //回调 errMsg 为 'requestPayment:cancel'
                            if (res.errMsg == 'requestPayment:cancel') {
                                error(json.data)
                            }
                        }
                    })
                } else {
                    success(json.data)
                }

            } else {
                error(json.message)
            }
        })
}

const uploadFile= (data, success, error = null, handle = null)=> {
    
    wx.chooseImage({
        count: 1,
        success: function (res) {
            var file = res.tempFiles[0]
            if (!file) {
                util.error('请选择要上传的图片')
                return
            }
            if (file.size > 5120000) {
                util.error('您选择的图片过大，可以裁剪后再上传')
                return
            }

            if (typeof data == "string")
                data = { "file_path": data }

            if (typeof handle == "function") {
                var handled = false
                var t = setTimeout(() => {
                    handled = true
                    uploadHandle(data, res.tempFilePaths, success, error)
                }, 600)
                handle(res.tempFilePaths, tempFilePaths => {
                    if (handled) return
                    clearTimeout(t)
                    uploadHandle(data, tempFilePaths, success, error)
                })
            } else {
                uploadHandle(data, res.tempFilePaths, success, error)
            }
        },
        fail: function () {
            if (typeof error == "function") {
                error(null)
            }
        }
    })
}
const uploadHandle= (data, tempFilePaths, success, error = null)=> {
    wx.showLoading({
        title: '文件上传中',
    })
    
    var url = app.globalData.server + 'member/Member/upload'
    if (!app.globalData.debug) {
        url += "?api_version=1.0"
        if (app.globalData.token)
            url += "&token=" + app.globalData.token

    }
    //console.log(url)

    const uploadTask = wx.uploadFile({
        url: url,
        filePath: tempFilePaths[0],
        name: 'file_upload',
        formData: data,
        success: function (res) {
            wx.hideLoading()
            console.log(res)
            var data = res.data
            try {
                if (typeof data == "string")
                    data = JSON.parse(data)
            } catch (e) {
                data = null
            }
            if (data) {
                if (data.status == 1) {
                    success(data.data, data);
                } else {
                    if (typeof error == "function") {
                        error(data)
                    }
                }
            } else {
                if (typeof error == "function") {
                    error(null, res)
                }
            }
        },
        fail: function (res) {
            wx.hideLoading()
            if (typeof error == "function") {
                error(res)
            }
        }
    })
    uploadTask.onProgressUpdate((res) => {
        wx.showLoading({
            title: '已上传 ' + res.progress + '%',
        })
    })
}
const fixListImage = (lists, key = "avatar") => {
    if (!lists || !lists.length) return lists
    for (var i = 0; i < lists.length; i++) {
        lists[i] = fixImage(lists[i], key)
    }
    return lists
}
const fixImage=(obj, key)=>{
    if(!obj )return obj
    if (key.indexOf(',') > 0) {
        key.split(',').forEach((k) => {
            k = k.trim()
            if (k) {
                obj = fixImage(obj, k)
            }
        })
        return obj
    }
    if (!obj[key]) return obj
    if (obj[key] instanceof Array){
        obj[key] = obj[key].map(img=>{
            return fixImageUrl(img)
        })
    }else{
        obj[key] = fixImageUrl(obj[key])
    }
    return obj
}
const fixImageUrl = (url) => {
    if (typeof url !== 'string' || url=='') return url
    if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) return url
    var prefix = app.globalData.imgDir
    if (url.indexOf('/') !== 0) {
        prefix += '/'
    }
    return prefix + url
}

const fixContent = (content)=>{
    if(typeof content!= 'string' || content=='')return content
    //移除不支持的
    content=content.replace(/&emsp;/g,'')
    content = content.replace(/\bid="[^"]+"\s*/g, '')

    content = content.replace(/<([\w]+)\s+(?:class="([^"]+)")?/g,(mth,tag,cls)=>{
        //console.log(tag,cls)
        if(tag=='br'){
            return mth
        }else{
            return '<'+tag+' class="tag_'+tag+(cls?(' '+cls):'')+'" '
        }
    })
    content = content.replace(/src="([^"]+)"/g,(mth,url)=>{
        //console.log(url)
        return 'src="' + fixImageUrl(url) + '"'
    })
    return content
}
module.exports = {
    makeOrder: makeOrder,
    uploadFile: uploadFile,
    fixListImage: fixListImage,
    fixImage: fixImage,
    fixImageUrl: fixImageUrl,
    fixContent: fixContent
}