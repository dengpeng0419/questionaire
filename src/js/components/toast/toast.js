require('./toast.less');
// 依赖的基础库
var $ = require('zepto');
var $html = $('<div class="mod-fitterpop"><p></p></div>');
var $p = $html.find('p');
var timerid;
var isShowing = false;

$(document.body).append($html);

function Toast() {

}

Toast.show = function(msg) {
  if (isShowing) {
    return;
  }
  isShowing = true;
  clearTimeout(timerid);
  $p.html(msg);
  $html.addClass('active');
  timerid = setTimeout(function() {
    $html.removeClass('active');
    isShowing = false;
  }, 1500);
};

module.exports = Toast.show;