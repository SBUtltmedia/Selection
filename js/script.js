  var currentUser;
  var comments = [];
  var count = 0;
  var serial;
  var range;

  $(function() {

    rangy.init();
    var applierCount = rangy.createClassApplier("hl" + count);

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
          if (true) {
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
        highlightRange(selectedRange, currentUser + count);
        count++;
        highlightPrompt();
      }
    }

    function highlightRange(range) {
      applierCount = rangy.createClassApplier("hl" + count);
      applierCount.applyToRange(range);
      console.log(currentUser);
      linkComments(currentUser + count);
      count++;
    }

    function highlightRange(range, count) {
      applierCount = rangy.createClassApplier("hl" + count);
      applierCount.applyToRange(range);
      linkComments(count);
    }

    function unhighlightCount(count) {
      applierCount = rangy.createClassApplier("hl" + currentUser + count);
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

    function removeAllHighlights() {
      while(count > 0) {
        unhighlightPreviousRange();
      }
    }

    function restoreHighlights() {
      console.log(currentUser);
      comments.forEach(function(comment) {
        $("#commentForm")[0].reset();
        var doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
        var el = doc.getElementById("text");
        var range = rangy.createRange();
        range.selectCharacters(el, comment.start, comment.end);
        console.log(range);
        highlightRange(range, comment.count);
        console.log(comment.count);
        if(comment.netid === currentUser) {
          count++;
        }
      });
    }

    function highlightPrompt() {
      $("#commentForm")[0].reset();
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
              $(this).dialog("close");
              unhighlightPreviousRange();
            }
          },
          {
            text: "Save",
            click: function() {
              $(this).css({
                "visibility": "hidden"
              });
              $(this).dialog("close");
              postContent();
              $("#commentForm")[0].reset();
            }
          }
        ]
      });
    }

    function linkComments(commentID) {
      $("#textFrame").contents().find(".hl" + commentID).on("click", function(e) {
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
              $(this).dialog("close");
            }
          }]
        });
        infoDialog(commentID);
        if(commentID.indexOf(currentUser) == -1) {
          $("#commentForm :input").prop("disabled", true);
        }
        else {
          $("#commentForm :input").prop("disabled", false);
        }
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
      data.count = currentUser + (count - 1);
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
