require('./dialog.less');
// 依赖的基础库
var $ = require('zepto');
var container = '<div class="mod-dialog"><div class="con"></div></div>';
var type1 = '<p></p><div class="btns border-1px border-top"><a class="full" data-action="close">确定</a></div>';
var type2 = '<p></p><div class="btns border-1px border-top"><a class="border-1px border-right" data-action="exec">确定</a><a data-action="close">取消</a></div>';

function Dialog() {
  var self = this;
  this.$container = $(container);
  this.$con       = this.$container.children('.con');
  this.$container.on('click', 'a', function() {
    var $this = $(this);
    var action = $this.attr('data-action');
    if (action === 'close') {
      self.hide();
    } else if (action === 'exec') {
      Dialog.childInst.cb && (Dialog.childInst.cb(), self.hide());
    }
  });

  $(document.body).append(this.$container);
}
Dialog.prototype.show = function() {
  this.$container.addClass('visible');
};
Dialog.prototype.hide = function() {
  this.$container.removeClass('visible');
};

D.prototype = Object.create(new Dialog);

function D(opts) {
  if (!(this instanceof D)) {
    return new D(opts);
  }
  Dialog.childInst = this;
  this.type = opts.type;
  this.cb   = opts.cb;
  this.title= opts.title;
  this.$type= $(this.type == 1 ? type1 : type2);
  $(this.$type[0]).html(this.title);
  this.$con.html(this.$type);
  this.$container.addClass('visible');
}

module.exports = D;