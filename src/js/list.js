require('../css/list.less');
// 依赖的基础库
var $ = require('zepto');
var template = require('template');

var Toast = require('toast');
var utils = require('utils');
var Loading = require('loading');
var jumpUrl = window.location.href.replace('list', 'index');

$(function () {
	var urlToken = utils.parseQs().token;
	var data = {};
	var deptId = '';  //部门id
	var token = '';
	var apFlag = 'false';
	
	//Loading.show();
	$.Ajax({
		customUrl: true,
		url: '/ap/test/getPeriodDeptList',
		data: {
			token: urlToken,
		},
		success: function(json) {
			Loading.hide();
			//alert(JSON.stringify(json.resultData));
			if (json && json.code == 0) {
				data = json.data || {};
				var html = template('q_item', data);
				$('.questions').html(html);
				$('.submit_button').removeClass('hide');
				//console.log($("input[apFlag='false']")[0])
				if($("input[apFlag='false']")[0]) {
					$("input[apFlag='false']")[0].setAttribute('checked', 'checked');
				}
				if(data.deptList && $("input[apFlag='true']").length === data.deptList.length) {
					apFlag = 'true'
				}
				addListens()
			}
		},
		error: function(erro) {
			Loading.hide();
			Toast(erro.msg || '系统正在开小差')
		}
	})
	
	function addListens() {
		$('input').on('click', function(){
			deptId = this.getAttribute('id');
			token = this.getAttribute('value');
			apFlag = this.getAttribute('apflag');
			//console.log($("input[name='1']")[0])
		})
		
		$('.submit_button').on('click', function() {
			deptId = $("input:checked").val();
			//console.log($('input')[0].getAttribute('name'))
			if(!deptId) {
				Toast('您已经完成了全部测评');
				return;
			}
			
			if(window.location.href.indexOf('token=') >= 0) {
				if(apFlag === 'true') {
					Toast('您已经测评过啦');
					return;
				}
				window.location.href = jumpUrl + '&deptId=' + deptId;
			} else {
				Toast('请输入正确的链接');
			}
		})
	}
});

