require('../css/index.less');
// 依赖的基础库
var $ = require('zepto');
var template = require('template');

var Toast = require('toast');
var utils = require('utils');
var Loading = require('loading');
var dialog = require('dialog');

$(function() {
	var urlToken = utils.parseQs().token;
	var urlId = utils.parseQs().deptId;
	var initUrl = '/ap/test/getDeptItems';//http://116.62.17.128:9090
	var submitUrl = '/ap/test/save';
	var quitUrl = '/ap/test/drop';
	var data = {};
	var answer = [];        //答案数组
	var curQuesNum = 1;     //当前题目
	var curAnswer = '';     //当前选项内容
	var curQuesNo = 0;      //当前问题No
	var curItemNo = 0;      //当前选项No
	var curName = '';
	var curType = '';
	var touchItem = [];     //phone点击选项
	var touchItems = [];    //pc点击选项
	var department = urlId;
	
	initPage(urlId);
	
	function initPage(id) {
		data = {};
		answer = [];
		curQuesNum = 1;
		curAnswer = '';
		curQuesNo = 0;
		curItemNo = 0;
		curName = '';
		curType = '';
		touchItem = [];
		touchItems = [];
		department = id;
		getInitData(id);
	}
	
	function getInitData(id) {
		//Loading.show();
		$.Ajax({
			customUrl: true,
			url: initUrl,
			data: {
				token: urlToken,
				deptId: id
			},
			success: function(json) {
				//Loading.hide();
				//alert(JSON.stringify(json.resultData));
				if (json && json.code == 0) {
					data = json.data || {};
					initView(data);
				}
			},
			error: function(erro) {
				//Loading.hide();
				Toast(erro.msg || '系统正在开小差')
			}
		})
	}
	
	function initView(data) {
		var html = template('pc_item', data);
		$('.pc_content').html(html);
		
		var tt = data.title.replace('->','<span>->')+'</span>';
		//console.log(data.title)
		var html2 = template('phone_item', data);
		$('.phone_content').html(html2);
		$('.title_phone')[0].innerHTML = tt;
		
		for(var i = 0; i < data.headList.length; i++) {
			answer[i] = 0;
		}
		for(var i = 0; i < data.headList.length; i++) {
			touchItem[i] = 0;
		}
		for(var i = 0; i < data.headList.length; i++) {
			touchItems[i] = 0;
		}
		
		if(curQuesNum === answer.length) {
			$('.next_button').html('提交');
		} else {
			$('.next_button').html('下一题');
		}
		
		addListeners();
	}
	
	function addListeners() {
		$('input').on('click', function(){
			curName = this.getAttribute('name');
			curType = this.getAttribute('type');
			curQuesNo = this.getAttribute('id');
			curItemNo = this.getAttribute('aid');
			touchItem[curQuesNum - 1] = 1;
			touchItems[this.getAttribute('num')] = 1;
			console.log($('#label'+curQuesNo))
			$('.label'+curQuesNo).removeClass('choose-label');
			$('#label'+curQuesNo+curItemNo).addClass('choose-label');
			//this.className('choose-label')//.setAttribute('className', 'choose-label')//addClass('choose-label');
		});
		
		$('.next_button').on('click', function() {
			if(touchItem[curQuesNum - 1] != 1) {
				Toast('请选择一个选项');
				return
			}
			if(curQuesNum <= answer.length) {
				
				if(curType === 'radio') { //单选
					var obj = {};
					obj.itemId = curQuesNo;
					obj.score = $("input[name="+curName+"]:checked").val();
					answer[curQuesNum-1]=obj;
				}
				
				if(curType === 'checkbox') { //多选，目前没用
					var chosenItem = $("input[name="+curName+"]:checked");
					chosenItem.each(function (index, item) {
						curAnswer += $(item).val();
					});
					answer[curQuesNum-1] = curAnswer;
				}
				curQuesNum++;
				
				if(curQuesNum <= answer.length) {
					changeView(curQuesNum);
					$('.before_button').removeClass('hide');
					$('.quit_button').addClass('hide');
				} else {
					submitAnswer(answer, 'phone');
				}
			}
			//console.log(answer)
		});
		
		$('.before_button').on('click', function() {
			curQuesNum--;
			changeView(curQuesNum);
		});
		
		//放弃测评
		$('.quit_button').on('click', function() {
			var quit_client = this.className === 'quit_button' ? 'phone' : 'pc';
			dialog({
				title: '确定放弃该部门的测评吗？',
				type: 2,
				cb: function() {
					//Loading.show();
					$.Ajax({
						customUrl: true,
						url: quitUrl,
						data: {
							token: urlToken,
							deptId: department
						},
						success: function(json) {
							//Loading.hide();
							//alert(JSON.stringify(json.data));
							if (json && json.code == 0) {
								handleSuccess(json.data || {}, quit_client);
							}
						},
						error: function(erro) {
							//Loading.hide();
							Toast(erro.msg || '系统正在开小差')
						}
					})
				}
			})
		})
		
		//pc提交按钮
		$('.submit_button').on('click', function() {
			var erroOne = 0;
			$('.error_bar').addClass('hide');
			
			touchItems.some(function (value, index, arr) {
				if(value == 0 || index === arr.length - 1) {
					erroOne = index + 1;
					return true;
				}
			})
			
			if(erroOne === touchItems.length && touchItems[touchItems.length - 1] != 0) {
				var chooseList = $('input:checked');
				chooseList.each(function (index, item) {
					var obj = {};
					obj.itemId = data.headList[index].headId;
					obj.score = $(item).val();
					answer[index] = obj;
				});
				//console.log(answer);
				submitAnswer(answer, 'pc');
			} else {
				$('#error'+erroOne).removeClass('hide');
				$('#error'+erroOne)[0].scrollIntoView(true);
			}
		});
	}
	
	function changeView(curView) {
		$('.list').addClass('hide');
		$('.list'+curView).removeClass('hide');
		$('.question-current').html(curView);
		if(curView === 1) {
			$('.before_button').addClass('hide');
			$('.quit_button').removeClass('hide');
		}
		if(curView === answer.length) {
			$('.next_button').html('提交');
		} else {
			$('.next_button').html('下一题');
		}
	}
	
	function submitAnswer(answer, client) {
		//Loading.show();
		$.Ajax({
			customUrl: true,
			url: submitUrl,
			data: {
				token: urlToken,
				deptId: department,
				itemList: answer
			},
			success: function(json) {
				//Loading.hide();
				//alert(JSON.stringify(json.data));
				if (json && json.code == 0) {
					handleSuccess(json.data || {}, client);
				}
			},
			error: function(erro) {
				//Loading.hide();
				Toast(erro.msg || '系统正在开小差')
			}
		})
	}
	
	function handleSuccess(data, client) {
		if(data.isFinished) {
			var result = '<div class="submit_result">' +
				'<div class="submit_icon"></div>' +
				'<div class="submit_text">完成测评</div>' +
				'</div>';
			if(client === 'phone') {
				$('.phone_content').html(result);
			} else {
				$('.pc_content').html(result);
			}
		} else {
			initPage(data.deptId);
		}
	}
});

