require('./loading.less');
// 依赖的基础库
var $ = require('zepto');
var tpl = require('template');
var html = require('./loadingtpl');

function Loading() {
  if (!(this instanceof Loading)) {
    return new Loading();
  }
  this.$loading = $(html);

  $(document.body).append(this.$loading);
}
Loading.prototype.show = function() {
  !this.$loading.hasClass('active') && this.$loading.addClass('active');
};
Loading.prototype.hide = function() {
  this.$loading.hasClass('active') && this.$loading.removeClass('active');
}

module.exports = new Loading;