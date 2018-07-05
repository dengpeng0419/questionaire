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
	
	Loading.show();
	$.Ajax({
		customUrl: true,
		url: 'http://116.62.17.128:9090/ap/test/getPeriodDeptList',
		data: {
			token: urlToken,
		},
		success: function(json) {
			Loading.hide();
			//alert(JSON.stringify(json.resultData));
			if (json && json.code == 0) {
				data = json.data;
				var html = template('q_item', data);
				$('.questions').html(html);
				var html = template('q_item', data);
				$('.questions').html(html);
			}
		},
		error: function(xhr, msg) {
			Loading.hide();
			Toast(msg || '系统正在开小差')
		}
	})
	
	$('input').on('click', function(){
		deptId = this.getAttribute('id');
		token = this.getAttribute('value');
		console.log(deptId)
	})
	
	$('.submit_button').on('click', function() {
		deptId = $("input:checked").val();
		if(!deptId) {
			Toast('请选择一个选项');
			return;
		}
		
		if(window.location.href.indexOf('token=') >= 0) {
			window.location.href = jumpUrl + '&deptId=' + deptId;
		} else {
			Toast('请输入正确的链接');
		}
	})
});

