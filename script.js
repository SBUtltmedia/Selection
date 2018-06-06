  var enableInterval = true;
  var currentUser;
  var comments;




  $(function() {

    var comments = [];
    var count = 0;
    var serial;
    var previousRanges = [];
    rangy.init();
    applierCount = rangy.createClassApplier("hl" + count);
    var userData;
    var enableInterval;
    loadData().then(restoreHighlights);

    function loadData() {
      var deferred = new $.Deferred();
      $("#dialog").css({
        "visibility": "hidden"
      });
      $.get('load.php', function(result) {
        commentData = JSON.parse(result);

        currentUser = commentData.netid;
        console.log(commentData);
        commentData.allUsers.forEach(function(element) {
          console.log(element);
          if (element.name === currentUser) {
            element.comments.sort(function (a, b) {
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



    $("#text").on("mouseup", function() {
      highlightCurrentSelection();
      $('#text').css("pointer-events", "all");
    });

    $('html').on("mousedown", function() {
      $('#text').css("pointer-events", "all");
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
        serial = rangy.serializeRange(getFirstRange());
        applierCount.applyToSelection();
        previousRanges.push(getFirstRange());
        linkComments(count);
        count++;
        applierCount = rangy.createClassApplier("hl" + count);
        highlightPrompt();
      }
    }

    function highlightRange(range) {
      applierCount.applyToRange(range);
      linkComments(count);
      count++;
      console.log(count);
      applierCount = rangy.createClassApplier("hl" + count);

    }

    function unhighlightCount(count) {
      applierCount = rangy.createClassApplier("hl" + count);
      var el = document.getElementById("text");
      var range = rangy.createRange();
      range.selectNode(el);
      applierCount.undoToRange(range);
    }

    function unhighlightPreviousRange() {
      unhighlightCount(--count);
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
        highlightRange(rangy.deserializeRange(comment.serial));
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
      console.log(num);
      $(".hl" + num).on("click", function(e) {
        $("#commentForm :input").prop("disabled", true);
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
      });
    }

    function infoDialog(commentNum) {
      $("#commentForm")[0].reset();
      var comment = getComment(commentNum);
      for (i in comment) {
        $("[name=" + i + "]").val(comment[i]);
      }

      $("#dialog").css({
        "visibility": "visible"
      });
      $("#dialog").dialog();
      // $("#commentForm input[name=start]").val(tagInfo.start);
      // $("#commentForm input[name=end]").val(tagInfo.end);
    }

    function getComment(commentNum) {
      var com = comments.find(function(item) {
        return item.start == commentNum;
      });
      return com;
    }





    function maketagAndDialog(tagInfo) {
      if (tagInfo.start != tagInfo.end) {
        maketag(tagInfo);
        infoDialog(tagInfo);
      }
    }

    function maketag(tagInfo) {

      var text = $("#text")[0].innerHTML
      var textBefore = $('<span/>', {
        "class": "beforeText"
      });
      textBefore.html(text.substring(0, tagInfo.start))
      var highlight = $('<span/>', {
        "class": "highlightText",
        "id": 'span_' + tagInfo.index
      });

      highlight.html(text.substring(tagInfo.start, tagInfo.end))
      //var newText = text.substring(0, tagInfo.start) + "<span id='span_" + tagInfo.index + "'>" + text.substring(tagInfo.start, tagInfo.end) + "</span>"

      var newPre = $('<pre/>', {
        id: "comment_" + tagInfo.index
      })
      // newPre.css({
      //     "z-index": tagInfo.index
      // })

      //        var singlePre = $('<pre/>')
      //        singlePre.css({
      //            "z-index": 2
      //        })

      newPre.append(textBefore)
      newPre.append(highlight)

      highlight.on("mouseover", function(e) {
        console.log("Highlight works", this);


        $("#dialog").css({
          "visibility": "visible"
        });
        $("#dialog").dialog();
        infoDialog(tagInfo);
      });



      $("#highlights").append(newPre)
    }


    function returnComment(commentID) {




      var com = comments.find(function(item) {

        return item.commentID == commentID;
      });

      return com;
    }


    // function infoDialog(tagInfo) {
    //
    //   var comment = returnComment(tagInfo.commentID) || {
    //     "commentID": "temp_" + Date.now(),
    //     "start": tagInfo.start,
    //     "end": tagInfo.end
    //   };
    //
    //   console.log(comment)
    //   for (i in comment) {
    //
    //     $("[name=" + i + "]").val(comment[i])
    //
    //
    //   }
    //
    //   $("#dialog").css({
    //     "visibility": "visible"
    //   });
    //   $("#dialog").dialog();
    //   //          $("#commentForm input[name=start]").val(tagInfo.start);
    //   //
    //   //          $("#commentForm input[name=end]").val(tagInfo.end);
    // }

    function postContent() {
      var data = $("#commentForm").serializeFormJSON();
      data.serial = serial;
      data.start = count-1;
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
