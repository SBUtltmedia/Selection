  var currentUser;
  var comments = [];
  var count = 0;
  var serial;
  var range;
  var previousRanges = [];
  var userData;

  $(function() {

    rangy.init();
    applierCount = rangy.createClassApplier("hl" + count);

    $('#textFrame').on("load", function() {
      $('#textFrame').contents().find('#text').css("pointer-events", "all");
      $('#textFrame').contents().find('#text').on("mouseup", function(e) {
        highlightCurrentSelection();
      });
      loadData().then(restoreHighlights);
    });
    highlightPrompt();
    $('#dialog').css({
      "visibility": "hidden"
    });
    $('#dialog').dialog("destroy");


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
              return b.count - a.count;
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



    $('html').on("mousedown", function() {
      //$('#text').css("pointer-events", "all");
    });

    $('form').on("submit", function(e) {
      e.preventDefault();
      postContent();
      $("#dialog").dialog("close");
    });

    function getFirstRange() {
      var sel = rangy.getSelection(document.getElementById('textFrame'));
      return sel.rangeCount ? sel.getRangeAt(0) : null;
    }

    function highlightCurrentSelection() {
      var selectedRange = getFirstRange();
      if (selectedRange.endOffset != selectedRange.startOffset) {
        console.log(selectedRange);
        serial = rangy.serializeRange(selectedRange);
        range = selectedRange.toCharacterRange();
        highlightRange(selectedRange);
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
      var doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
      var el = doc.getElementById("text");
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
        var doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
        var el = doc.getElementById("text");
        var range = rangy.createRange();
        range.selectCharacters(el, comment.start, comment.end);
        console.log(range);
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
      $("#textFrame").contents().find(".hl" + num).on("click", function(e) {
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
        return item.count == commentNum;
      });
      return com;
    }

    function postContent() {
      var data = $("#commentForm").serializeFormJSON();
      data.serial = serial;
      data.start = range.start;
      data.end = range.end;
      data.count = count - 1;
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
