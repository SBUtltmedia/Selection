  var enableInterval = true;
  var currentUser;

  $(function() {

    var comments = [];
    var count = 0;
    var serial;
    var previousRanges = [];
    var mouseX = 0;
    var mouseY = 0;
    rangy.init();
    applierCount = rangy.createClassApplier("hl" + count);
    var userData;
    var enableInterval;
    $('#text').css("pointer-events", "all");
    highlightPrompt();
    $('#dialog').css({
      "visibility": "hidden"
    });
    $('#dialog').dialog("destroy");
    loadData().then(restoreHighlights);

    function loadData() {
      var deferred = new $.Deferred();
      $.get('load.php', function(result) {
        commentData = JSON.parse(result);

        currentUser = commentData.netid;
        console.log(commentData);
        commentData.allUsers.forEach(function(element) {
          console.log(element);
          if (element.name === currentUser) {
            element.comments.sort(function(a, b) {
              return a.start - b.start;
            })
            element.comments.forEach(function(comment, index) {
              console.log(comment);
              comments[index] = comment;
            })
          }
        });
        deferred.resolve();
      })
      return deferred.promise();
    }

    $('#dialog').on("click", function(e) {
      e.stopPropagation();
    })

    $("#text").on("mouseup", function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      console.log(mouseX);
      highlightCurrentSelection();
      //$('#text').css("pointer-events", "all");
    });

    $('html').on("mousedown", function() {
      //$('#text').css("pointer-events", "all");
    });

    $('form').on("submit", function(e) {
      e.preventDefault();
      postContent();
      $("#dialog").dialog("close");
    });

    function getFirstRange() {
      var sel = rangy.getSelection();
      return sel.rangeCount ? sel.getRangeAt(0) : null;
    }

    function highlightCurrentSelection() {
      if (getFirstRange().endOffset != getFirstRange().startOffset) {
        console.log(getFirstRange().endContainer);
        serial = rangy.serializeRange(getFirstRange(), omitChecksum = true);
        previousRanges.push(getFirstRange());
        highlightRange(getFirstRange());
        highlightPrompt();
      }
    }

    function highlightRange(range) {
      applierCount.applyToRange(range);
      linkComments(count);
      count++;
      applierCount = rangy.createClassApplier("hl" + count);

    }

    function unhighlightCount(count) {
      applierCount = rangy.createClassApplier("hl" + count);
      var el = document.getElementById("text");
      var range = rangy.createRange();
      range.selectNodeContents(el);
      applierCount.undoToRange(range);
    }

    function unhighlightPreviousRange() {
      unhighlightCount(--count);
      console.log(count);
    }

    function getHighlightedRanges() {
      var ranges = [];
      for (i = 0; i < count; i++) {
        var elements = document.getElementsByClassName("hl" + i);
        Array.prototype.forEach.call(elements, function(el) {
          var range = rangy.createRange(el);
          if (ranges[i]) {
            ranges[i].union(range);
          } else {
            ranges[i] = range;
          }
        });
      }
      return ranges;
    }

    function restoreHighlights() {
      comments.forEach(function(comment) {
        $("#commentForm")[0].reset();
        var range = rangy.deserializeRange(comment.serial);
        highlightRange(range);
      });
    }

    function highlightPrompt() {
      $("#commentForm")[0].reset();
      var comment = {
        "commentID": "temp_" + Date.now(),
        "count": count,
        "serial": serial
      };
      $("#commentForm :input").prop("disabled", false);
      $("#dialog").css({
        "visibility": "visible"
      });
      $("#dialog").dialog({
        dialogClass: "no-close",
        modal: true,
        buttons: [{
            text: "Remove",
            click: function() {
              $(this).css({
                "visibility": "hidden"
              });
              $(this).dialog("destroy");
              unhighlightPreviousRange();
            }
          },
          {
            text: "Save",
            click: function() {
              $(this).css({
                "visibility": "hidden"
              });
              $(this).dialog("destroy");
              postContent();
              $("#commentForm")[0].reset();
            }
          }
        ]
      });
    }

    function linkComments(num) {
      $(".hl" + num).on("click", function(e) {
        $("#dialog").css({
          "visibility": "visible"
        });
        $("#dialog").dialog({
          dialogClass: "no-close",
          buttons: [{
            text: "Close",
            click: function() {
              $(this).css({
                "visibility": "hidden"
              });
              $(this).dialog("destroy");
            }
          }]
        });
        infoDialog(num);
        $("#commentForm :input").prop("disabled", true);
      });
    }

    function infoDialog(commentNum) {
      $("#commentForm")[0].reset();
      var comment = getComment(commentNum);
      console.log(comment);
      for (i in comment) {
        if($("input[name=" + i +"]").is(":radio")) {
          console.log(comment[i]);
          $("[name=" + i + "]").attr('checked', false);
          $("input[name=" + i +"][value='"+comment[i]+"']").attr('checked', true);
        } else {
          $("[name=" + i + "]").val(comment[i]);
        }
      }

      $("#dialog").css({
        "visibility": "visible"
      });
      $("#dialog").dialog();
    }

    function getComment(commentNum) {
      var com = comments.find(function(item) {
        return item.start == commentNum;
      });
      return com;
    }

    function postContent() {
      var data = $("#commentForm").serializeFormJSON();
      data.serial = serial;
      data.start = count - 1;
      console.log(data);
      comments.push(data);
      $.post("save.php", {
        data: JSON.stringify(data)
      });
      previousRanges = [];
      $("#commentForm")[0].reset();

    }

    (function($) {
      $.fn.serializeFormJSON = function() {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
          if (o[this.name]) {
            if (!o[this.name].push) {
              o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
          } else {
            o[this.name] = this.value || '';
          }
        });
        return o;
      };
    })(jQuery);


  });
