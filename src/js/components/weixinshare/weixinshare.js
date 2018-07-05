var signatureUrl = '//jrappgw.jd.com/wxjdissue/JDIssue/web/getJssdkSignInfo';
var jsApiList = [
  // 分享接口
  'onMenuShareTimeline',
  'onMenuShareAppMessage',
  'onMenuShareQQ',
  'onMenuShareWeibo',
  'onMenuShareQZone',
  // 界面操作
  'hideOptionMenu',
  'showOptionMenu',
  'closeWindow',
  'hideMenuItems',
  'showMenuItems',
  'hideAllNonBaseMenuItem',
  'showAllNonBaseMenuItem'
];

function powerValidateConf(appId, timestamp, nonceStr, signature, shareParam) {
  // config 成功后调用的函数
  wx.ready(function() {
    // 获取“分享到朋友圈”按钮点击状态及自定义分享内容接口
    wx.onMenuShareTimeline({
      title : shareParam.title,  // 分享标题
      link  : shareParam.link,   // 分享链接
      imgUrl: shareParam.imgUrl, // 分享图标
      success: shareParam.success,
      cancel: shareParam.cancel
    });
    // 获取“分享给朋友”按钮点击状态及自定义分享内容接口
    wx.onMenuShareAppMessage({
      title  : shareParam.title,  // 分享标题
      desc   : shareParam.desc,   // 分享描述
      link   : shareParam.link,   // 分享链接
      imgUrl : shareParam.imgUrl, // 分享图标
      type   : 'link',       // 分享类型,music、video或link，不填默认为link
      dataUrl: '',           // 如果type是music或video，则要提供数据链接，默认为空
      success: shareParam.success,
      cancel: shareParam.cancel
    });
    // 获取“分享到QQ”按钮点击状态及自定义分享内容接口
    wx.onMenuShareQQ({
      title  : shareParam.title,  // 分享标题
      desc   : shareParam.desc,   // 分享描述
      link   : shareParam.link,   // 分享链接
      imgUrl : shareParam.imgUrl, // 分享图标
      success: shareParam.success,
      cancel: shareParam.cancel
    });
    // 获取“分享到腾讯微博”按钮点击状态及自定义分享内容接口
    wx.onMenuShareWeibo({
      title  : shareParam.title,  // 分享标题
      desc   : shareParam.desc,   // 分享描述
      link   : shareParam.link,   // 分享链接
      imgUrl : shareParam.imgUrl, // 分享图标
      success: shareParam.success,
      cancel: shareParam.cancel
    });
    // 获取“分享到QQ空间”按钮点击状态及自定义分享内容接口
    wx.onMenuShareQZone({
      title  : shareParam.title,  // 分享标题
      desc   : shareParam.desc,   // 分享描述
      link   : shareParam.link,   // 分享链接
      imgUrl : shareParam.imgUrl, // 分享图标
      success: shareParam.success,
      cancel: shareParam.cancel
    });
  });
  // config 失败后调用的函数
  wx.error(function(res) {
    console.log(res);
  });
  // 注入权限验证配置
  wx.config({
    debug: false,
    appId: appId,
    timestamp: timestamp,
    nonceStr: nonceStr,
    signature: signature,
    jsApiList: jsApiList
  });
}
// 微信JS-SDK权限验证初始化
function wxready(pageUrl, shareParam) {
  // 获取签名信息
  $.ajax({
    url: signatureUrl,
    type: 'post',
    xhrFields: {
      withCredentials: true
    },
    contentType: 'text/plain',
    data: JSON.stringify({
      appidFlag: "jdzf",
      curUrl: pageUrl
    }),
    dataType: 'json',
    cache: false,
    success: function(data, status, xhr) {
      var res = data;
      if (res.code == 0) {
        // 加载 wxjsbridge
        if (!window.wx) {
          var wxsc = document.createElement("script");
          wxsc.onload = function() {
            wxsc.onload = wxsc.onerror = null;
            powerValidateConf(
              res.appId,
              res.timestamp, 
              res.nonceStr, 
              res.signature,
              shareParam
            );
          };
          wxsc.onerror = function() {
            wxsc.onload = wxsc.onerror = null;
          };
          wxsc.src = "//res.wx.qq.com/open/js/jweixin-1.2.0.js";
          var s = document.getElementsByTagName("script")[0];
          s.parentNode.insertBefore(wxsc, s);   
        } else {
          powerValidateConf(
            res.appId,
            res.timestamp, 
            res.nonceStr, 
            res.signature,
            shareParam
          );
        }
      } else {
        console.log(res.desc);
      }
    },
    error: function() {}
  });
}

module.exports = {
  share: function(shareParam) {
    if (!shareParam.success) {
      shareParam.success = function() {};
    }
    if (!shareParam.cancel) {
      shareParam.cancel = function() {};
    }
    wxready(window.location.href.split('#')[0], shareParam);
  }
};