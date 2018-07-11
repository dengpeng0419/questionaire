var MockJS = require('mockjs');

var MockData = {
    //初始化
    '/ap/test/getDeptItems':{
        'code': 0,
        'msg': '',
        'data': {
	        "title|1": ["技术中心->产品战略研究及技术预研分部","财务资产部->财务资产部"],
	        "headList|3-6": [{
		        "headId": "1",
		        "headNo": "题号1，展示",
		        "title": "题目描述1，展示",
		        "bodyList|1-2": [{
			        bodyId: "选项id，暂时没用",
			        bodyNo: "A",
			        title: "选项描述，展示",
			        score: "选项分值11，保存接口上传"
		        }, {
			        bodyId: "选项id，暂时没用",
			        bodyNo: "B",
			        title: "选项描述，展示",
			        score: "选项分值12，保存接口上传"
		        }]
	        }]
        }
    },
    // 提交
    '/ap/test/save': {
        'code': 0,
        'msg': '',
        'data': {
            'isFinished|1': [true, false],
	        'deptId': '24'
        }
    },
    // 部门列表
    '/ap/test/getPeriodDeptList': {
        'code': 0,
        'msg': '',
        'data': {
	        "periodTitle": "测评期次标题",
	        "deptList|1-2": [{
		        token: "1234",
		        deptId: "a",
		        deptName: "部门名称1",
	            apFlag: true
	        }, {
		        token: "1234",
		        deptId: "b",
		        deptName: "部门名称2",
	            apFlag: false
	        }]
        }
    }
}

function ResData(url) {
    var key, data;
    for (key in MockData) {
        if (url.indexOf(key) > -1) {
            data = MockJS.mock(MockData[key]);
            break;
        }
    }
    return data;
}

module.exports = ResData;
