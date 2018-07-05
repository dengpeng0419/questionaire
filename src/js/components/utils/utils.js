// 依赖的基础库
var $        			 = require('zepto');
var noop     			 = function() {};
var telreg   			 = /^\d{1,11}$/;
var numreg   			 = /^\d+$/;
var ftypereg 			 = /^tel|bank$/i;
var filterInputMap = {
	"tel" : {
		"formatFn"  : "formatTel",
		"validateFn": function(char) { return numreg.test(char); }
	},
	"bank": {
		"formatFn"  : "formatBankNum",
		"validateFn": function(char) { return numreg.test(char); }
	}
};
var modreg         = /^onLine|closeLoop|features|debug$/;


var utils = {
	/** 
	 * 初始化Ajax
	 * @param {obj}     param  ajax参数
	 * @param {boolean} mode   运行模式，有三种：onLine 线上环境，closeLoop 闭环环境，features 功能环境，debug 调试环境
	 * 
	 * add by   : guanghuangjing@jd.com  2016-07-21 09:53
	 * update by: fanbinghua@jd.com      2016-07-22 09:56
	 * update by: fanbinghua@jd.com      2016-07-27 13:57
	 */
	inAjax: function() {
		$.Ajax = function(param) {
			var defaults = {
				dataType   : 'json',
				type       : 'POST',
				contentType: 'application/json',
				data       : {},
				timeout    : 30000,
				xhrFields: {
		            withCredentials: true
		        },
		        crossDomain: true,
		        customUrl: false,
		        loginUrlOpts: ''		// 统一登录界面不显示标题，&onekeylogin=false&show_title=0
			};
			var opts        = $.extend(true, {}, defaults, param);
			var successFn   = noop;
			var errorFn     = noop;
			var mode        = utils.mode;
			var callbackUrl = opts.callbackUrl || location.href;
			var host;
			var loginUrlOpts = opts.loginUrlOpts || '';

			typeof param.success === 'function' && (successFn = param.success);
			typeof param.error === 'function' && (errorFn = param.error);

			typeof opts.data === 'object' && opts.contentType === 'application/json' && (opts.data = JSON.stringify(opts.data));

			opts.headers = $.extend(true, {}, opts.headers, { 'X-Requested-With': 'XMLHttpRequest' });

			// 不同的模式使用不同的地址
			host = utils.host[mode];
			host.substr(0, 2) !== '//' && (host = '//' + host);
			host.substr(host.length - 1, 1) !== '/' && (host += '/');
			if(!opts.customUrl){//营销活动判断是否是某个业务的新用户，当customUrl=true时，用接口地址全称
				opts.url = host + opts.url;
			}

			console.log(opts.data);

			opts.success = function(json, status, xhr) {
				console.log('%c'+ JSON.stringify(json, null, 2), 'color: #333');
				// 登录超时，重新登录
				if (json.error === 'NotLogin' || json.error === 'NoCustomerId') {
					// 生产环境跳到统一登录(联合登录)，其他环境跳到M站登录
					if (mode === 'onLine') {
						location.href = location.protocol + '//plogin.m.jd.com/user/login.action?appid=207'+ loginUrlOpts +'&returnurl=' + encodeURIComponent(callbackUrl);
					//location.href = location.protocol + '//plogin.m.jd.com/user/login.action?appid=100&returnurl=' + encodeURIComponent(location.protocol + '//m.jdpay.com/wallet/login/sid?toUrl=' + callbackUrl);
					} else {
						location.href = location.protocol + '//m.jdpay.com/wallet/login/index.htm?callback=' + encodeURIComponent(callbackUrl);
					}
					return;
				}

				// 业务错误，执行错误回调
		        if (json.code != 0) {
		            errorFn.call(this, json);
		            return;
		        }

				// 成功回调
				// 传出 status 和 xhr 对象
				successFn.call(this, json, status, xhr);
			};
			
			opts.error = function(xhr, type, error) {
				// 传出 type 参数，type为 "timeout", "error", "abort", "parsererror"
				errorFn.call(this, '网络异常，请检查网络', null);
			};

			return $.ajax(opts);
		};
	},

	/**
	 * 本地存储取值
	 * @param  {str} key [本地存储key名称]
	 * @return {str}     [key对应的value值]
	 * time: 2016-07-26 09:38:29
	 */
	getStorage: function(key) {
		var r = false;
		try {
			r = sessionStorage.getItem(key);
		} catch(e) {};
		return r;		
	},

	/**
	 * 本地存储存值
	 * @param  {str} key   [要存储的key名称]
	 * @param  {str} value [key对应的value]
	 * time: 2016-07-26 09:39:38
	 */
	setStorage: function(key, value) {
		try {
			sessionStorage.setItem(key, value);
		} catch(e) {};
	},

	/**
	 * 移除本地存读储
	 * @param  {str} key [要移除的key名称，'all'清除所有key]
	 * time: 2016-07-26 09:45:34
	 */
	removeStorage: function(key) {
		if (!key) return;

		try {
			if (key === 'all') {
				sessionStorage.clear();
			} else {
				sessionStorage.removeItem(key);
			}
		} catch(e) {};
	},

	/**
	  * 将url参数转换成json格式
	  * 
	  * add by: guanghuangjing@jd.com 2016-07-21 09:51
	  */
	parseQs: function() {
		var qs = location.search;
		var qsLen = qs.length;
		var qsArr;
		var item;
		var name;
		var value;
		var args = {};
		if (qsLen) {
			qs = qs.substring(1);
			qsArr = qs.split('&');
			qsLen = qsArr.length;
			for (var i = 0; i < qsLen; i++) {
				item = qsArr[i].split('=');
				name = decodeURIComponent(item[0]);
				value = decodeURIComponent(item[1]);
				name.length && (args[name] = value);
			}
		}
		return args;
	},

	/**
	 * 用给定的符号按每若干字符分隔字符串
	 * @param {string} str  需要进行分隔的字符串
	 * @param {string} per  每多少个字符串进行分隔，默认为 4
	 * @param {string} mark 分隔符号，默认为一个空格
	 */
	splitStr: function(str, per, mark) {
		var splitReg;
		var splitStr;
		var needClear;

		!numreg.test(per) && (per = 4);
		mark == null && (mark = ' ');
		
		if (per === 0) {
			return str;
		}

		splitStr  = String(str);
		needClear = !(splitStr.length % per);

		splitReg = new RegExp('([\\s\\S]{' + per + '})', 'ig');
		splitStr = splitStr.replace(splitReg, '$1' + mark);

		needClear && (splitStr = splitStr.substring(0, splitStr.length - mark.length));

		return splitStr;
	},

	/**
	 * 按中国的手机号格式对一串在 11 位以内（包括 11 位）的数字字串进行格式化
	 * @param {string} numStr 数字字符串
	 * 
	 * add by: fanbinghua@jd.com 2016-07-22 14:31
	 */
	formatTel: function(numStr) {
		var str = String(numStr);
		var beginStr;
		var endStr;

		// 不是数字字符串或者字符串的长度小于等于 3 个，直接返回原始内容
		if (!telreg.test(str) || str.length <= 3) {
			return numStr;
		}
		
		beginStr = str.substring(0, 3);
		endStr = utils.splitStr(str.substring(3));

		return beginStr + ' ' + endStr;
	},

	/**
	 * 格式化银行卡号
	 * @param {string} numStr 数字字符串
	 * 
	 * add by: fanbinghua@jd.com 2016-07-22 14:31
	 */
	formatBankNum: function(numStr) {
		var str = String(numStr);

		// 如果传入的字符串不是数字字符串，则返回原始内容
		if (!numreg.test(str)) {
			return numStr;
		}

		return utils.splitStr(str);
	},

	/**
	 * 过滤输入
	 * @param {object} 输入控件，注意，该控件不能是 number 类型的
	 * @param {string} 过滤类型
	 * @param {string} 最大可输入字符长度
	 * @param {function} 文本变化前事件处理
	 * @param {function} 文本变化后事件处理
	 */
	filterInput: function(finput, ftype, maxlength, ichangeCb, ichangedCb) {
		var $input = $(finput);
		var type   = String(ftype);
		var maxlen = String(maxlength);
		var formatFn;
		var validateFn;
		var changeCb = noop;
		var changedCb= noop;

		typeof ichangeCb === 'function' && (changeCb = ichangeCb);
		typeof ichangedCb=== 'function' && (changedCb= ichangedCb);

		// 如果没有指定类型的过滤输入或者没有指定最大可输入长度，则直接返回
		if (!ftypereg.test(type) || !numreg.test(maxlen)) {
			return;
		}

		// 根据 ftype 获取格式化功能函数
		formatFn = utils[ filterInputMap[type].formatFn ];
		// 根据 ftype 获取校验功能函数
		validateFn = filterInputMap[type].validateFn;

		// 安卓机型多，兼容性问题复杂，只限定长度
		if (navigator.userAgent.indexOf('Android') !== -1) {

			$input.on('input', function(e) {

	      changeCb.call(this, this.value, this.value);

				if (this.value.length > maxlen) {
					this.value = this.value.slice(0, maxlen);
				}

				changedCb.call(this, this.value, this.value);

			});

			return;
		}

		$input.on('textInput textinput', function(e) {
			var curShowTxt = this.value;
			var curValue   = curShowTxt.replace(/\s/g, '');
			var curValueLen= curValue.length;
			var ichar;
			var newValue; 

			var posStart;
			var posEnd;
			var prevTxt;
			var afteTxt;
			var newPos;

			// 检查最大长度
			if (curValueLen >= maxlen) {
				return false;
			}

			// 获取当前输入的字符
			ichar = e.data;

			// 校验当前输入的字符
			if (!validateFn(ichar)) {
				return false;
			}

			// 获取输入框范围的开始位置和结束位置
			posStart = this.selectionStart;
      posEnd   = this.selectionEnd;

      // 获取光标之前的文本
      prevTxt = curShowTxt.substring(0, posStart);
      // 获取光标之后的文本
      afteTxt = curShowTxt.substring(posEnd);
      // 新值
      newValue = (prevTxt + ichar + afteTxt).replace(/\s/g, '');
      
      // 需要检查新值的长度是否已经超过最大长度了，因为输入的字符 ichar 不一定是一个字符
      // 也有可能是通过复制粘贴的多个字符
      if (newValue.length > maxlen) {
      	return false;
      }

      // 触发文本变化前的事件，如果返回 false，则阻止输入
      if (changeCb.call(this, curValue, curShowTxt) === false) {
      	return false;
      }

      // 新的显示值
      curShowTxt = formatFn(newValue);
      // 显示格式化后的文本
      this.value = curShowTxt;

      // 触发文本变化后的事件
      changedCb.call(this, newValue, curShowTxt);

      // 计算光标的位置
      newPos = posStart + ichar.length;
      (posStart + 1) % 5 === 0 && (newPos += 1);

      // 设置光标位置
     	clearTimeout(this._timerId);
      this._timerId = setTimeout(function() {
      	// 设置光标位置
      	this.setSelectionRange(newPos, newPos);
      }.bind(this), 0);

      return false;
		}).on('keydown', function(e) {
			if (e.which !== 8) {
				return;
			}
			var curShowTxt = this.value;
			var curValue   = curShowTxt.replace(/\s/g, '');
			var newValue;

			var posStart = this.selectionStart;
			var posEnd   = this.selectionEnd;
			var selectionTxt = curShowTxt.substring(posStart, posEnd);
			
			var prevTxt;
			var afteTxt;
			var newPos;
			
			// 如果没有选择范围，默认选择光标前一个字符
			if (posStart === posEnd) {
				posStart -= 1;
			}

			// 如果选择的范围是一个空格
			if (selectionTxt === ' ') {
				posStart -= 1;
			}

			// 获取光标之前的文本
      prevTxt = curShowTxt.substring(0, posStart);
      // 获取光标之后的文本
      afteTxt = curShowTxt.substring(posEnd);
      // 新值
      newValue = (prevTxt + afteTxt).replace(/\s/g, '');


      // 触发文本变化前的事件，如果返回 false，则阻止输入
      if (changeCb.call(this, curValue, curShowTxt) === false) {
      	return false;
      }


      // 新的显示值
      curShowTxt = formatFn(newValue);
      // 显示格式化后的文本
      this.value = curShowTxt;


      // 触发文本变化后的事件
      changedCb.call(this, newValue, curShowTxt);

      // 计算光标位置
      newPos = posStart;

      // 设置光标位置
     	clearTimeout(this._timerId);
      this._timerId = setTimeout(function() {
      	// 设置光标位置
      	this.setSelectionRange(newPos, newPos);
      }.bind(this), 0);

			return false;
		});
	},

	env: function() {
		var ua        = navigator.userAgent.toLowerCase();
		var isJdsc    = ua.indexOf('jdapp') >= 0;
		var isJdjr    = ua.indexOf('jdjr-app') >= 0;
		var isJdqb    = ua.indexOf('walletclient') >= 0;
		var isWeixin  = ua.indexOf('micromessenger') >= 0;
		var isAndroid = ua.indexOf('android') >= 0;
		var isIOS     = /ipad|iphone|ipod/i.test(ua) && !window.MSStream;
		return {
		  isJdsc: isJdsc,
		  isJdjr: isJdjr,
		  isJdqb: isJdqb,
		  isWeixin: isWeixin,
		  isAndroid: isAndroid,
		  isIOS: isIOS
		};
	},

	// 主机配置
	host: {
		// 线上环境
		onLine   : 'rebateapi.jdpay.com',

		// 闭环环境
		closeLoop: '10.9.7.4:8080/extMarket/jdjr',

		// 功能环境
		features : 'rebateapi.jdpay.com',

		// 调试环境
		debug    : location.host
	},

	// 默认模式为调试模式
	mode: 'onLine'
};

utils.inAjax();

module.exports = utils;